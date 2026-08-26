import { defineStore } from 'pinia'
import { supabase } from '../supabase'
import {
  awaitFirstHomeSync,
  clearHomeDatabase,
  ensureHomeDatabase,
  ensureHomeReplication,
  getHomeCollection,
  getHomeSyncState,
  resyncHomeReplication,
  subscribeHomeRealtime,
  subscribeHomeSyncState
} from '../services/homeSync'

const PAGE_SIZE = 300
const SEARCH_BATCH_SIZE = 1000
const SEARCH_DEBOUNCE_MS = 350
const REMOTE_SEARCH_CACHE_KEY = 'remoteSearchResults'
const homeRealtimeListeners = new Set()

let remoteSearchDebounceTimer = null

const getLocalDeviceDateTime = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 19).replace('T', ' ')
}

const normalizeTimestamp = (value, fallback = '') => {
  if (!value) {
    return fallback
  }

  return String(value)
    .replace('T', ' ')
    .replace(/([+-]\d{2}:\d{2}|Z)$/i, '')
    .slice(0, 19)
}

const normalizeRecord = (record = {}) => {
  const createdAt = normalizeTimestamp(record.created_at, getLocalDeviceDateTime())
  const updateAt = normalizeTimestamp(record.update_at, createdAt)

  return {
    ...record,
    id: record.id ? String(record.id) : '',
    created_at: createdAt,
    update_at: updateAt
  }
}

const getCreatedAtTimestamp = (record = {}) => {
  return normalizeTimestamp(record.created_at)
}

const compareByMostRecentDesc = (left, right) => {
  const timeL = getCreatedAtTimestamp(left)
  const timeR = getCreatedAtTimestamp(right)

  if (timeL !== timeR) {
    return timeL < timeR ? 1 : -1
  }

  const idL = String(left.id || '')
  const idR = String(right.id || '')
  
  return idL < idR ? 1 : (idL > idR ? -1 : 0)
}

const normalizeComparableValue = (value) => String(value || '').trim().replace(/^0+/, '') || '0'

const buildCasitaVariants = (value) => {
  const raw = String(value || '').trim()
  const bare = normalizeComparableValue(raw)
  const variants = new Set([raw, bare])

  if (bare.length < 2) variants.add(bare.padStart(2, '0'))
  if (bare.length < 3) variants.add(bare.padStart(3, '0'))

  return Array.from(variants).filter(Boolean)
}

const mergeUniqueRowsById = (...rowSets) => {
  const uniqueRows = new Map()

  rowSets.flat().forEach((record) => {
    if (record?.id) {
      uniqueRows.set(String(record.id), record)
    }
  })

  return Array.from(uniqueRows.values()).sort(compareByMostRecentDesc)
}

const loadRemoteSearchCache = () => {
  if (typeof sessionStorage === 'undefined') {
    return { term: '', rows: [] }
  }

  try {
    const cached = JSON.parse(sessionStorage.getItem(REMOTE_SEARCH_CACHE_KEY) || 'null')

    if (!cached?.term || !Array.isArray(cached.rows)) {
      return { term: '', rows: [] }
    }

    return {
      term: String(cached.term),
      rows: cached.rows.map((record) => normalizeRecord(record)).sort(compareByMostRecentDesc)
    }
  } catch (_error) {
    return { term: '', rows: [] }
  }
}

const saveRemoteSearchCache = (term, rows) => {
  if (typeof sessionStorage === 'undefined') {
    return
  }

  try {
    if (!term || !rows.length) {
      sessionStorage.removeItem(REMOTE_SEARCH_CACHE_KEY)
      return
    }

    sessionStorage.setItem(REMOTE_SEARCH_CACHE_KEY, JSON.stringify({ term, rows }))
  } catch (_error) {
    // sessionStorage can fail in private mode or when storage quota is exceeded.
  }
}

const clearRemoteSearchCache = () => {
  if (typeof sessionStorage === 'undefined') {
    return
  }

  try {
    sessionStorage.removeItem(REMOTE_SEARCH_CACHE_KEY)
  } catch (_error) {
    // Ignore storage cleanup errors.
  }
}

const remoteSearchCache = loadRemoteSearchCache()

export const useCasasStore = defineStore('casas', {
  state: () => ({
    allCasas: [],
    casas: [],
    matchedCasas: [],
    loading: false,
    searchLoading: false,
    localReady: false,
    quickLoadReady: false,
    notificationsReady: false,
    homeQuerySubscription: null,
    homeSyncUnsubscribe: null,
    homeRealtimeUnsubscribe: null,
    homeSyncState: getHomeSyncState(),
    search: localStorage.getItem('searchQuery') || '',
    selectedCasa: JSON.parse(localStorage.getItem('selectedCasa')) || null,
    page: 0,
    hasMore: true,
    allLoaded: false,
    remoteFetchedCount: 0,
    remoteHasMore: true,
    listFetchInFlight: false,
    activeFilter: null,
    filteredByLatest: [],
    searchRequestId: 0,
    remoteSearchTerm: remoteSearchCache.term,
    remoteSearchRows: remoteSearchCache.rows
  }),
  getters: {
    filteredCasas: (state) => state.casas
  },
  actions: {
    applySearch(records) {
      if (!this.search || !this.search.trim()) {
        return records
      }

      const searchTerm = this.search.trim().toLowerCase()

      return records.filter((record) => {
        if (/^\d+$/.test(searchTerm)) {
          return normalizeComparableValue(record.casita) === normalizeComparableValue(searchTerm)
        }

        return [record.quien_revisa, record.notas, record.nota_extra]
          .some((value) => String(value || '').toLowerCase().includes(searchTerm))
      })
    },
    getLatestByCasita(records) {
      const latestByCasita = new Map()

      records
        .slice()
        .sort(compareByMostRecentDesc)
        .forEach((record) => {
          const casitaKey = String(record.casita || '')

          if (!latestByCasita.has(casitaKey)) {
            latestByCasita.set(casitaKey, record)
          }
        })

      return Array.from(latestByCasita.values())
    },
    buildAdvancedFilter(records, filter) {
      const sortedRecords = records.slice().sort(compareByMostRecentDesc)

      if (filter?.hasNotes) {
        return sortedRecords.filter((record) => {
          return String(record.notas || '').trim() || String(record.nota_extra || '').trim()
        })
      }

      if (filter?.isToday) {
        return this.buildAdvancedFilter(records, {
          date: getLocalDeviceDateTime().slice(0, 10),
          label: 'Hoy'
        })
      }

      if (filter?.date) {
        const startDate = `${filter.date} 00:00:00`
        const endDate = `${filter.date} 23:59:59`
        const sameDayRecords = sortedRecords.filter((record) => {
          const createdAt = normalizeTimestamp(record.created_at)
          return createdAt >= startDate && createdAt <= endDate
        })

        return this.getLatestByCasita(sameDayRecords)
      }

      const latestRecords = this.getLatestByCasita(sortedRecords)
      const field = filter?.field
      const value = String(filter?.value || '').trim()

      if (!field) {
        return latestRecords
      }

      if (filter?.isArray) {
        const allowedValues = value.split(',').map((item) => normalizeComparableValue(item))
        return latestRecords.filter((record) => {
          return allowedValues.includes(normalizeComparableValue(record[field]))
        })
      }

      return latestRecords.filter((record) => String(record[field] || '').trim() === value)
    },
    recomputeVisibleCasas(resetPage = false) {
      const searchTerm = String(this.search || '').trim()
      const hasRemoteSearchRows = (
        searchTerm &&
        !this.activeFilter &&
        this.remoteSearchTerm === searchTerm &&
        this.remoteSearchRows.length > 0
      )
      const baseRecords = hasRemoteSearchRows
        ? this.remoteSearchRows
        : (this.activeFilter ? this.filteredByLatest : this.allCasas)
      const searchedRecords = hasRemoteSearchRows ? baseRecords : this.applySearch(baseRecords)
      this.matchedCasas = searchedRecords

      if (resetPage || this.page < 1) {
        this.page = 1
      }

      if (this.activeFilter) {
        this.casas = searchedRecords
        this.hasMore = false
        this.allLoaded = true
        return
      }

      if (searchTerm) {
        const visibleCount = this.page * PAGE_SIZE
        this.casas = searchedRecords.slice(0, visibleCount)
        this.hasMore = searchedRecords.length > visibleCount
        this.allLoaded = !this.hasMore
        return
      }

      this.casas = this.allCasas
      this.hasMore = this.remoteHasMore
      this.allLoaded = !this.hasMore
    },
    notifyHomeRealtime(change) {
      homeRealtimeListeners.forEach((listener) => listener(change))
    },
    updateSelectedCasa(rows) {
      if (!this.selectedCasa?.id) {
        return
      }

      const updatedRecord = rows.find((record) => record.id === this.selectedCasa.id)

      if (!updatedRecord) {
        return
      }

      this.selectedCasa = updatedRecord
      localStorage.setItem('selectedCasa', JSON.stringify(updatedRecord))
    },
    patchVisibleRecord(record) {
      const normalized = normalizeRecord(record)
      const recordId = String(normalized.id)
      const existsInList = this.allCasas.some((row) => String(row.id) === recordId)
      const oldestVisible = this.allCasas[this.allCasas.length - 1]
      const belongsInLoadedWindow = !oldestVisible || compareByMostRecentDesc(normalized, oldestVisible) <= 0

      if (existsInList || belongsInLoadedWindow) {
        this.allCasas = mergeUniqueRowsById([normalized], this.allCasas)
      }

      if (this.remoteSearchTerm) {
        const matchesSearch = this.applySearch([normalized]).length > 0

        if (matchesSearch) {
          this.remoteSearchRows = mergeUniqueRowsById([normalized], this.remoteSearchRows)
        } else {
          this.remoteSearchRows = this.remoteSearchRows.filter((row) => String(row.id) !== recordId)
        }
      }

      this.updateSelectedCasa([normalized])

      if (this.activeFilter) {
        this.filteredByLatest = this.buildAdvancedFilter(
          mergeUniqueRowsById([normalized], this.filteredByLatest),
          this.activeFilter
        )
      }

      this.recomputeVisibleCasas()
    },
    removeVisibleRecord(recordId) {
      const id = String(recordId || '')

      if (!id) {
        return
      }

      const withoutRecord = (rows) => rows.filter((record) => String(record.id) !== id)

      this.allCasas = withoutRecord(this.allCasas)
      this.remoteSearchRows = withoutRecord(this.remoteSearchRows)
      this.filteredByLatest = withoutRecord(this.filteredByLatest)

      if (this.selectedCasa?.id && String(this.selectedCasa.id) === id) {
        this.selectedCasa = null
        localStorage.removeItem('selectedCasa')
      }

      this.recomputeVisibleCasas()
    },
    applyRealtimeToVisibleData(change) {
      const record = change?.record

      if (change?.eventType === 'DELETE') {
        this.removeVisibleRecord(record?.id)
        return
      }

      if (!record?.id) {
        return
      }

      this.patchVisibleRecord(record)
    },
    bindHomeSyncState() {
      if (this.homeSyncUnsubscribe) {
        return
      }

      this.homeSyncUnsubscribe = subscribeHomeSyncState((nextState) => {
        this.homeSyncState = nextState
      })
    },
    async ensureLocalReady() {
      if (this.localReady) {
        return
      }

      await ensureHomeDatabase()
      this.bindHomeSyncState()
      if (!this.homeRealtimeUnsubscribe) {
        this.homeRealtimeUnsubscribe = subscribeHomeRealtime((change) => {
          this.applyRealtimeToVisibleData(change)
          this.notifyHomeRealtime(change)
        })
      }
      await ensureHomeReplication()
      this.notificationsReady = true
      this.localReady = true
    },
    async fetchLocalCacheRows() {
      await this.ensureLocalReady()

      if (!this.homeSyncState.firstSyncCompleted) {
        await awaitFirstHomeSync()
      }

      const collection = await getHomeCollection()
      const documents = await collection.find().exec()

      return documents
        .map((document) => normalizeRecord(document.toJSON()))
        .sort(compareByMostRecentDesc)
    },
    async fetchListPage({ reset = false } = {}) {
      if (this.listFetchInFlight && !reset) {
        return
      }

      this.listFetchInFlight = true

      try {
        const from = reset ? 0 : this.remoteFetchedCount
        const to = from + PAGE_SIZE - 1
        const { data, error } = await supabase
          .from('revisiones_casitas')
          .select('*')
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .range(from, to)

        if (error) {
          throw error
        }

        const rows = (data || [])
          .map((record) => normalizeRecord(record))
          .sort(compareByMostRecentDesc)

        if (reset) {
          this.allCasas = rows
          this.remoteFetchedCount = rows.length
        } else {
          this.allCasas = mergeUniqueRowsById(this.allCasas, rows)
          this.remoteFetchedCount += rows.length
        }

        this.remoteHasMore = rows.length === PAGE_SIZE
        this.quickLoadReady = this.allCasas.length > 0
        this.recomputeVisibleCasas(reset)
      } finally {
        this.listFetchInFlight = false
      }
    },
    async fetchCasas() {
      this.loading = true
      try {
        await this.fetchListPage({ reset: true })

        this.ensureLocalReady().catch((error) => {
          console.error('[CasasStore] Error en background sync:', error.message)
        })

        const savedSearch = String(this.search || '').trim()
        if (savedSearch && this.remoteSearchTerm !== savedSearch) {
          this.setSearch(savedSearch)
        }

        this.notificationsReady = true
      } catch (error) {
        console.error('Error fetching casas:', error.message)
      } finally {
        this.loading = false
      }
    },
    async fetchMoreCasas() {
      if (this.loading || !this.hasMore || this.activeFilter) {
        return
      }

      const searchTerm = String(this.search || '').trim()

      if (searchTerm) {
        this.page += 1
        this.recomputeVisibleCasas()
        return
      }

      this.loading = true
      try {
        await this.fetchListPage({ reset: false })
      } catch (error) {
        console.error('Error fetching more casas:', error.message)
      } finally {
        this.loading = false
      }
    },
    async fetchRemoteSearchResults(searchTerm) {
      const trimmedSearch = String(searchTerm || '').trim()

      if (!trimmedSearch || this.activeFilter) {
        return null
      }

      const fetchQueryBatch = async (buildQuery) => {
        const rows = []
        let from = 0

        while (true) {
          const to = from + SEARCH_BATCH_SIZE - 1
          const { data, error } = await buildQuery()
            .order('created_at', { ascending: false })
            .range(from, to)

          if (error) {
            throw error
          }

          const batch = data || []
          rows.push(...batch)

          if (batch.length < SEARCH_BATCH_SIZE) {
            break
          }

          from += SEARCH_BATCH_SIZE
        }

        return rows
      }

      const searches = /^\d+$/.test(trimmedSearch)
        ? [
            () => supabase.from('revisiones_casitas').select('*').in('casita', buildCasitaVariants(trimmedSearch))
          ]
        : [
            () => supabase.from('revisiones_casitas').select('*').ilike('quien_revisa', `%${trimmedSearch}%`),
            () => supabase.from('revisiones_casitas').select('*').ilike('notas', `%${trimmedSearch}%`),
            () => supabase.from('revisiones_casitas').select('*').ilike('nota_extra', `%${trimmedSearch}%`)
          ]

      const batches = await Promise.all(searches.map((buildQuery) => fetchQueryBatch(buildQuery)))
      return mergeUniqueRowsById(...batches.map((batch) => batch.map((record) => normalizeRecord(record))))
    },
    async addCasa(newCasa) {
      try {
        const payload = {
          ...newCasa,
          update_at: newCasa.update_at || getLocalDeviceDateTime()
        }

        console.log('[CasasStore] Iniciando addCasa con datos:', payload)
        
        const { data, error } = await supabase
          .from('revisiones_casitas')
          .insert([payload])
          .select()

        if (error) {
          throw error
        }
        
        return { success: true, data }
      } catch (error) {
        console.error('[CasasStore] Error adding casa:', error.message)
        return { success: false, error }
      }
    },
    async resyncCasas() {
      this.loading = true
      try {
        await this.ensureLocalReady()
        await resyncHomeReplication()
        await this.fetchListPage({ reset: true })
        this.notificationsReady = true
      } catch (error) {
        console.error('Error resyncing casas:', error.message)
      } finally {
        this.loading = false
      }
    },
    async applyAdvancedFilter(filter) {
      if (!filter) {
        this.activeFilter = null
        this.filteredByLatest = []
        this.recomputeVisibleCasas(true)
        return
      }

      this.loading = true
      this.activeFilter = filter
      try {
        const localRows = await this.fetchLocalCacheRows()
        this.filteredByLatest = this.buildAdvancedFilter(localRows, filter)
        this.recomputeVisibleCasas(true)
      } catch (error) {
        console.error('Error applying advanced filter:', error.message)
        this.filteredByLatest = []
      } finally {
        this.loading = false
      }
    },
    clearAdvancedFilter() {
      this.activeFilter = null
      this.filteredByLatest = []
      this.recomputeVisibleCasas(true)
    },
    setSelectedCasa(casa) {
      this.selectedCasa = casa
      localStorage.setItem('selectedCasa', JSON.stringify(casa))
    },
    async fetchCasaById(id) {
      this.loading = true
      try {
        await this.ensureLocalReady()

        const collection = await getHomeCollection()
        const localDocument = await collection.findOne(id).exec()

        if (localDocument) {
          const localCasa = normalizeRecord(localDocument.toJSON())
          this.selectedCasa = localCasa
          localStorage.setItem('selectedCasa', JSON.stringify(localCasa))
          return localCasa
        }

        const { data, error } = await supabase
          .from('revisiones_casitas')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        const remoteCasa = normalizeRecord(data)
        this.selectedCasa = remoteCasa
        localStorage.setItem('selectedCasa', JSON.stringify(remoteCasa))
        return remoteCasa
      } catch (error) {
        console.error('Error fetching casa by id:', error.message)
        return null
      } finally {
        this.loading = false
      }
    },
    subscribeToHomeUpdates(onChange) {
      if (typeof onChange !== 'function') {
        return () => {}
      }

      homeRealtimeListeners.add(onChange)

      return () => {
        homeRealtimeListeners.delete(onChange)
      }
    },
    async clearHomeSessionState() {
      if (remoteSearchDebounceTimer) {
        clearTimeout(remoteSearchDebounceTimer)
        remoteSearchDebounceTimer = null
      }

      if (this.homeQuerySubscription) {
        this.homeQuerySubscription.unsubscribe()
        this.homeQuerySubscription = null
      }

      if (this.homeSyncUnsubscribe) {
        this.homeSyncUnsubscribe()
        this.homeSyncUnsubscribe = null
      }

      if (this.homeRealtimeUnsubscribe) {
        this.homeRealtimeUnsubscribe()
        this.homeRealtimeUnsubscribe = null
      }

      this.allCasas = []
      this.casas = []
      this.matchedCasas = []
      this.filteredByLatest = []
      this.remoteSearchTerm = ''
      this.remoteSearchRows = []
      this.activeFilter = null
      this.localReady = false
      this.quickLoadReady = false
      this.notificationsReady = false
      this.searchLoading = false
      this.searchRequestId += 1
      this.page = 0
      this.hasMore = true
      this.allLoaded = false
      this.remoteFetchedCount = 0
      this.remoteHasMore = true
      this.listFetchInFlight = false
      this.search = ''
      this.selectedCasa = null
      this.homeSyncState = getHomeSyncState()

      localStorage.removeItem('searchQuery')
      localStorage.removeItem('selectedCasa')
      clearRemoteSearchCache()

      await clearHomeDatabase()
      this.homeSyncState = getHomeSyncState()
    },
    setSearch(value) {
      this.search = value
      if (value && value.trim()) {
        localStorage.setItem('searchQuery', value)
      } else {
        localStorage.removeItem('searchQuery')
        this.remoteSearchTerm = ''
        this.remoteSearchRows = []
        clearRemoteSearchCache()
      }

      this.recomputeVisibleCasas(true)

      const searchTerm = String(value || '').trim()
      const requestId = ++this.searchRequestId

      if (remoteSearchDebounceTimer) {
        clearTimeout(remoteSearchDebounceTimer)
        remoteSearchDebounceTimer = null
      }

      if (!searchTerm || this.activeFilter) {
        this.searchLoading = false
        return
      }

      this.searchLoading = true

      remoteSearchDebounceTimer = setTimeout(() => {
        remoteSearchDebounceTimer = null

        if (requestId !== this.searchRequestId) {
          return
        }

        this.fetchRemoteSearchResults(searchTerm)
          .then((remoteRows) => {
            if (requestId !== this.searchRequestId || String(this.search || '').trim() !== searchTerm || !remoteRows) {
              return
            }

            this.remoteSearchTerm = searchTerm
            this.remoteSearchRows = remoteRows
            saveRemoteSearchCache(searchTerm, remoteRows)
            this.recomputeVisibleCasas(true)
          })
          .catch((error) => {
            console.error('[CasasStore] Error en busqueda remota:', error.message)
          })
          .finally(() => {
            if (requestId === this.searchRequestId) {
              this.searchLoading = false
            }
          })
      }, SEARCH_DEBOUNCE_MS)
    },
    async loadSavedSearch() {
      const savedSearch = localStorage.getItem('searchQuery')
      this.search = savedSearch && savedSearch.trim() ? savedSearch : ''
      this.recomputeVisibleCasas(true)

      if (this.search && this.remoteSearchTerm !== this.search.trim()) {
        this.setSearch(this.search)
      }
    }
  }
})

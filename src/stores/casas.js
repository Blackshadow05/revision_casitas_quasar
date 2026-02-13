import { defineStore } from 'pinia'
import { supabase } from '../supabase'

export const useCasasStore = defineStore('casas', {
  state: () => ({
    casas: [],
    loading: false,
    search: '',
    selectedCasa: JSON.parse(localStorage.getItem('selectedCasa')) || null,
    page: 0,
    hasMore: true,
    // Filtros avanzados
    activeFilter: null, // { field: 'trapo_binoculares', value: 'Si', label: 'Con trapo binocular' }
    filteredByLatest: [], // Resultados filtrados por última revisión
    searchFromDB: false // Indicador si la búsqueda se realizó desde la base de datos
  }),
  getters: {
    filteredCasas: (state) => {
      // Si hay un filtro activo, usar los resultados filtrados
      const source = state.activeFilter ? state.filteredByLatest : state.casas
      if (!state.search) {
        state.searchFromDB = false
        return source
      }
      // Si la búsqueda proviene de la base de datos, no filtrar localmente
      if (state.searchFromDB) {
        return source
      }
      // Filtrado local solo cuando no se ha hecho búsqueda en DB
      const searchLower = state.search.toLowerCase()
      return source.filter(c => 
        (c.casita && c.casita.toLowerCase() === searchLower) || 
        (c.quien_revisa && c.quien_revisa.toLowerCase().includes(searchLower))
      )
    }
  },
  actions: {
    async fetchCasas() {
      this.loading = true
      this.page = 0
      this.hasMore = true
      try {
        const { data, error } = await supabase
          .from('revisiones_casitas')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        this.casas = data
        this.hasMore = data.length === 50
        this.page = 1
      } catch (error) {
        console.error('Error fetching casas:', error.message)
      } finally {
        this.loading = false
      }
    },
    async fetchMoreCasas() {
      if (this.loading || !this.hasMore) return
      this.loading = true
      try {
        const { data, error } = await supabase
          .from('revisiones_casitas')
          .select('*')
          .order('created_at', { ascending: false })
          .range(this.page * 50, (this.page + 1) * 50 - 1)

        if (error) throw error
        if (data.length > 0) {
          this.casas = [...this.casas, ...data]
          this.page += 1
        }
        this.hasMore = data.length === 50
      } catch (error) {
        console.error('Error fetching more casas:', error.message)
      } finally {
        this.loading = false
      }
    },
    async addCasa(newCasa) {
      try {
        console.log('[CasasStore] Iniciando addCasa con datos:', newCasa)
        
        const { data, error } = await supabase
          .from('revisiones_casitas')
          .insert([newCasa])
          .select()

        if (error) {
          console.error('[CasasStore] Error de Supabase:', error)
          console.error('[CasasStore] Detalles del error:', error.message, error.details, error.hint)
          throw error
        }
        
        console.log('[CasasStore] Respuesta de Supabase - data:', data)
        
        if (data && data.length > 0) {
          console.log('[CasasStore] Casa agregada exitosamente:', data[0])
          this.casas.unshift(data[0])
        } else {
          console.warn('[CasasStore] No se recibieron datos de la inserción')
        }
        
        return { success: true, data }
      } catch (error) {
        console.error('[CasasStore] Error adding casa:', error.message)
        return { success: false, error }
      }
    },
    async applyAdvancedFilter(filter) {
      // filter: { field: string, value: string, label: string, valueAlt?: string, hasNotes?: boolean, isToday?: boolean, date?: string } o null para limpiar
      if (!filter) {
        this.activeFilter = null
        this.filteredByLatest = []
        return
      }

      this.loading = true
      this.activeFilter = filter
      try {
        let data, error

        // Si es filtro de notas, usar la función que trae TODOS los registros con notas
        if (filter.hasNotes) {
          const result = await supabase.rpc('filter_all_with_notes')
          data = result.data
          error = result.error
        } else if (filter.isToday) {
          // Filtro de registros del día actual
          const result = await supabase.rpc('filter_today')
          data = result.data
          error = result.error
        } else if (filter.date) {
          // Filtro por fecha específica
          // Usar consulta directa en lugar de RPC para manejar correctamente timestamps
          const { data: queryData, error: queryError } = await supabase
            .from('revisiones_casitas')
            .select('*')
            .eq('created_at::date', filter.date)
            .order('created_at', { ascending: false })
          
          data = queryData
          error = queryError
        } else {
          // Usar la función RPC para filtrar última revisión por casita
          const result = await supabase.rpc('filter_latest_revision', {
            p_field: filter.field || null,
            p_value: filter.value || null,
            p_value_alt: filter.valueAlt || null,
            p_has_notes: false
          })
          data = result.data
          error = result.error
        }

        if (error) throw error
        this.filteredByLatest = data || []
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
    },
    setSelectedCasa(casa) {
      this.selectedCasa = casa
      localStorage.setItem('selectedCasa', JSON.stringify(casa))
      console.log('[CasasStore] Casa seleccionada y persistida:', casa.id)
    },
    async fetchCasaById(id) {
      this.loading = true
      try {
        const { data, error } = await supabase
          .from('revisiones_casitas')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        this.selectedCasa = data
        localStorage.setItem('selectedCasa', JSON.stringify(data))
        console.log('[CasasStore] Casa cargada por ID y persistida:', id)
      } catch (error) {
        console.error('Error fetching casa by id:', error.message)
      } finally {
        this.loading = false
      }
    },
    async searchInDatabase(searchTerm) {
      this.loading = true
      this.searchFromDB = true
      try {
        const searchLower = searchTerm.toLowerCase()
        const { data, error } = await supabase
          .from('revisiones_casitas')
          .select('*')
          .or(`casita.eq.${searchLower},quien_revisa.ilike.%${searchLower}%`)
          .order('created_at', { ascending: false })
          .limit(200)

        if (error) throw error
        this.casas = data
        this.hasMore = false
        this.page = 0
      } catch (error) {
        console.error('Error searching in database:', error.message)
      } finally {
        this.loading = false
      }
    }
  }
})

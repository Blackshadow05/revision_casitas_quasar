import { defineStore } from 'pinia'
import { supabase } from '../supabase'

export const useCasasStore = defineStore('casas', {
  state: () => ({
    casas: [],
    loading: false,
    search: localStorage.getItem('searchQuery') || '',
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
      console.log('=== filteredCasas getter ===')
      console.log('activeFilter:', state.activeFilter)
      console.log('filteredByLatest length:', state.filteredByLatest.length)
      console.log('casas length:', state.casas.length)
      console.log('search:', state.search)
      
      // Si hay un filtro activo, usar los resultados filtrados
      const source = state.activeFilter ? state.filteredByLatest : state.casas
      console.log('source length:', source.length)
      
      if (!state.search) {
        state.searchFromDB = false
        return source
      }
      // Si la búsqueda proviene de la base de datos, no filtrar localmente
      if (state.searchFromDB) {
        return source
      }
      // Si la búsqueda es un número, buscar exactamente por casita
      // Si es texto, buscar parcialmente en quien_revisa
      const searchLower = state.search.toLowerCase()
      if (/^\d+$/.test(state.search.trim())) {
        // Búsqueda exacta por número de casita
        return source.filter(c => c.casita && c.casita.toString() === state.search.trim())
      } else {
        // Búsqueda parcial por quien_revisa
        return source.filter(c => 
          c.quien_revisa && c.quien_revisa.toLowerCase().includes(searchLower)
        )
      }
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
          // Filtro por fecha específica - obtener solo la última revisión por casita de esa fecha
          console.log('=== FILTRO FECHA ===')
          console.log('Fecha recibida:', filter.date)
          console.log('Tipo de fecha:', typeof filter.date)
          
          // Usar rango de fechas para manejar correctamente zonas horarias
          const startDate = filter.date + 'T00:00:00'
          const endDate = filter.date + 'T23:59:59'
          
          console.log('Rango:', startDate, 'a', endDate)
          
          const { data: queryData, error: queryError } = await supabase
            .from('revisiones_casitas')
            .select('*', { count: 'exact' })
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .order('created_at', { ascending: false })
            .limit(10000)
          
          console.log('Datos recibidos:', queryData?.length || 0)
          console.log('Error:', queryError)
          
          if (queryError) throw queryError
          
          // Agrupar por casita y obtener solo la última revisión de cada una
          const latestByCasa = {}
          for (const casa of queryData) {
            if (!latestByCasa[casa.casita]) {
              latestByCasa[casa.casita] = casa
            }
          }
          
          data = Object.values(latestByCasa)
          console.log('Resultados finales:', data.length)
        } else {
          // Obtener TODAS las revisiones y filtrar localmente para obtener solo la última por casita
          // luego mostrar solo las que tienen el campo = value en su última revisión
          const { data: allData, error: allError } = await supabase
            .from('revisiones_casitas')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (allError) throw allError
          
          // Agrupar por casita y obtener solo la última revisión de cada una
          const latestByCasa = {}
          for (const casa of allData) {
            if (!latestByCasa[casa.casita]) {
              latestByCasa[casa.casita] = casa
            }
          }
          
          console.log('=== FILTRO DEBUG ===')
          console.log('Filter:', filter)
          console.log('Total de casas agrupadas:', Object.keys(latestByCasa).length)
          console.log('Casitas únicas:', Object.keys(latestByCasa))
          
          // Mostrar valores de bolso_yute para cada casa
          console.log('Valores de bolso_yute en últimas revisiones:')
          Object.values(latestByCasa).forEach(casa => {
            console.log(`  Casita ${casa.casita}: bolso_yute = "${casa.bolso_yute}" (tipo: ${typeof casa.bolso_yute})`)
          })
          
          // Filtrar: mostrar solo las casas donde la última revisión tiene el campo igual al valor especificado
          // O si es un array de valores (como para Yute)
          const field = filter.field
          const value = filter.value
          const isArrayFilter = filter.isArray
          
          console.log('Field:', field)
          console.log('Value:', value)
          console.log('IsArray:', isArrayFilter)
          
          if (isArrayFilter) {
            const allowedValues = value.split(',')
            console.log('Allowed values:', allowedValues)
            
            // Comparar valores permitiendo variaciones con ceros a la izquierda
            data = Object.values(latestByCasa).filter(casa => {
              const fieldValue = String(casa[field]).trim()
              // Verificar si el valor está en la lista (incluye variaciones con ceros a la izquierda)
              const matches = allowedValues.some(av => 
                av === fieldValue || 
                av.replace(/^0+/, '') === fieldValue.replace(/^0+/, '')
              )
              if (matches) {
                console.log(`  MATCH: Casita ${casa.casita} - fieldValue: "${fieldValue}"`)
              }
              return matches
            })
            console.log('Resultados encontrados:', data.length)
            console.log('=== FIN FILTRO ===')
          } else {
            data = Object.values(latestByCasa).filter(casa => casa[field] === value)
          }
        }

        if (error) throw error
        this.filteredByLatest = data || []
        console.log('filteredByLatest guardado:', this.filteredByLatest.length, 'registros')
        console.log('activeFilter:', this.activeFilter)
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
        let query = supabase
          .from('revisiones_casitas')
          .select('*')
          .order('created_at', { ascending: false })
        
        // Si la búsqueda es un número, buscar exactamente por casita
        // Si es texto, buscar parcialmente en quien_revisa
        if (/^\d+$/.test(searchTerm.trim())) {
          // Búsqueda exacta por número de casita
          query = query.eq('casita', searchTerm.trim())
        } else {
          // Búsqueda parcial por quien_revisa
          query = query.ilike('quien_revisa', `%${searchTerm.trim()}%`)
        }
        
        const { data, error } = await query.limit(200)

        if (error) throw error
        this.casas = data
        this.hasMore = false
        this.page = 0
      } catch (error) {
        console.error('Error searching in database:', error.message)
      } finally {
        this.loading = false
      }
    },
    setSearch(value) {
      this.search = value
      if (value && value.trim()) {
        localStorage.setItem('searchQuery', value)
      } else {
        localStorage.removeItem('searchQuery')
      }
    },
    async loadSavedSearch() {
      const savedSearch = localStorage.getItem('searchQuery')
      if (savedSearch && savedSearch.trim()) {
        this.search = savedSearch
        await this.searchInDatabase(savedSearch)
      }
    }
  }
})

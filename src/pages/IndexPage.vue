<template>
  <q-page class="q-pa-md bg-grey-1">
    <!-- Login Modal -->
    <q-dialog v-model="showLoginModal" persistent backdrop-filter="blur(4px)">
      <q-card style="width: 350px; border-radius: 20px;" class="q-pa-lg">
        <div class="text-center q-mb-lg">
          <q-avatar size="100px" font-size="52px" color="primary" text-color="white" icon="lock_person" class="shadow-10 q-mb-md" />
          <div class="text-h5 text-weight-bold" style="color: #2e7d32;">Iniciar Sesión</div>
          <div class="text-grey-7">Acceso exclusivo a revisiones</div>
        </div>

        <q-form @submit="handleLogin" class="q-gutter-md">
          <q-input
            v-model="loginData.username"
            label="Usuario"
            outlined
            rounded
            dense
            :rules="[val => !!val || 'El usuario es requerido']"
          >
            <template v-slot:prepend>
              <q-icon name="person" color="primary" />
            </template>
          </q-input>

          <q-input
            v-model="loginData.password"
            label="Contraseña"
            type="password"
            outlined
            rounded
            dense
            :rules="[val => !!val || 'La contraseña es requerida']"
          >
            <template v-slot:prepend>
              <q-icon name="lock" color="primary" />
            </template>
          </q-input>

          <div v-if="loginError" class="text-negative text-center text-caption q-mt-sm">
            {{ loginError }}
          </div>

          <div class="q-pt-md q-gutter-sm">
            <q-btn
              label="Ingresar"
              type="submit"
              color="primary"
              class="full-width rounded-btn text-weight-bold"
              size="lg"
              unelevated
              :loading="loginLoading"
            />
            <q-btn
              label="Cancelar"
              color="grey-7"
              class="full-width rounded-btn text-weight-bold"
              size="lg"
              flat
              @click="showLoginModal = false"
            />
          </div>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Login Button (Only visible if not logged in) -->
    <div v-if="!isLoggedIn" class="flex flex-center q-pa-xl column">
      <q-icon name="lock_person" size="100px" color="grey-5" class="q-mb-md" />
      <div class="text-h5 text-weight-bold text-grey-7 q-mb-md">Bienvenido a Revisiones de Casitas</div>
      <div class="text-grey-5 q-mb-lg">Inicia sesión para acceder al contenido</div>
      <q-btn
        label="Iniciar Sesión"
        icon="login"
        color="primary"
        size="lg"
        padding="12px 48px"
        rounded
        @click="showLoginModal = true"
      />
    </div>

    <!-- Main Content (Only visible if logged in) -->
    <div v-if="isLoggedIn">
      <!-- Top Bar / Profile Section -->
      <div class="q-mb-md">
        <!-- Fila principal con usuario y botón logout -->
        <div class="row items-center justify-between">
          <div class="row items-center">
            <q-btn flat round icon="person" color="dark" class="bg-grey-2 q-mr-sm" />
            <div>
              <div class="text-weight-bold text-orange-9" style="font-size: 14px;">Bienvenido, {{ currentUser?.Usuario || 'Usuario' }}</div>
              <div class="text-weight-bold text-orange-9" style="font-size: 14px; line-height: 1;">{{ currentUser?.Rol || '' }}</div>
            </div>
          </div>
          <q-btn flat dense no-caps class="logout-btn" @click="handleLogout">
            <q-icon name="logout" size="14px" class="q-mr-xs" />
            <span class="gt-xs">Cerrar</span>
          </q-btn>
        </div>
        <!-- Fila de puntos de sesión (debajo en móvil, al lado en desktop) -->
        <div class="row q-mt-xs items-center">
          <div v-if="daysRemaining > 0" class="session-dots row items-center">
            <q-icon name="history" size="14px" color="grey-7" class="q-mr-xs" />
            <span class="q-mr-xs text-caption text-grey-7">Sesión:</span>
            <div class="row q-gutter-x-xs">
              <q-icon v-for="i in daysRemaining" :key="i" name="circle" size="10px" color="green" />
            </div>
          </div>
        </div>
      </div>

      <div class="text-h5 text-weight-bold q-mb-lg" style="color: #4CAF50;">Revisiones de Casitas</div>

      <!-- Search & Filter Bar -->
      <div class="row items-center q-gutter-x-md q-mb-lg">
        <q-input
          v-model="search"
          placeholder="Buscar por casita o revisor..."
          outlined
          rounded
          dense
          bg-color="white"
          class="search-input col shadow-1"
          clearable
        >
          <template v-slot:prepend>
            <q-icon name="search" class="text-grey-5" />
          </template>
        </q-input>
        <q-btn
          unelevated
          icon="filter_list"
          color="primary"
          class="filter-btn"
          @click="showFilterModal = true"
        />
      </div>

      <!-- Filter Modal -->
      <q-dialog v-model="showFilterModal" position="bottom" backdrop-filter="blur(4px)">
        <q-card style="border-radius: 28px 28px 0 0; max-height: 90vh;">
          <div class="row justify-center q-pt-sm">
            <div style="width: 40px; height: 4px; background: #e0e0e0; border-radius: 2px;"></div>
          </div>

          <q-card-section class="row items-center justify-between q-pb-none">
            <div class="text-h5 text-weight-bolder">Filtros</div>
            <q-btn icon="close" flat round dense v-close-popup class="text-grey-7" />
          </q-card-section>

          <q-separator class="q-my-md q-mx-md" style="opacity: 0.3" />

          <q-card-section class="q-pt-sm scroll" style="max-height: 60vh;">
            <!-- Caja Fuerte Section -->
            <div class="text-subtitle1 text-weight-bold q-mb-sm text-dark">Caja Fuerte</div>
            <div class="row q-gutter-sm q-mb-xl">
              <q-btn
                v-for="tag in ['Check in', 'Check out', 'Upsell', 'Back to back', 'Si', 'No']"
                :key="tag"
                :label="tag"
                unelevated
                rounded
                no-caps
                class="tag-button"
                :class="selectedTags.includes(tag) ? 'tag-active' : 'tag-inactive'"
                @click="toggleTag(tag)"
              />
            </div>

            <!-- Filtrar por Section -->
            <div class="text-subtitle1 text-weight-bold q-mb-sm text-dark">Filtrar por (última revisión por casita)</div>
            <q-select
              v-model="filterBy"
              :options="filterOptions"
              option-label="label"
              option-value="label"
              emit-value
              map-options
              outlined
              rounded
              dense
              bg-color="grey-1"
              class="q-mb-xl custom-select"
            />

            <!-- Fecha Section -->
            <div class="text-subtitle1 text-weight-bold q-mb-sm text-dark">Fecha</div>
            <div class="date-selector row items-center justify-between q-pa-md q-mb-xl" @click="showDatePicker = true">
              <div class="row items-center">
                <q-icon name="calendar_today" color="blue" size="24px" class="q-mr-md" />
                <div class="text-body1 text-grey-8">{{ selectedDate || 'Seleccionar fecha' }}</div>
              </div>
              <q-icon name="chevron_right" color="grey-5" />
            </div>

            <!-- Rapid Filters Space Placeholder -->
            <div class="text-subtitle1 text-weight-bold q-mb-md text-dark">Filtros Rápidos</div>
            <div class="row q-gutter-sm">
              <q-btn
                label="Última revisión por casita"
                icon="today"
                unelevated
                rounded
                no-caps
                color="green-7"
                class="rapid-filter-btn"
                :loading="loading && rapidFilterLoading === 'today'"
                @click="applyRapidFilter('today')"
              />
              <q-btn
                label="Con notas"
                icon="note"
                unelevated
                rounded
                no-caps
                color="amber-8"
                class="rapid-filter-btn"
                :loading="loading && rapidFilterLoading === 'notes'"
                @click="applyRapidFilter('notes')"
              />
            </div>
          </q-card-section>

          <q-card-actions class="row q-col-gutter-sm q-px-md q-pb-lg">
            <div class="col-4">
              <q-btn
                label="Limpiar"
                outline
                rounded
                no-caps
                class="full-width action-btn-cancel"
                @click="clearFilters"
              />
            </div>
            <div class="col-8">
              <q-btn
                color="blue"
                unelevated
                rounded
                no-caps
                class="full-width action-btn-apply"
                :loading="loading"
                @click="applyFilters"
              >
                <q-icon name="check" size="18px" class="q-mr-xs" />
                Aplicar filtros
              </q-btn>
            </div>
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="showDatePicker" backdrop-filter="blur(2px)">
        <q-date v-model="selectedDate" mask="DD/MM/YYYY" flat @update:model-value="showDatePicker = false" />
      </q-dialog>

      <!-- Active Filter Badge -->
      <div v-if="store.activeFilter" class="flex items-center q-mb-md q-gutter-sm">
        <q-chip
          color="blue"
          text-color="white"
          icon="filter_alt"
          removable
          @remove="clearFilters"
          class="text-weight-bold"
        >
          {{ store.activeFilter.label }}
        </q-chip>
        <span v-if="!store.activeFilter.date && !store.activeFilter.hasNotes && !store.activeFilter.isToday" class="text-caption text-grey-6">(última revisión por casita)</span>
      </div>

      <!-- Mostrando registros badge -->
      <div v-if="casas.length > 0" class="flex justify-center q-mb-md">
        <div class="records-badge">Mostrando {{ casas.length }} registros</div>
      </div>

      <q-pull-to-refresh @refresh="refresh" class="full-width">
        <!-- Initial Loading State -->
        <div v-if="loading && casas.length === 0" class="flex flex-center q-my-xl">
          <q-spinner-dots color="primary" size="40px" />
        </div>

        <!-- Empty State if no results -->
        <div v-if="!loading && casas.length === 0" class="flex flex-center q-mt-xl text-center">
          <div>
            <q-icon name="search_off" size="64px" color="grey-4" />
            <div class="text-h6 text-grey-5 q-mt-md">No encontramos nada</div>
            <q-btn flat color="primary" label="Intentar de nuevo" @click="loadData" class="q-mt-sm" />
          </div>
        </div>

        <!-- Cards List with Infinite Scroll (disabled when filter is active) -->
        <q-infinite-scroll
          v-if="isLoggedIn"
          @load="onLoad"
          :offset="250"
          ref="infiniteScroll"
          :disable="!!store.activeFilter"
        >
          <div class="row q-col-gutter-md">
            <div v-for="casa in casas" :key="casa.id" class="col-6 col-md-4">
              <q-card 
                class="modern-card" 
                :class="getThemeClass(casa.caja_fuerte)"
                @click="goToDetails(casa)"
              >
                <div class="card-header row items-center justify-between no-wrap">
                  <div class="casita-number">{{ casa.casita || '00' }}</div>
                  <div class="status-chip row items-center justify-center animated fadeIn" :class="getActionBadgeClass(casa.caja_fuerte)">
                      <q-icon :name="getActionIcon(casa.caja_fuerte)" size="14px" class="q-mr-xs" />
                      <span>{{ casa.caja_fuerte || 'Check in' }}</span>
                  </div>
                </div>

                <div class="card-content q-mt-md">
                  <div class="info-row row items-center no-wrap q-mb-sm">
                    <q-icon name="person_outline" size="20px" class="q-mr-sm text-grey-9" />
                    <div class="text-body1 text-weight-bold text-dark ellipsis">{{ casa.quien_revisa || 'Anónimo' }}</div>
                  </div>
                  <div class="info-row row items-center no-wrap">
                    <q-icon name="access_time" size="20px" class="q-mr-sm text-grey-9" />
                    <div class="text-subtitle2 text-grey-9 text-weight-medium">{{ formatFullDate(casa.created_at) }}</div>
                  </div>
                </div>

                <div class="card-footer">
                  <div v-if="casa.notas && casa.notas.trim() !== ''" class="note-text">
                    {{ getCardNoteText(casa.notas) }}
                  </div>
                </div>
              </q-card>
            </div>
          </div>
          <template v-slot:loading>
            <div class="row justify-center q-my-md">
              <q-spinner-dots color="primary" size="40px" />
            </div>
          </template>
        </q-infinite-scroll>
      </q-pull-to-refresh>
    </div>

    <!-- Floating Action Button (always visible) -->
    <q-page-sticky position="bottom-right" :offset="[20, 20]">
      <q-btn
        fab
        icon="add"
        class="fab-btn"
        @click="addNew"
      />
    </q-page-sticky>
  </q-page>
</template>


<script>
import { computed, defineComponent, onMounted, onUnmounted, ref, watch, reactive } from 'vue'
import { useCasasStore } from '../stores/casas'
import { useAuthStore } from '../stores/auth'
import { date, useQuasar } from 'quasar'
import { useRouter, useRoute } from 'vue-router'

export default defineComponent({
  name: 'IndexPage',
  setup () {
    const store = useCasasStore()
    const authStore = useAuthStore()
    const router = useRouter()
    const route = useRoute()
    const $q = useQuasar()
    const infiniteScroll = ref(null)
    const showFilterModal = ref(false)
    const showDatePicker = ref(false)

    const selectedTags = ref([])
    const selectedDate = ref(null)

    const filterOptions = [
      { label: 'Ver todos', field: null, value: null },
      { label: 'Sin trapo binocular', field: 'trapo_binoculares', value: 'No' },
      { label: 'Con trapo binocular', field: 'trapo_binoculares', value: 'Si' },
      { label: 'Sin sombrero', field: 'sombrero', value: 'No' },
      { label: 'Con sombrero', field: 'sombrero', value: 'Si' },
      { label: 'Sin bulto', field: 'bulto', value: 'No' },
      { label: 'Con bulto', field: 'bulto', value: 'Si' },
      { label: 'Sin cola de caballo', field: 'cola_caballo', value: 'No' },
      { label: 'Con cola de caballo', field: 'cola_caballo', value: 'Si' },
      { label: 'No hay yute', field: 'bolso_yute', value: '0' },
      { label: 'Hay un yute', field: 'bolso_yute', value: '1', valueAlt: '01' },
      { label: 'Hay 2 bolsos Yute', field: 'bolso_yute', value: '2', valueAlt: '02' }
    ]

    const filterBy = ref(filterOptions[0].label)

    const toggleTag = (tag) => {
      const index = selectedTags.value.indexOf(tag)
      if (index > -1) {
        selectedTags.value.splice(index, 1)
      } else {
        selectedTags.value.push(tag)
      }
    }

    const applyFilters = async () => {
      // Si hay fecha seleccionada, filtrar por fecha
      if (selectedDate.value) {
        // El formato de q-date devuelve "YYYY/MM/DD" por defecto
        // Convertirlo directamente a "YYYY-MM-DD" para Supabase
        const dbDate = selectedDate.value.replace(/\//g, '-')
        await store.applyAdvancedFilter({
          date: dbDate,
          label: `Fecha: ${selectedDate.value}`
        })
        showFilterModal.value = false
        return
      }

      const selected = filterOptions.find(f => f.label === filterBy.value)
      if (!selected || !selected.field) {
        // "Ver todos" - limpiar filtro
        store.clearAdvancedFilter()
        showFilterModal.value = false
        return
      }
      await store.applyAdvancedFilter({
        field: selected.field,
        value: selected.value,
        valueAlt: selected.valueAlt || null,
        label: selected.label
      })
      showFilterModal.value = false
    }

    const clearFilters = () => {
      filterBy.value = filterOptions[0].label
      selectedTags.value = []
      selectedDate.value = null
      store.clearAdvancedFilter()
      showFilterModal.value = false
    }

    const rapidFilterLoading = ref(null)

    const applyRapidFilter = async (type) => {
      rapidFilterLoading.value = type
      if (type === 'notes') {
        await store.applyAdvancedFilter({
          hasNotes: true,
          label: 'Con notas'
        })
      } else if (type === 'today') {
        await store.applyAdvancedFilter({
          isToday: true,
          label: 'Última revisión por casita'
        })
      }
      rapidFilterLoading.value = null
      showFilterModal.value = false
    }

    const showLoginModal = ref(false)
    const loginLoading = computed(() => authStore.loading)
    const loginError = computed(() => authStore.error)
    const isLoggedIn = computed(() => authStore.isLoggedIn)
    const currentUser = computed(() => authStore.user)
    const daysRemaining = computed(() => authStore.daysRemaining)

    const loginData = reactive({
      username: '',
      password: ''
    })

    const handleLogin = async () => {
      const result = await authStore.login(loginData.username, loginData.password)
      if (result.success) {
        showLoginModal.value = false
        // Refresh data after login
        await loadData()
      } else {
        $q.notify({
          type: 'negative',
          message: result.message || 'Error al iniciar sesión',
          position: 'top'
        })
      }
    }

    const handleLogout = () => {
      authStore.logout()
      showLoginModal.value = true
    }
    
    const search = computed({
      get: () => store.search,
      set: (val) => store.search = val
    })

    const casas = computed(() => store.filteredCasas)
    const loading = computed(() => store.loading)

    const loadData = async () => {
      await store.fetchCasas()
    }

    const onLoad = async (index, done) => {
      // Si ya hay un proceso de carga en curso (desde onMounted), esperamos o ignoramos
      if (store.loading && index === 1) {
        // Podríamos esperar un poco o simplemente dejar que onMounted termine
        // pero lo mejor es coordinar con el store
        done()
        return
      }

      if (index === 1 && store.casas.length === 0) {
        await loadData()
        done()
      } else if (index > 1) {
        await store.fetchMoreCasas()
        if (!store.hasMore) {
          done(true)
        } else {
          done()
        }
      } else {
        done()
      }
    }

    let searchTimeout = null

    watch(() => store.search, async (newVal) => {
      infiniteScroll.value?.reset()
      clearTimeout(searchTimeout)
      
      searchTimeout = setTimeout(async () => {
        if (newVal && newVal.trim()) {
          await store.searchInDatabase(newVal.trim())
        } else {
          await loadData()
        }
      }, 500)
    })

    const checkSessionInterval = setInterval(() => {
      if (isLoggedIn.value && !authStore.checkSessionExpiry()) {
        showLoginModal.value = true
      }
    }, 60000)

    onUnmounted(() => {
      clearInterval(checkSessionInterval)
    })

    const refresh = async (done) => {
      infiniteScroll.value?.reset()
      await loadData()
      done()
    }

    onMounted(() => {
      if (isLoggedIn.value) {
        loadData()
      }
    })

    const formatFullDate = (val) => {
      try {
        if (!val) return ''
        return date.formatDate(val, 'DD/MM/YYYY HH:mm')
      } catch (e) {
        console.error('Error formatting date:', e)
        return val || ''
      }
    }

    const addNew = () => {
      router.push('/new-revision')
    }

    const goToDetails = (casa) => {
      store.setSelectedCasa(casa)
      router.push('/details')
    }

    const getThemeClass = (status) => {
      if (!status) return 'theme-green'
      const s = status.toLowerCase()
      if (s.includes('check out')) return 'theme-red'
      if (s.includes('guardar upsell')) return 'theme-purple'
      if (s.includes('upsell')) return 'theme-blue'
      if (s.includes('move')) return 'theme-orange'
      if (s === 'si' || s === 'no') return 'theme-gold'
      return 'theme-green'
    }

    const getActionBadgeClass = (status) => {
      if (!status) return 'bg-green-action'
      const s = status.toLowerCase()
      if (s.includes('check out')) return 'bg-red-action'
      if (s.includes('guardar upsell')) return 'bg-purple-action'
      if (s.includes('upsell')) return 'bg-blue-action'
      if (s.includes('move')) return 'bg-orange-action'
      if (s === 'si' || s === 'no') return 'bg-gold-action'
      return 'bg-green-action'
    }

    const getActionIcon = (status) => {
      if (!status) return 'login'
      const s = status.toLowerCase()
      if (s.includes('check out')) return 'logout'
      if (s.includes('guardar upsell')) return 'file_download'
      if (s.includes('upsell')) return 'file_download'
      if (s.includes('move')) return 'sync_alt'
      return 'login'
    }

    const getCardNoteText = (notas) => {
      if (notas && notas.trim() !== '') {
        const maxLength = 30
        if (notas.length > maxLength) {
          return notas.substring(0, maxLength) + '...'
        }
        return notas
      }
      return ''
    }

    return {
      store,
      search,
      casas,
      loading,
      addNew,
      formatFullDate,
      refresh,
      loadData,
      onLoad,
      infiniteScroll,
      getThemeClass,
      getActionBadgeClass,
      getActionIcon,
      getCardNoteText,
      goToDetails,
      showLoginModal,
      loginData,
      loginLoading,
      loginError,
      isLoggedIn,
      currentUser,
      daysRemaining,
      handleLogin,
      handleLogout,
      showFilterModal,
      showDatePicker,
      selectedTags,
      filterBy,
      filterOptions,
      selectedDate,
      toggleTag,
      applyFilters,
      clearFilters,
      rapidFilterLoading,
      applyRapidFilter
    }
  }
})
</script>

<style scoped>
.gradient-text {
  color: #2e7d32; /* Match the image header color */
}

.records-badge {
  background: #31a8ff;
  color: white;
  padding: 6px 20px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  box-shadow: 0 4px 10px rgba(49, 168, 255, 0.3);
}

.modern-card {
  border-radius: 20px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.modern-card:active {
  transform: scale(0.97);
}

/* Themes */
.theme-green {
  background: linear-gradient(135deg, #a8e6cf 0%, rgba(255, 255, 255, 0.85) 100%);
  box-shadow: 0 10px 20px rgba(0, 210, 106, 0.2);
}
.theme-red {
  background: linear-gradient(135deg, #ffcdd2 0%, rgba(255, 255, 255, 0.85) 100%);
  box-shadow: 0 10px 20px rgba(255, 77, 77, 0.2);
}
.theme-purple {
  background: linear-gradient(135deg, #e1bee7 0%, rgba(255, 255, 255, 0.85) 100%);
  box-shadow: 0 10px 20px rgba(147, 51, 234, 0.2);
}
.theme-orange {
  background: linear-gradient(135deg, #ffcc80 0%, rgba(255, 255, 255, 0.85) 100%);
  box-shadow: 0 10px 20px rgba(255, 152, 0, 0.25);
}
.theme-yellow {
  background: linear-gradient(135deg, #fff9c4 0%, rgba(255, 255, 255, 0.85) 100%);
  box-shadow: 0 10px 20px rgba(250, 204, 21, 0.2);
}
.theme-gold {
  background: linear-gradient(135deg, #ffe082 0%, rgba(255, 255, 255, 0.85) 100%);
  box-shadow: 0 10px 20px rgba(255, 215, 0, 0.25);
}
.theme-blue {
  background: linear-gradient(135deg, #b3e5fc 0%, rgba(255, 255, 255, 0.85) 100%);
  box-shadow: 0 10px 20px rgba(33, 150, 243, 0.2);
}

.casita-number {
  font-size: 20px;
  font-weight: 800;
  color: #1a1a1a;
  line-height: 1;
}

.status-chip {
  padding: 6px 14px;
  border-radius: 20px;
  color: white;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  letter-spacing: 0.5px;
}

.bg-green-action { background-color: #00D26A; }
.bg-red-action { background-color: #FF4D4D; }
.bg-purple-action { background-color: #9333EA; }
.bg-orange-action { background-color: #FF9800; }
.bg-yellow-action { background-color: #FACC15; }
.bg-gold-action { background-color: #FFD700; }
.bg-blue-action { background-color: #2196F3; }

.card-content {
  margin: 16px 0;
  flex-grow: 1;
}

.info-row {
  margin-bottom: 4px;
}

.circle-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 14px;
}

.theme-green .circle-badge { background-color: #00D26A; box-shadow: 0 4px 10px rgba(0, 210, 106, 0.4); }
.theme-red .circle-badge { background-color: #FF4D4D; box-shadow: 0 4px 10px rgba(255, 77, 77, 0.4); }
.theme-purple .circle-badge { background-color: #9333EA; box-shadow: 0 4px 10px rgba(147, 51, 234, 0.4); }
.theme-orange .circle-badge { background-color: #FF9800; box-shadow: 0 4px 10px rgba(255, 152, 0, 0.4); }
.theme-yellow .circle-badge { background-color: #FACC15; box-shadow: 0 4px 10px rgba(250, 204, 21, 0.4); }
.theme-gold .circle-badge { background-color: #FFD700; box-shadow: 0 4px 10px rgba(255, 215, 0, 0.4); }
.theme-blue .circle-badge { background-color: #2196F3; box-shadow: 0 4px 10px rgba(33, 150, 243, 0.4); }

.note-text {
  font-size: 11px;
  color: #0505F5;
  font-weight: 500;
  line-height: 1.3;
  padding-top: 4px;
}

.fab-btn {
  background-color: #4CAF50 !important;
  color: white;
  box-shadow: 0 8px 20px rgba(76, 175, 80, 0.4);
  z-index: 1000 !important;
}

.search-input {
  border-radius: 12px;
}

.filter-btn {
  border-radius: 12px;
  width: 40px;
  height: 40px;
}

.logout-btn {
  background: #ffebee;
  color: #c62828;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  min-width: auto;
}

.session-dots {
  background: #f5f5f5;
  padding: 4px 10px;
  border-radius: 20px;
  flex-wrap: nowrap;
}

/* En pantallas grandes, ocultamos la fila inferior */
@media (min-width: 600px) {
  .session-dots {
    max-width: none;
  }
}

.rounded-btn {
  border-radius: 12px;
}

/* Filter Modal Styles */
.tag-button {
  padding: 4px 16px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #e0e0e0;
  transition: all 0.3s;
}

.tag-inactive {
  background: white !important;
  color: #616161;
}

.tag-active {
  background: #2196F3 !important;
  color: white;
  border-color: #2196F3;
}

.custom-select :deep(.q-field__control) {
  height: 54px;
  background: #f5f5f5 !important;
}

.date-selector {
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  background: #ffffff;
  cursor: pointer;
}

.action-btn-cancel {
  height: 54px;
  border-radius: 16px !important;
  font-weight: bold;
}

.action-btn-apply {
  height: 54px;
  border-radius: 16px !important;
  font-weight: bold;
  font-size: 16px;
}

.scroll::-webkit-scrollbar {
  display: none;
}
.scroll {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.rapid-filter-btn {
  font-weight: 600;
  padding: 8px 16px;
}
</style>

<template>
  <q-page class="danos-list-page q-pa-md">
    <!-- Header -->
    <div class="danos-header q-mb-md">
      <div class="text-h5 text-weight-bold">Daños en Casitas</div>
      <div class="text-caption text-grey-6 q-mt-xs">Selecciona una casita para ver o registrar daños</div>
    </div>

    <!-- Search -->
    <q-input
      v-model="searchTerm"
      rounded
      outlined
      dense
      placeholder="Buscar casita..."
      class="q-mb-md"
      bg-color="white"
    >
      <template v-slot:prepend>
        <q-icon name="search" color="grey-5" />
      </template>
      <template v-slot:append>
        <q-icon
          v-if="searchTerm"
          name="clear"
          class="cursor-pointer"
          color="grey-5"
          @click="searchTerm = ''"
        />
      </template>
    </q-input>

    <!-- Loading -->
    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner-dots color="primary" size="40px" />
      <div class="q-mt-sm text-grey-6 text-body2">Cargando casitas…</div>
    </div>

    <!-- Grid of casitas -->
    <div v-else class="casitas-grid">
      <div
        v-for="n in filteredList"
        :key="n"
        class="casita-card"
        :class="{ 'has-reports': damageCounts[n] > 0 }"
        @click="goToDetail(n)"
      >
        <div class="casita-card-inner">
          <!-- Badge -->
          <q-badge
            v-if="damageCounts[n] > 0"
            color="red-5"
            floating
            rounded
            class="damage-badge"
          >
            {{ damageCounts[n] }}
          </q-badge>

          <div class="casita-number">{{ n }}</div>
          <div class="casita-label">Casita</div>

          <!-- Indicator dot -->
          <div
            v-if="damageCounts[n] > 0"
            class="damage-indicator"
          >
            <q-icon name="warning_amber" size="12px" />
            <span>{{ damageCounts[n] }} {{ damageCounts[n] === 1 ? 'reporte' : 'reportes' }}</span>
          </div>
          <div v-else class="no-damage-indicator">
            <q-icon name="check_circle_outline" size="12px" />
            <span>Sin reportes</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty search -->
    <div v-if="!loading && filteredList.length === 0" class="text-center q-pa-xl text-grey-5">
      <q-icon name="search_off" size="48px" />
      <div class="q-mt-sm text-body2">Sin resultados para "{{ searchTerm }}"</div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'

export default defineComponent({
  name: 'DanosCasitasListPage',
  setup () {
    const router = useRouter()
    const searchTerm = ref('')
    const loading = ref(true)
    const damageCounts = ref({})

    const allCasitas = Array.from({ length: 50 }, (_, i) => i + 1)

    const filteredList = computed(() => {
      if (!searchTerm.value) return allCasitas
      return allCasitas.filter(n => String(n).includes(searchTerm.value.trim()))
    })

    const fetchDamageCounts = async () => {
      loading.value = true
      try {
        const { data, error } = await supabase
          .from('danos_casitas')
          .select('casita')

        if (error) throw error

        const counts = {}
        if (data) {
          data.forEach(row => {
            const num = Number(row.casita)
            counts[num] = (counts[num] || 0) + 1
          })
        }
        damageCounts.value = counts
      } catch (err) {
        console.error('Error fetching damage counts:', err)
      } finally {
        loading.value = false
      }
    }

    const goToDetail = (numero) => {
      router.push(`/danos-casitas/${numero}`)
    }

    onMounted(fetchDamageCounts)

    return {
      searchTerm,
      loading,
      damageCounts,
      filteredList,
      goToDetail
    }
  }
})
</script>

<style scoped>
.danos-list-page {
  max-width: 600px;
  margin: 0 auto;
}

.danos-header {
  padding-top: 8px;
}

/* ---- Grid ---- */
.casitas-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

@media (min-width: 420px) {
  .casitas-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 600px) {
  .casitas-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

/* ---- Card ---- */
.casita-card {
  position: relative;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
  border: 1.5px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  -webkit-tap-highlight-color: transparent;
}

.casita-card:active {
  transform: scale(0.96);
}

.casita-card.has-reports {
  border-color: rgba(239, 68, 68, 0.25);
  background: linear-gradient(to bottom, #fff5f5, #fff);
}

.casita-card-inner {
  padding: 14px 8px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.casita-number {
  font-size: 22px;
  font-weight: 800;
  color: #1a1a1a;
  line-height: 1;
}

.casita-label {
  font-size: 10px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.damage-badge {
  font-size: 10px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  top: -5px;
  right: -5px;
}

/* Indicators */
.damage-indicator {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 4px;
  font-size: 9px;
  color: #ef4444;
  font-weight: 600;
}

.no-damage-indicator {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 4px;
  font-size: 9px;
  color: #22c55e;
  font-weight: 500;
}

/* Dark mode */
.body--dark .casita-card {
  background: #1e1e1e;
  border-color: rgba(255, 255, 255, 0.06);
}

.body--dark .casita-card.has-reports {
  background: linear-gradient(to bottom, #2a1a1a, #1e1e1e);
  border-color: rgba(239, 68, 68, 0.3);
}

.body--dark .casita-number {
  color: #e0e0e0;
}
</style>

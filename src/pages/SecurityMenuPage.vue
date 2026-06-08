<template>
  <q-page class="security-menu-page q-pa-md">
    <div class="security-shell">
      <div class="security-header q-mb-md">
        <q-btn flat round dense icon="arrow_back" color="grey-7" @click="goBack" />
        <div class="col">
          <div class="text-h5 text-weight-bold">Seguridad</div>
          <div class="text-caption text-grey-6">Loss & Prevention</div>
        </div>
      </div>

      <div class="security-grid">
        <div
          v-for="item in menuItems"
          :key="item.path"
          class="security-card native-card"
          @click="goTo(item.path)"
        >
          <div class="security-card-icon" :style="{ background: item.gradient }">
            <q-icon :name="item.icon" color="white" size="28px" />
          </div>
          <div class="security-card-body">
            <div class="text-subtitle1 text-weight-bold">{{ item.label }}</div>
            <div class="text-caption text-grey-6">{{ item.description }}</div>
          </div>
          <div class="security-card-count">
            <q-spinner-dots v-if="item.showCount && loading" size="16px" color="grey-4" />
            <q-badge v-else-if="item.showCount && item.count > 0" :label="item.count" color="primary" rounded />
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'
import { buildSecurityMenuItems } from '../services/securityNavigation'

export default defineComponent({
  name: 'SecurityMenuPage',
  setup () {
    const router = useRouter()
    const loading = ref(true)

    const counts = reactive({
      dailyLogs: 0,
      incidents: 0,
      lostFound: 0,
      assetLogs: 0
    })

    const menuItems = buildSecurityMenuItems(counts)

    const goTo = (path) => {
      router.push(path)
    }

    const goBack = () => {
      router.push('/')
    }

    const fetchCounts = async () => {
      loading.value = true
      try {
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayIso = todayStart.toISOString()

        const [logsRes, incidentsRes, lostRes, assetsRes] = await Promise.all([
          supabase.from('daily_logs').select('id', { count: 'exact', head: true }).gte('created_at', todayIso),
          supabase.from('incidents').select('id', { count: 'exact', head: true }).in('status', ['Abierto', 'En Investigación']),
          supabase.from('lost_found').select('id', { count: 'exact', head: true }).eq('status', 'Almacenado'),
          supabase.from('asset_logs').select('id', { count: 'exact', head: true }).gte('timestamp', todayIso)
        ])

        counts.dailyLogs = logsRes.count || 0
        counts.incidents = incidentsRes.count || 0
        counts.lostFound = lostRes.count || 0
        counts.assetLogs = assetsRes.count || 0
      } catch (err) {
        console.error('Error fetching security counts:', err)
      } finally {
        loading.value = false
      }
    }

    onMounted(fetchCounts)

    return {
      goTo,
      menuItems,
      loading,
      goBack
    }
  }
})
</script>

<style scoped>
.security-shell {
  max-width: 600px;
  margin: 0 auto;
}

.security-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.security-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.security-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.security-card:active {
  transform: scale(0.98);
}

.security-card-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.security-card-body {
  flex: 1;
  min-width: 0;
}

.security-card-count {
  flex-shrink: 0;
}
</style>

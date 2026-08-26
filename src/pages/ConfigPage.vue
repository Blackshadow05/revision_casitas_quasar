<template>
  <q-page class="config-page q-pa-md">
    <!-- Header -->
    <div class="config-header q-mb-lg">
      <div class="text-h4 text-weight-bold">Configuración</div>
      <div class="text-caption text-grey-6 q-mt-xs">Gestiona las opciones del sistema</div>
    </div>

    <!-- Main settings group -->
    <div class="settings-card q-mb-md">
      <q-item
        clickable
        v-ripple
        class="settings-item"
        @click="goToReportes"
      >
        <q-item-section avatar>
          <div class="settings-icon-wrap bg-blue">
            <q-icon name="assessment" color="white" size="20px" />
          </div>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-medium">Reportes</q-item-label>
          <q-item-label caption>Generar reportes CSV</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" color="grey-4" size="18px" />
        </q-item-section>
      </q-item>

      <q-separator inset="72px" />

      <q-item
        clickable
        v-ripple
        class="settings-item"
        @click="goToCajaFuerte"
      >
        <q-item-section avatar>
          <div class="settings-icon-wrap bg-purple">
            <q-icon name="lock" color="white" size="20px" />
          </div>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-medium">Caja Fuerte</q-item-label>
          <q-item-label caption>Gestionar cajas fuertes</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" color="grey-4" size="18px" />
        </q-item-section>
      </q-item>

      <q-separator inset="72px" />

      <q-item
        clickable
        v-ripple
        class="settings-item"
        @click="goToDanosCasitas"
      >
        <q-item-section avatar>
          <div class="settings-icon-wrap bg-indigo">
            <q-icon name="report_problem" color="white" size="20px" />
          </div>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-medium">Reporte daños en casitas</q-item-label>
          <q-item-label caption>Registrar y revisar daños reportados</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" color="grey-4" size="18px" />
        </q-item-section>
      </q-item>

      <q-separator inset="72px" />

      <q-item
        clickable
        v-ripple
        class="settings-item"
        @click="goToReportePantallas"
      >
        <q-item-section avatar>
          <div class="settings-icon-wrap bg-red">
            <q-icon name="tv" color="white" size="20px" />
          </div>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-medium">Reporte de pantallas</q-item-label>
          <q-item-label caption>Reportes, movimientos, fotos y PDF</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" color="grey-4" size="18px" />
        </q-item-section>
      </q-item>

      <template v-if="canManageUsers">
        <q-separator inset="72px" />

        <q-item
          clickable
          v-ripple
          class="settings-item"
          @click="goToAdminUsers"
        >
          <q-item-section avatar>
            <div class="settings-icon-wrap bg-teal">
              <q-icon name="people" color="white" size="20px" />
            </div>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-medium">Administrar Usuarios</q-item-label>
            <q-item-label caption>Roles, contraseñas y Google Authenticator</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" color="grey-4" size="18px" />
          </q-item-section>
        </q-item>
      </template>

      <q-separator inset="72px" />

      <q-item
        clickable
        v-ripple
        class="settings-item"
        @click="goToSnippets"
      >
        <q-item-section avatar>
          <div class="settings-icon-wrap bg-deep-orange">
            <q-icon name="code" color="white" size="20px" />
          </div>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-medium">Codigo</q-item-label>
          <q-item-label caption>Biblioteca personal de snippets</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" color="grey-4" size="18px" />
        </q-item-section>
      </q-item>

      <q-separator inset="72px" class="lt-md" />

      <q-item
        clickable
        v-ripple
        class="settings-item lt-md"
        @click="goToDashboardHorario"
      >
        <q-item-section avatar>
          <div class="settings-icon-wrap bg-orange">
            <q-icon name="schedule" color="white" size="20px" />
          </div>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-medium">Dashboard Horario</q-item-label>
          <q-item-label caption>Ver turnos del personal</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" color="grey-4" size="18px" />
        </q-item-section>
      </q-item>
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

defineOptions({ name: 'ConfigPage' })

const router = useRouter()
const authStore = useAuthStore()
const canManageUsers = computed(() => authStore.canManageUsers)

const goToAdminUsers = () => router.push('/admin-users')
const goToReportes = () => router.push('/reportes')
const goToCajaFuerte = () => router.push('/caja-fuerte')
const goToDanosCasitas = () => router.push('/danos-casitas')
const goToReportePantallas = () => router.push('/reporte-pantallas')
const goToDashboardHorario = () => router.push('/dashboard-horario')
const goToSnippets = () => router.push('/snippets')
</script>

<style scoped>
.config-page {
  max-width: 600px;
  margin: 0 auto;
}

.config-header {
  padding-top: 8px;
}

.settings-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.settings-item {
  padding: 12px 16px;
  min-height: 64px;
}

.settings-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.body--dark .settings-card {
  background: #1e1e1e;
  border-color: rgba(255, 255, 255, 0.06);
}
</style>

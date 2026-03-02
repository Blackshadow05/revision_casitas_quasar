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
        @click="goToAdminUsers"
      >
        <q-item-section avatar>
          <div class="settings-icon-wrap bg-teal">
            <q-icon name="people" color="white" size="20px" />
          </div>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-medium">Administrar Usuarios</q-item-label>
          <q-item-label caption>Gestionar usuarios del sistema</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" color="grey-4" size="18px" />
        </q-item-section>
      </q-item>
    </div>

    <!-- Danger zone divider -->
    <div class="danger-divider q-mb-md">
      <q-separator />
      <span class="danger-label">
        <q-icon name="warning_amber" color="warning" size="14px" class="q-mr-xs" />
        Zona avanzada
      </span>
      <q-separator />
    </div>

    <!-- Advanced / danger settings group -->
    <div class="settings-card">
      <q-item
        clickable
        v-ripple
        class="settings-item"
        @click="goToForms"
      >
        <q-item-section avatar>
          <div class="settings-icon-wrap bg-orange">
            <q-icon name="assignment" color="white" size="20px" />
          </div>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-medium">Formularios</q-item-label>
          <q-item-label caption>Configurar formularios del sistema</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" color="grey-4" size="18px" />
        </q-item-section>
      </q-item>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "ConfigPage",
  setup() {
    const router = useRouter();

    const goToAdminUsers = () => {
      router.push("/admin-users");
    };

    const goToReportes = () => {
      router.push("/reportes");
    };

    const goToCajaFuerte = () => {
      router.push("/caja-fuerte");
    };

    const goToDanosCasitas = () => {
      router.push("/danos-casitas");
    };

    const goToForms = () => {
      router.push("/forms");
    };

    return {
      goToAdminUsers,
      goToReportes,
      goToCajaFuerte,
      goToDanosCasitas,
      goToForms,
    };
  },
});
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

.danger-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
}

.danger-label {
  font-size: 0.72rem;
  color: #888;
  white-space: nowrap;
  display: flex;
  align-items: center;
}

.body--dark .settings-card {
  background: #1e1e1e;
  border-color: rgba(255, 255, 255, 0.06);
}
</style>

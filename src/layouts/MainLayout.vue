<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <router-view v-slot="{ Component, route }">
        <component :is="Component" :key="route.fullPath" />
      </router-view>
    </q-page-container>

    <q-header class="app-header bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title class="text-weight-bold">
          Revisiones Casitas
        </q-toolbar-title>

        <div v-if="$q.screen.gt.md" class="appbar-navigation row items-center q-gutter-sm">
          <q-btn flat no-caps dense icon="analytics" label="Operación" class="appbar-nav-btn text-white" @click="goToGoogleSheets" />
          <q-btn flat no-caps dense icon="store" label="Puesto 01" class="appbar-nav-btn text-white" @click="goToPuesto01" />
        </div>

        <q-btn flat round dense icon="menu" class="menu-button text-white" aria-label="Abrir navegación">
          <q-menu anchor="bottom right" self="top right" class="menu-dropdown">
            <q-list style="min-width: 220px">
              <q-item clickable v-close-popup @click="goToHome">
                <q-item-section avatar>
                  <q-icon name="home" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Inicio</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable v-close-popup @click="goToMenus">
                <q-item-section avatar>
                  <q-icon name="restaurant" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Menús</q-item-label>
                </q-item-section>
              </q-item>

              <q-separator />

              <q-item clickable v-close-popup @click="goToConfig">
                <q-item-section avatar>
                  <q-icon name="settings" color="grey" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Configuración</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable v-close-popup @click="goToForms">
                <q-item-section avatar>
                  <q-icon name="assignment" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Forms</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- Mobile/Tablet: Bottom tabs -->
    <q-footer class="custom-footer" v-if="!$q.screen.gt.md">
      <q-tabs
        v-model="tab"
        dense
        class="text-grey-8"
        active-color="primary"
        active-bg-color="light-blue-1"
        indicator-color="transparent"
        align="justify"
        no-caps
      >
        <q-tab name="home" icon="home" label="Inicio" @click="goToHome" />
        <q-tab name="menus" icon="restaurant" label="Menús" @click="goToMenus" />
        <q-tab name="operations" icon="analytics" label="Operación" @click="goToGoogleSheets" />
        <q-tab name="puesto01" icon="store" label="Puesto 01" @click="goToPuesto01" />
        <q-tab name="forms" icon="assignment" label="Forms" @click="goToForms" />
      </q-tabs>
    </q-footer>

    <install-prompt />
  </q-layout>
</template>

<script>
import { ref, defineComponent, watch, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useQuasar } from "quasar";
import InstallPrompt from "../components/InstallPrompt.vue";
import { useCasasStore } from "../stores/casas";
import { useAuthStore } from "../stores/auth";

export default defineComponent({
  name: "MainLayout",
  components: {
    InstallPrompt
  },
  setup() {
    const q = useQuasar();
    const tab = ref("home");
    const router = useRouter();
    const route = useRoute();
    const casasStore = useCasasStore();
    const authStore = useAuthStore();

    // Sincronizar tab con la ruta actual
    watch(() => route.path, (path) => {
      if (path === '/') tab.value = 'home';
      else if (path === '/menus') tab.value = 'menus';
      else if (path === '/google-sheets') tab.value = 'operations';
      else if (path === '/google-sheets/puesto-01') tab.value = 'puesto01';
      else if (path === '/config') tab.value = 'settings';
      else if (path === '/forms') tab.value = 'forms';
    }, { immediate: true });

    // Iniciar/detener suscripción realtime según estado de sesión
    watch(() => authStore.isLoggedIn, (loggedIn) => {
      if (loggedIn) {
        casasStore.subscribeToRealtime((newRecord) => {
          // Solo notificar si el usuario NO está en la pantalla de inicio (ya la ve en tiempo real)
          if (route.path !== '/') {
            q.notify({
              type: 'positive',
              message: `Nueva revisión: Casita ${newRecord.casita || '--'} por ${newRecord.quien_revisa || 'Anónimo'}`,
              caption: 'Toca para ir al inicio',
              position: 'top',
              timeout: 6000,
              icon: 'add_circle',
              actions: [{ label: 'Ver', color: 'white', handler: () => router.push('/') }]
            })
          }
        })
      } else {
        casasStore.unsubscribeFromRealtime()
      }
    }, { immediate: true });

    onUnmounted(() => {
      casasStore.unsubscribeFromRealtime()
    });

    const goToHome = () => {
      router.push("/");
    };

    const goToMenus = () => {
      router.push("/menus");
    };

    const goToGoogleSheets = () => {
      router.push('/google-sheets');
    };

    const goToPuesto01 = () => {
      router.push('/google-sheets/puesto-01');
    };

    const goToForms = () => {
      router.push('/forms');
    };

    const goToConfig = () => {
      router.push("/config");
    };

    return {
      q,
      tab,
      goToHome,
      goToMenus,
      goToGoogleSheets,
      goToPuesto01,
      goToForms,
      goToConfig,
    };
  },
});
</script>

<style>
.app-header {
  border-bottom: none;
}

.appbar-navigation {
  margin-right: 10px;
}

.appbar-nav-btn {
  border-radius: 999px;
  padding: 0 14px;
}

.custom-footer {
  background: white;
  border-top: 1px solid #eee;
  padding-bottom: env(safe-area-inset-bottom);
}

.custom-footer :deep(.q-tab--active .q-tab__icon) {
  background: #e1f5fe;
  padding: 8px 16px;
  border-radius: 15px;
}

.menu-dropdown {
  border-radius: 8px;
  overflow: hidden;
}

.menu-button {
  margin-left: 8px;
}
</style>

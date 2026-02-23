<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <router-view v-slot="{ Component, route }">
        <component :is="Component" :key="route.fullPath" />
      </router-view>
    </q-page-container>

    <!-- Desktop: Dropdown menu button -->
    <q-header class="desktop-nav bg-primary text-white" v-if="$q.screen.gt.md">
      <q-toolbar>
        <q-toolbar-title class="text-weight-bold">
          Revisiones Casitas
        </q-toolbar-title>
        
        <q-btn-dropdown
          flat
          dense
          icon="menu"
          label="Menú"
          class="menu-dropdown text-white"
        >
          <q-list>
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
        </q-btn-dropdown>
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
        <q-tab name="forms" icon="assignment" label="Forms" @click="goToForms" />
        <q-tab name="settings" icon="settings" label="Configuración" class="tab-settings" @click="goToConfig" />
      </q-tabs>
    </q-footer>

    <install-prompt />
  </q-layout>
</template>

<script>
import { ref, defineComponent, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useQuasar } from "quasar";
import InstallPrompt from "../components/InstallPrompt.vue";

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

    // Sincronizar tab con la ruta actual
    watch(() => route.path, (path) => {
      if (path === '/') tab.value = 'home';
      else if (path === '/menus') tab.value = 'menus';
      else if (path === '/config') tab.value = 'settings';
      else if (path === '/forms') tab.value = 'forms';
      // Agregue más si es necesario
    }, { immediate: true });

    const goToHome = () => {
      router.push("/");
    };

    const goToMenus = () => {
      router.push("/menus");
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
      goToForms,
      goToConfig,
    };
  },
});
</script>

<style>
.custom-footer {
  background: white;
  border-top: 1px solid #eee;
  padding-bottom: env(safe-area-inset-bottom);
}

.tab-settings :deep(.q-tab__label) {
  font-size: 10px;
  line-height: 1;
  max-width: 60px;
  text-align: center;
}

.custom-footer :deep(.q-tab--active .q-tab__icon) {
  background: #e1f5fe;
  padding: 8px 16px;
  border-radius: 15px;
}

.desktop-nav {
  border-bottom: none;
}

.menu-dropdown {
  border-radius: 8px;
  color: white;
}

.menu-dropdown :deep(.q-btn__content) {
  font-weight: 500;
}
</style>

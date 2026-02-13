<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <router-view v-slot="{ Component, route }">
        <component :is="Component" :key="route.fullPath" />
      </router-view>
    </q-page-container>

    <q-footer class="custom-footer">
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
        <q-tab name="settings" icon="settings" label="Configuración" class="tab-settings" />
      </q-tabs>
    </q-footer>

    <install-prompt />
  </q-layout>
</template>

<script>
import { ref, defineComponent, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import InstallPrompt from "../components/InstallPrompt.vue";

export default defineComponent({
  name: "MainLayout",
  components: {
    InstallPrompt
  },
  setup() {
    const tab = ref("home");
    const router = useRouter();
    const route = useRoute();

    // Sincronizar tab con la ruta actual
    watch(() => route.path, (path) => {
      if (path === '/') tab.value = 'home';
      else if (path === '/menus') tab.value = 'menus';
      // Agregue más si es necesario
    }, { immediate: true });

    const goToHome = () => {
      router.push("/");
    };

    const goToMenus = () => {
      router.push("/menus");
    };

    return {
      tab,
      goToHome,
      goToMenus,
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
</style>

<template>
  <q-layout view="lHh Lpr lFf" :class="{ 'app-shell': isMobileNav }">
    <q-header class="app-header bg-primary text-white">
      <q-toolbar class="app-header__toolbar">
        <div v-if="authStore.isLoggedIn && $q.screen.gt.md" class="desktop-shortcuts row no-wrap items-center">
          <q-btn
            flat
            no-caps
            dense
            icon="home"
            label="Inicio"
            class="appbar-nav-btn text-white"
            @click="goToHome"
          />
          <q-btn
            flat
            no-caps
            dense
            icon="restaurant"
            label="Menús"
            class="appbar-nav-btn text-white"
            @click="goToMenus"
          />
          <q-btn
            flat
            no-caps
            dense
            icon="schedule"
            label="Horarios"
            class="appbar-nav-btn text-white"
            @click="goTo('/dashboard-horario')"
          />
          <q-btn
            v-if="isEstebanB"
            flat
            no-caps
            dense
            icon="local_police"
            label="Puesto 01"
            class="appbar-nav-btn text-white"
            @click="goTo('/puesto-01')"
          />
          <q-btn
            v-for="item in desktopSecurityLinks"
            :key="item.path"
            flat
            no-caps
            dense
            :icon="item.icon"
            :label="item.label"
            class="appbar-nav-btn text-white"
            @click="goTo(item.path)"
          />
        </div>

        <q-space />

        <q-btn v-if="authStore.isLoggedIn" flat round dense icon="menu" class="menu-button text-white" aria-label="Abrir navegación">
          <q-menu anchor="bottom right" self="top right" class="menu-dropdown">
            <q-list role="menu" style="min-width: 220px">
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

              <q-item v-if="isEstebanB" clickable v-close-popup @click="goTo('/puesto-01')">
                <q-item-section avatar>
                  <q-icon name="local_police" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Puesto 01</q-item-label>
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

              <q-item v-if="authStore.isLoggedIn" clickable v-close-popup @click="goToForms">
                <q-item-section avatar>
                  <q-icon name="assignment" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Forms</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="false" clickable v-close-popup @click="goToSeguridad">
                <q-item-section avatar>
                  <q-icon name="security" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Seguridad</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container :id="appPageScrollId" class="app-page-container">
      <router-view v-slot="{ Component, route }">
        <transition mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </transition>
      </router-view>
    </q-page-container>

    <!-- Mobile/Tablet: Bottom tabs (in-flow, no position:fixed) -->
    <q-footer class="custom-footer" v-if="isMobileNav" unelevated>
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
        <q-tab v-if="isEstebanB" name="puesto01" icon="local_police" label="Puesto 01" @click="goTo('/puesto-01')" />
        <q-tab v-if="false" name="security" icon="security" label="Seguridad" @click="goToSeguridad" />
        <q-tab v-if="authStore.isLoggedIn" name="forms" icon="assignment" label="Forms" @click="goToForms" />
      </q-tabs>
    </q-footer>

    <install-prompt />
  </q-layout>
</template>

<script>
import { ref, computed, defineComponent, watch, onMounted, onUnmounted } from "vue";
import { notify } from '../utils/notify'
import { useRouter, useRoute } from "vue-router";
import { useQuasar } from "quasar";
import InstallPrompt from "../components/InstallPrompt.vue";
import { useCasasStore } from "../stores/casas";
import { useAuthStore } from "../stores/auth";
import { desktopSecurityLinks } from "../services/securityNavigation";
import { playSound } from "../utils/sounds";
import { APP_PAGE_SCROLL_ID } from "../utils/appScroll";

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
    const isMobileNav = computed(() => !q.screen.gt.md);
    // Puesto 01 solo visible para el usuario Esteban B
    const isEstebanB = computed(() => authStore.user?.Usuario === "Esteban B");

    const isEditableFocused = () => {
      const el = document.activeElement;
      if (!el || el === document.body) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
    };

    const syncMobileShell = () => {
      const mobile = !q.screen.gt.md;
      document.documentElement.classList.toggle("mobile-app-shell", mobile);
      document.body.classList.toggle("mobile-app-shell", mobile);

      if (!mobile) {
        document.documentElement.style.removeProperty("--app-shell-height");
        return;
      }

      let height = window.innerHeight;
      const vv = window.visualViewport;
      // Solo encoger al visualViewport con un input activo (teclado).
      // Si usáramos visualViewport siempre, bugs de iOS dejarían el menú a media pantalla.
      if (vv && isEditableFocused()) {
        height = vv.height;
      }
      document.documentElement.style.setProperty("--app-shell-height", `${Math.round(height)}px`);

      if (document.scrollingElement && document.scrollingElement.scrollTop !== 0) {
        document.scrollingElement.scrollTop = 0;
      }
    };
    let stopHomeUpdates = null;
    const detachHomeUpdates = () => {
      if (typeof stopHomeUpdates === 'function') {
        stopHomeUpdates();
        stopHomeUpdates = null;
      }
    };

    // Sincronizar tab con la ruta actual
    watch(() => route.path, (path) => {
      if (path === '/') tab.value = 'home';
      else if (path === '/menus') tab.value = 'menus';
      else if (path === '/puesto-01') tab.value = 'puesto01';
      else if (path.startsWith('/seguridad')) tab.value = 'security';
      else if (path === '/forms') tab.value = 'forms';
      else tab.value = '';
    }, { immediate: true });

    // Iniciar/detener suscripción realtime según estado de sesión
    watch(() => authStore.isLoggedIn, async (loggedIn) => {
      detachHomeUpdates();

      if (loggedIn) {
        await casasStore.ensureLocalReady();
        stopHomeUpdates = casasStore.subscribeToHomeUpdates((change) => {
          const record = change?.record || {}
          const eventType = change?.eventType || 'INSERT'
          const casita = record.casita || '--'
          const usuario = record.quien_revisa || 'Anónimo'

          let type = 'positive'
          let icon = 'add_circle'
          let caption = 'Nueva revisión recibida'

          if (eventType === 'UPDATE') {
            type = 'info'
            icon = 'update'
            caption = 'Revisión actualizada'
          } else if (eventType === 'DELETE') {
            type = 'warning'
            icon = 'delete'
            caption = 'Revisión eliminada'
          }

          playSound('receive')
          notify({
            type,
            message: `Revisión casita ${casita} por ${usuario}`,
            caption,
            position: 'top',
            timeout: 6000,
            icon,
            actions: [{ label: 'Ver', color: 'white', handler: () => router.push('/') }]
          })
        })
      }
    }, { immediate: true });

    watch(isMobileNav, () => {
      syncMobileShell();
    }, { immediate: true });

    onMounted(() => {
      syncMobileShell();
      window.addEventListener("resize", syncMobileShell);
      window.addEventListener("orientationchange", syncMobileShell);
      window.addEventListener("focusin", syncMobileShell);
      window.addEventListener("focusout", syncMobileShell);
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", syncMobileShell);
        window.visualViewport.addEventListener("scroll", syncMobileShell);
      }
    });

    onUnmounted(() => {
      detachHomeUpdates();
      window.removeEventListener("resize", syncMobileShell);
      window.removeEventListener("orientationchange", syncMobileShell);
      window.removeEventListener("focusin", syncMobileShell);
      window.removeEventListener("focusout", syncMobileShell);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", syncMobileShell);
        window.visualViewport.removeEventListener("scroll", syncMobileShell);
      }
      document.documentElement.classList.remove("mobile-app-shell");
      document.body.classList.remove("mobile-app-shell");
      document.documentElement.style.removeProperty("--app-shell-height");
    });

    const goToHome = () => {
      router.push("/");
    };

    const goToMenus = () => {
      router.push("/menus");
    };

    const goTo = (path) => {
      router.push(path);
    };

    const goToForms = () => {
      router.push('/forms');
    };

    const goToConfig = () => {
      router.push("/config");
    };

    const goToSeguridad = () => {
      router.push("/seguridad");
    };

    return {
      q,
      tab,
      authStore,
      isEstebanB,
      isMobileNav,
      appPageScrollId: APP_PAGE_SCROLL_ID,
      desktopSecurityLinks,
      goTo,
      goToHome,
      goToMenus,
      goToForms,
      goToConfig,
      goToSeguridad,
    };
  },
});
</script>

<style>
.app-header {
  border-bottom: none;
  padding-top: env(safe-area-inset-top);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

.app-header__toolbar {
  min-height: 52px;
}

.appbar-nav-btn {
  border-radius: 999px;
  padding: 0 12px;
}

.desktop-shortcuts {
  gap: 4px;
  margin-left: 16px;
  overflow-x: auto;
  scrollbar-width: none;
}

.desktop-shortcuts::-webkit-scrollbar {
  display: none;
}

.custom-footer {
  background: white;
  border-top: 1px solid #eee;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
}

.custom-footer .q-tab--active .q-tab__icon {
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

.app-page-container {
  position: relative;
}
</style>

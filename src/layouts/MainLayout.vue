<template>
  <q-layout view="lHh Lpr lFf" :class="{ 'app-shell': isMobileNav }">
    <q-header class="app-header">
      <q-toolbar class="app-header__toolbar">
        <div class="app-header__brand row no-wrap items-center">
          <q-icon name="home" size="22px" color="primary" />
          <span class="app-header__title">Casitas</span>
        </div>

        <div v-if="authStore.isLoggedIn && $q.screen.gt.md" class="desktop-shortcuts row no-wrap items-center">
          <q-btn
            flat
            no-caps
            dense
            icon="home"
            label="Inicio"
            class="appbar-nav-btn"
            :class="{ 'appbar-nav-btn--active': isActive('/') }"
            @click="goToHome"
          />
          <q-btn
            flat
            no-caps
            dense
            icon="restaurant"
            label="Menús"
            class="appbar-nav-btn"
            :class="{ 'appbar-nav-btn--active': isActive('/menus') }"
            @click="goToMenus"
          />
          <q-btn
            flat
            no-caps
            dense
            icon="schedule"
            label="Horarios"
            class="appbar-nav-btn"
            :class="{ 'appbar-nav-btn--active': isActive('/dashboard-horario') }"
            @click="goTo('/dashboard-horario')"
          />
          <q-btn
            v-if="isEstebanB"
            flat
            no-caps
            dense
            icon="local_police"
            label="Puesto 01"
            class="appbar-nav-btn"
            :class="{ 'appbar-nav-btn--active': isActive('/puesto-01') }"
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
            class="appbar-nav-btn"
            :class="{ 'appbar-nav-btn--active': isActive(item.path) }"
            @click="goTo(item.path)"
          />
        </div>

        <q-space />

        <q-btn v-if="authStore.isLoggedIn" flat round dense icon="menu" class="menu-button text-grey-8" aria-label="Abrir navegación">
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
        class="bottom-nav"
        indicator-color="transparent"
        align="justify"
        no-caps
        switch-indicator
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
        document.documentElement.style.removeProperty("--app-visual-offset");
        document.documentElement.style.removeProperty("--app-keyboard-inset");
        document.documentElement.classList.remove("auth-keyboard-open");
        document.documentElement.classList.remove("app-keyboard-open");
        return;
      }

      let height = window.innerHeight;
      let offset = 0;
      let keyboardInset = 0;
      const vv = window.visualViewport;
      const editing = isEditableFocused();
      const inAuth = Boolean(document.activeElement?.closest?.(".auth-sheet"));
      if (vv && editing) {
        keyboardInset = Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0));
      }
      // Encoger el shell solo en el login. En el formulario un cambio de altura
      // en el focus cierra el teclado de iOS; ahí elevamos con padding + scroll.
      if (vv && editing && inAuth) {
        height = vv.height;
        offset = vv.offsetTop || 0;
      }
      document.documentElement.style.setProperty("--app-shell-height", `${Math.round(height)}px`);
      document.documentElement.style.setProperty("--app-visual-offset", `${Math.round(offset)}px`);
      document.documentElement.style.setProperty("--app-keyboard-inset", `${Math.round(keyboardInset)}px`);
      document.documentElement.classList.toggle(
        "app-keyboard-open",
        editing && keyboardInset > 80
      );
      document.documentElement.classList.toggle(
        "auth-keyboard-open",
        editing && Boolean(document.activeElement?.closest?.(".auth-sheet"))
      );

      if (!editing && document.scrollingElement && document.scrollingElement.scrollTop !== 0) {
        document.scrollingElement.scrollTop = 0;
      }
    };

    let revealTimer = null;
    const revealAuthInput = (target) => {
      if (!target?.closest?.(".auth-sheet")) return;
      if (revealTimer) window.clearTimeout(revealTimer);
      revealTimer = window.setTimeout(() => {
        revealTimer = null;
        if (document.activeElement !== target) return;
        target.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
      }, 320);
    };

    const onFocusIn = (event) => {
      syncMobileShell();
      revealAuthInput(event.target);
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
      window.addEventListener("focusin", onFocusIn);
      window.addEventListener("focusout", syncMobileShell);
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", syncMobileShell);
        window.visualViewport.addEventListener("scroll", syncMobileShell);
      }
    });

    onUnmounted(() => {
      detachHomeUpdates();
      if (revealTimer) window.clearTimeout(revealTimer);
      window.removeEventListener("resize", syncMobileShell);
      window.removeEventListener("orientationchange", syncMobileShell);
      window.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("focusout", syncMobileShell);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", syncMobileShell);
        window.visualViewport.removeEventListener("scroll", syncMobileShell);
      }
      document.documentElement.classList.remove("mobile-app-shell");
      document.documentElement.classList.remove("app-keyboard-open");
      document.documentElement.classList.remove("auth-keyboard-open");
      document.documentElement.classList.remove("nr-field-editing");
      document.body.classList.remove("mobile-app-shell");
      document.documentElement.style.removeProperty("--app-shell-height");
      document.documentElement.style.removeProperty("--app-visual-offset");
      document.documentElement.style.removeProperty("--app-keyboard-inset");
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

    const isActive = (path) => {
      if (path === "/") return route.path === "/";
      return route.path === path || route.path.startsWith(path + "/");
    };

    return {
      q,
      tab,
      authStore,
      isEstebanB,
      isMobileNav,
      appPageScrollId: APP_PAGE_SCROLL_ID,
      desktopSecurityLinks,
      isActive,
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
/* Header blanco y compacto: el azul queda para el estado activo */
.app-header {
  background: var(--surface);
  color: var(--text-primary);
  border-bottom: 1px solid var(--border);
  box-shadow: none;
  padding-top: env(safe-area-inset-top);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

.app-header__toolbar {
  min-height: 48px;
  padding: 0 8px 0 16px;
}

.app-header__brand {
  gap: 8px;
}

.app-header__title {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.3px;
  color: var(--text-primary);
}

.appbar-nav-btn {
  border-radius: var(--radius-sm);
  padding: 0 10px;
  min-height: 32px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.appbar-nav-btn .q-icon {
  font-size: 18px;
}

.appbar-nav-btn--active {
  color: var(--brand);
  background: var(--brand-soft);
  font-weight: 600;
}

.desktop-shortcuts {
  gap: 2px;
  margin-left: 20px;
  overflow-x: auto;
  scrollbar-width: none;
}

.body--dark .app-header {
  background: #1e1e1e;
  color: #eceff1;
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.body--dark .app-header__title {
  color: #eceff1;
}

.body--dark .appbar-nav-btn {
  color: #b0bec5;
}

.desktop-shortcuts::-webkit-scrollbar {
  display: none;
}

.custom-footer {
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
}

/* Bottom nav tipo sistema móvil */
.bottom-nav .q-tab {
  min-height: 64px;
  padding: 10px 8px 12px;
  color: #8e8e93;
}

.bottom-nav .q-tab__content {
  min-width: 0;
  padding: 0;
  gap: 2px;
}

.bottom-nav .q-tab__icon {
  font-size: 22px;
}

.bottom-nav .q-tab__label {
  font-size: 10px;
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: 0.01em;
}

.bottom-nav .q-tab--active {
  color: var(--teal, #0f766e);
}

.bottom-nav .q-tab--active .q-tab__label {
  font-weight: 600;
}

.bottom-nav .q-tab__indicator {
  height: 2px;
  width: 20px;
  left: 50%;
  right: auto;
  transform: translateX(-50%);
  border-radius: 0 0 2px 2px;
  background: var(--teal, #0f766e) !important;
}

/* Sin ondas ni fondo en el tap */
.bottom-nav .q-focus-helper {
  display: none;
}

.menu-dropdown {
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.menu-button {
  margin-left: 8px;
}

.app-page-container {
  position: relative;
}
</style>

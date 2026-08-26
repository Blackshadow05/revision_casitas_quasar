<template>
  <q-page class="home-page q-pa-md bg-grey-1">
    <!-- Login Modal -->
    <q-dialog v-model="showLoginModal" persistent class="auth-dialog" backdrop-filter="blur(18px)">
      <q-card class="auth-sheet">
        <button
          type="button"
          class="auth-sheet__close"
          aria-label="Cerrar"
          :disabled="loginLoading"
          @click="showLoginModal = false"
        >
          <q-icon name="close" size="18px" />
        </button>

        <header class="auth-sheet__header">
          <div class="auth-sheet__mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M5 14.2 16 5l11 9.2V26a1.5 1.5 0 0 1-1.5 1.5h-7.2v-7.4h-6.6v7.4H6.5A1.5 1.5 0 0 1 5 26V14.2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
            </svg>
          </div>
          <p class="auth-sheet__eyebrow">Revisiones · Casitas</p>
          <h2 class="auth-sheet__title">Inicia sesión</h2>
        </header>

        <div v-if="loginError" class="auth-sheet__alert" role="alert">
          {{ loginError }}
        </div>

        <q-btn
          type="button"
          class="auth-sheet__google"
          unelevated
          no-caps
          :loading="loginLoading"
          :disable="loginLoading"
          @click="handleGoogleLogin"
        >
          <qn-google-mark class="auth-sheet__google-mark" />
          <span>Continuar con Google</span>
        </q-btn>

        <p v-if="googleLoginPending" class="auth-sheet__hint">
          Se abrió Google en el navegador. Luego te pedirá el código de Authenticator.
        </p>

        <div class="auth-sheet__rule" role="separator">
          <span>o con usuario</span>
        </div>

        <q-form class="auth-sheet__form" @submit="handleLogin">
          <div class="auth-sheet__field">
            <q-input
              v-model="loginData.username"
              label="Usuario"
              borderless
              dense
              autocomplete="username"
              :rules="[val => !!val || 'El usuario es requerido']"
            />
          </div>

          <div class="auth-sheet__field">
            <q-input
              v-model="loginData.password"
              label="Contraseña"
              :type="showLoginPassword ? 'text' : 'password'"
              borderless
              dense
              autocomplete="current-password"
              :rules="[val => !!val || 'La contraseña es requerida']"
            >
              <template v-slot:append>
                <q-icon
                  :name="showLoginPassword ? 'visibility' : 'visibility_off'"
                  class="cursor-pointer auth-sheet__eye"
                  @click="showLoginPassword = !showLoginPassword"
                />
              </template>
            </q-input>
          </div>

          <q-btn
            label="Ingresar"
            type="submit"
            class="auth-sheet__submit"
            unelevated
            no-caps
            :loading="loginLoading"
          />
        </q-form>

        <button
          type="button"
          class="auth-sheet__alt"
          :disabled="loginLoading"
          @click="switchToAuthenticatorLogin"
        >
          Usar Google Authenticator
        </button>
      </q-card>
    </q-dialog>

    <authenticator-login-dialog
      v-model="showAuthenticatorModal"
      @success="handleAuthenticatorSuccess"
    />

    <q-banner
      v-if="showGoogleReturnHint"
      class="bg-positive text-white q-mb-md"
      rounded
    >
      Sesión iniciada. Ya puedes cerrar esta pestaña y volver a la app instalada.
      <template v-slot:action>
        <q-btn flat label="Ocultar" color="white" @click="showGoogleReturnHint = false" />
      </template>
    </q-banner>

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
      <q-btn
        label="Tengo Authenticator"
        icon="security"
        color="primary"
        outline
        size="lg"
        padding="12px 48px"
        rounded
        class="q-mt-md"
        @click="openAuthenticatorLogin"
      />
    </div>

    <!-- Main Content (Only visible if logged in) -->
    <div v-if="isLoggedIn">
      <q-scroll-observer :scroll-target="pageScrollTarget" @scroll="onScroll" />

      <div class="home-top q-mb-md">
      <!-- Top Bar / Profile Section -->
      <div class="home-profile">
        <div class="home-profile__user row items-center">
          <q-avatar size="36px" color="grey-3" text-color="grey-8" icon="person" class="q-mr-sm" />
          <div>
            <div class="home-profile__name">Bienvenido, {{ currentUser?.Usuario || 'Usuario' }}</div>
            <div class="home-profile__role">{{ currentUser?.Rol || '' }}</div>
          </div>
        </div>
        <div class="home-profile__session row items-center">
          <div v-if="usesHourlySession && sessionRemainingLabel" class="session-dots row items-center">
            <q-icon name="schedule" size="14px" color="grey-6" class="q-mr-xs" />
            <span class="q-mr-xs text-caption text-grey-6">Sesión {{ sessionRemainingLabel }}</span>
          </div>
          <div v-else-if="daysRemaining > 0" class="session-dots row items-center">
            <q-icon name="history" size="14px" color="grey-6" class="q-mr-xs" />
            <span class="q-mr-xs text-caption text-grey-6">Sesión</span>
            <div class="row q-gutter-x-xs">
              <q-icon v-for="i in daysRemaining" :key="i" name="circle" size="8px" color="green-6" />
            </div>
          </div>
        </div>
        <q-btn
          unelevated
          dense
          no-caps
          color="negative"
          class="home-profile__logout logout-btn"
          @click="handleLogout"
        >
          <q-icon name="logout" size="14px" class="q-mr-xs" />
          <span>Cerrar sesión</span>
        </q-btn>
      </div>
      </div>

      <div class="home-toolbar">
        <div class="home-actions">
          <q-btn
            color="orange-8"
            text-color="white"
            icon="schedule"
            label="Horario"
            no-caps
            unelevated
            rounded
            class="dashboard-action-btn"
            @click="goToDashboardHorario"
          />
        </div>

        <div class="home-search row items-center no-wrap">
          <q-input
            v-model="search"
            placeholder="Buscar por casita, revisor o notas..."
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
            round
            flat
            icon="filter_list"
            color="primary"
            class="filter-btn bg-white shadow-1"
            @click="showFilterModal = true"
          >
            <q-tooltip>Filtros</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Active Filter Badge -->
      <div v-if="store.activeFilter" class="row items-center q-mb-md justify-center">
        <div class="active-filter-badge">
          <q-icon name="filter_alt" size="16px" class="q-mr-xs" />
          <span>{{ store.activeFilter.label }}</span>
          <q-btn
            flat
            round
            dense
            icon="close"
            size="sm"
            class="q-ml-xs"
            @click="clearFiltersFromBadge"
          >
            <q-tooltip>Limpiar filtro</q-tooltip>
          </q-btn>
        </div>
      </div>

      <q-banner v-if="syncError" rounded class="bg-red-1 text-negative q-mb-md">
        <template v-slot:avatar>
          <q-icon name="sync_problem" />
        </template>
        {{ syncError }}
      </q-banner>

      <div v-if="firstSyncPending" class="sync-status-card q-mb-md">
        <div class="row items-center justify-between no-wrap q-col-gutter-sm">
          <div class="row items-center no-wrap col">
            <q-icon
              name="cloud_download"
              size="22px"
              color="primary"
              class="q-mr-sm"
            />
            <div>
              <div v-if="syncTitle" class="text-weight-bold text-grey-9">
                {{ syncTitle }}
              </div>
              <div class="text-caption text-grey-7">{{ syncStatusText }}</div>
            </div>
          </div>
          <q-spinner-dots color="primary" size="26px" />
        </div>
      </div>

      <!-- Mostrando registros badge -->
      <div v-if="visibleRecordsCount > 0" class="home-records-row flex justify-center q-mb-md">
        <div class="records-badge">{{ recordsBadgeText }}</div>
      </div>

      <div class="full-width">
        <!-- Initial Loading State -->
        <div v-if="showListSpinner" class="flex flex-center q-my-xl">
          <q-spinner-dots color="primary" size="40px" />
        </div>

        <!-- Empty State if no results -->
        <div v-if="showEmptyState" class="flex flex-center q-mt-xl text-center">
          <div>
            <q-icon name="search_off" size="64px" color="grey-4" />
            <div class="text-h6 text-grey-5 q-mt-md">{{ emptyStateTitle }}</div>
            <div v-if="hasActiveQuery" class="text-body2 text-grey-6 q-mt-xs">Prueba con otro término o quita el filtro</div>
            <q-btn
              flat
              color="primary"
              :label="hasActiveQuery ? 'Limpiar búsqueda y filtros' : 'Intentar de nuevo'"
              class="q-mt-sm"
              @click="hasActiveQuery ? resetQuery() : loadData()"
            />
          </div>
        </div>

        <!-- Cards List with Infinite Scroll (disabled when filter is active) - MOBILE/TABLET ONLY -->
        <q-infinite-scroll
          v-if="isLoggedIn && !$q.screen.gt.md && !firstSyncPending"
          @load="onLoad"
          :offset="250"
          :scroll-target="pageScrollTarget"
          ref="infiniteScroll"
          :disable="!!store.activeFilter || searchLoading || casas.length === 0 || !userHasScrolledList"
        >
          <div class="row q-col-gutter-sm mobile-cards-grid">
            <div v-for="casa in casas" :key="casa.id" class="col-6 col-md-4">
              <q-card 
                class="modern-card" 
                :class="getThemeClass(casa.caja_fuerte)"
                @click="goToDetails(casa)"
              >
                <div class="card-header row items-center justify-between no-wrap">
                  <div class="casita-number" :class="{ 'has-nota-extra': casa.nota_extra }">{{ casa.casita || '00' }}</div>
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
            <div v-if="casas.length > 0" class="row justify-center q-my-md">
              <q-spinner-dots color="primary" size="40px" />
            </div>
          </template>
        </q-infinite-scroll>

        <!-- Table View - DESKTOP ONLY -->
        <div v-if="isLoggedIn && $q.screen.gt.md && !firstSyncPending">
          <div ref="tableContainer" class="table-container">
            <q-table
              :rows="desktopCasas"
              :columns="tableColumns"
              row-key="id"
              flat
              dense
              bordered
              v-model:pagination="tablePagination"
              :rows-per-page-options="[50, 100, 200, 300]"
              rows-per-page-label="Filas por página"
              :loading="loading || searchLoading"
              :style="{ height: tableHeight }"
              class="modern-table"
            >
              <!-- Custom header for theme-based coloring -->
              <template v-slot:header="props">
                <q-tr :props="props">
                  <q-th
                    v-for="col in props.cols"
                    :key="col.name"
                    :props="props"
                    class="table-header-cell"
                  >
                    {{ col.label }}
                  </q-th>
                </q-tr>
              </template>

              <!-- Custom body for status coloring -->
              <template v-slot:body="props">
                <q-tr :props="props" class="table-row" @click="goToDetails(props.row)">
                  <q-td key="casita" :props="props">
                    <div class="casita-cell" :class="{ 'has-nota': props.row.nota_extra }">
                      {{ props.row.casita || '--' }}
                    </div>
                  </q-td>
                  <q-td key="caja_fuerte" :props="props">
                    <q-chip
                      :color="getStatusColor(props.row.caja_fuerte)"
                      text-color="white"
                      size="sm"
                      dense
                    >
                      {{ props.row.caja_fuerte || 'Check in' }}
                    </q-chip>
                  </q-td>
                  <q-td key="quien_revisa" :props="props">
                    {{ props.row.quien_revisa || 'Anónimo' }}
                  </q-td>
                  <q-td key="created_at" :props="props">
                    {{ formatFullDate(props.row.created_at) }}
                  </q-td>
                  <q-td key="chromecast" :props="props">
                    <q-badge :color="props.row.chromecast === '0' ? 'negative' : 'positive'">{{ props.row.chromecast || '0' }}</q-badge>
                  </q-td>
                  <q-td key="speaker" :props="props">
                    <q-badge :color="props.row.speaker === '0' ? 'negative' : 'positive'">{{ props.row.speaker || '0' }}</q-badge>
                  </q-td>
                  <q-td key="usb_speaker" :props="props">
                    <q-badge :color="props.row.usb_speaker === '0' ? 'negative' : 'positive'">{{ props.row.usb_speaker || '0' }}</q-badge>
                  </q-td>
                  <q-td key="controles_tv" :props="props">
                    <q-badge :color="props.row.controles_tv === '0' ? 'negative' : 'positive'">{{ props.row.controles_tv || '0' }}</q-badge>
                  </q-td>
                  <q-td key="secadora" :props="props">
                    <q-badge :color="props.row.secadora === '0' ? 'negative' : 'positive'">{{ props.row.secadora || '0' }}</q-badge>
                  </q-td>
                  <q-td key="accesorios_secadora" :props="props">
                    <q-badge :color="props.row.accesorios_secadora === '0' ? 'negative' : 'positive'">{{ props.row.accesorios_secadora || '0' }}</q-badge>
                  </q-td>
                  <q-td key="steamer" :props="props">
                    <q-badge :color="props.row.steamer === '0' ? 'negative' : 'positive'">{{ props.row.steamer || '0' }}</q-badge>
                  </q-td>
                  <q-td key="bolsa_vapor" :props="props">
                    <q-badge :color="props.row.bolsa_vapor === 'No' ? 'negative' : 'positive'">{{ props.row.bolsa_vapor || 'No' }}</q-badge>
                  </q-td>
                  <q-td key="binoculares" :props="props">
                    <q-badge :color="props.row.binoculares === '0' ? 'negative' : 'positive'">{{ props.row.binoculares || '0' }}</q-badge>
                  </q-td>
                  <q-td key="trapo_binoculares" :props="props">
                    <q-badge :color="props.row.trapo_binoculares === 'No' ? 'negative' : 'positive'">{{ props.row.trapo_binoculares || 'No' }}</q-badge>
                  </q-td>
                  <q-td key="plancha_cabello" :props="props">
                    <q-badge :color="props.row.plancha_cabello === '0' ? 'negative' : 'positive'">{{ props.row.plancha_cabello || '0' }}</q-badge>
                  </q-td>
                  <q-td key="cola_caballo" :props="props">
                    <q-badge :color="props.row.cola_caballo === 'No' ? 'negative' : 'positive'">{{ props.row.cola_caballo || 'No' }}</q-badge>
                  </q-td>
                  <q-td key="bolso_yute" :props="props">
                    <q-badge :color="props.row.bolso_yute === '0' ? 'negative' : 'positive'">{{ props.row.bolso_yute || '0' }}</q-badge>
                  </q-td>
                  <q-td key="bulto" :props="props">
                    <q-badge :color="props.row.bulto === 'No' ? 'negative' : 'positive'">{{ props.row.bulto || 'No' }}</q-badge>
                  </q-td>
                  <q-td key="sombrero" :props="props">
                    <q-badge :color="props.row.sombrero === 'No' ? 'negative' : 'positive'">{{ props.row.sombrero || 'No' }}</q-badge>
                  </q-td>
                  <q-td key="camas_ordenadas" :props="props">
                    <q-badge :color="props.row.camas_ordenadas === 'No' ? 'negative' : 'positive'">{{ props.row.camas_ordenadas || 'No' }}</q-badge>
                  </q-td>
                  <q-td key="notas" :props="props">
                    <span v-if="props.row.notas" class="notes-cell">{{ props.row.notas }}</span>
                    <span v-else class="text-grey-5">--</span>
                  </q-td>
                  <q-td key="nota_extra" :props="props">
                    <q-icon v-if="props.row.nota_extra" name="sticky_note_2" color="orange" size="20px">
                      <q-tooltip>Tiene nota extra</q-tooltip>
                    </q-icon>
                    <span v-else class="text-grey-4">--</span>
                  </q-td>
                </q-tr>
              </template>

              <!-- No data slot -->
              <template v-slot:no-data>
                <div class="full-width column items-center q-pa-lg">
                  <q-icon name="search_off" size="64px" color="grey-4" />
                  <div class="text-h6 text-grey-5 q-mt-md">No se encontraron resultados</div>
                </div>
              </template>
            </q-table>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Modal -->
    <q-dialog v-model="showFilterModal" persistent backdrop-filter="blur(4px)">
      <q-card style="width: 90%; max-width: 400px; border-radius: 20px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Filtros</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup @click="showFilterModal = false" />
        </q-card-section>

        <q-card-section>
          <!-- Date Filter (always visible) -->
          <div class="text-subtitle2 text-grey-7 q-mb-sm">Filtrar por fecha</div>
          <q-input
            v-model="filterDate"
            type="date"
            label="Seleccionar fecha"
            outlined
            rounded
            dense
            class="q-mb-lg"
          >
            <template v-slot:prepend>
              <q-icon name="calendar_today" />
            </template>
          </q-input>

          <div class="text-subtitle2 text-grey-7 q-mb-sm">Otros filtros</div>
          <q-select
            v-model="selectedFilter"
            :options="filterOptions"
            label="Filtrar por"
            outlined
            rounded
            dense
            emit-value
            map-options
          >
            <template v-slot:prepend>
              <q-icon name="filter_list" />
            </template>
          </q-select>
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat label="Limpiar" color="grey-7" @click="clearFilters" :disable="!selectedFilter && !filterDate && !store.activeFilter" />
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup @click="showFilterModal = false" />
          <q-btn unelevated label="Aplicar" color="primary" @click="applyFilters" :disable="!selectedFilter && !filterDate" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- Floating Search Bar (aparece al hacer scroll hacia abajo, solo móvil/tablet) -->
    <q-page-sticky position="top" :offset="[0, 8]">
      <transition name="float-search">
        <div v-if="showFloatingSearch && isLoggedIn && !$q.screen.gt.md" class="floating-search-bar row items-center q-gutter-x-sm">
          <q-input
            v-model="search"
            placeholder="Buscar por casita, revisor o notas..."
            outlined
            rounded
            dense
            bg-color="white"
            class="col"
            clearable
          >
            <template v-slot:prepend>
              <q-icon name="search" class="text-grey-5" />
            </template>
          </q-input>
          <q-btn
            round
            flat
            icon="filter_list"
            color="primary"
            class="bg-white floating-filter-btn"
            @click="showFilterModal = true"
          >
            <q-tooltip>Filtros</q-tooltip>
          </q-btn>
        </div>
      </transition>
    </q-page-sticky>

    <!-- Floating Action Button -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn
        v-if="isLoggedIn && canAdd"
        fab
        icon="add"
        color="primary"
        class="fab-btn"
        aria-label="Nueva revisión"
        @click="addNew"
      >
        <q-tooltip>Nueva revisión</q-tooltip>
      </q-btn>
    </q-page-sticky>

    <!-- Scroll to top button (visible en todas las pantallas cuando hay scroll) -->
    <q-page-sticky position="bottom-left" :offset="[18, 18]">
      <transition name="scroll-top-fade">
        <q-btn
          v-if="showScrollTop"
          round
          color="white"
          text-color="primary"
          icon="keyboard_arrow_up"
          class="scroll-top-btn"
          @click="scrollToTop"
        >
          <q-tooltip>Ir al inicio</q-tooltip>
        </q-btn>
      </transition>
    </q-page-sticky>
  </q-page>
</template>


<script>
import { computed, defineComponent, onMounted, onUnmounted, ref, watch, reactive, nextTick } from 'vue'
import { notify } from '../utils/notify'
import { APP_PAGE_SCROLL_ID, scrollAppToTop } from '../utils/appScroll'
import { useCasasStore } from '../stores/casas'
import { useAuthStore } from '../stores/auth'
import { date, useQuasar } from 'quasar'
import { useRouter, useRoute } from 'vue-router'
import AuthenticatorLoginDialog from '../components/auth/AuthenticatorLoginDialog.vue'
import QnGoogleMark from '../components/QnGoogleMark.vue'
import { isStandaloneDisplay, openBlankExternalTab, openInExternalBrowser } from '../utils/openExternalBrowser'

export default defineComponent({
  name: 'IndexPage',
  components: {
    AuthenticatorLoginDialog,
    QnGoogleMark
  },
  setup () {
    const store = useCasasStore()
    const authStore = useAuthStore()
    const router = useRouter()
    const route = useRoute()
    const $q = useQuasar()
    const infiniteScroll = ref(null)
    const pageScrollTarget = `#${APP_PAGE_SCROLL_ID}`
    const showFloatingSearch = ref(false)
    const showScrollTop = ref(false)
    const userHasScrolledList = ref(false)

    const onScroll = (info) => {
      showFloatingSearch.value = info.position.top > 420
      showScrollTop.value = info.position.top > 600
      if (info.position.top > 160) {
        userHasScrolledList.value = true
      }
    }

    const scrollToTop = () => {
      scrollAppToTop({ smooth: true })
    }

    // Desktop table columns
    const tableColumns = [
      { name: 'casita', label: 'Casita', field: 'casita', align: 'left', sortable: true, style: 'font-weight: bold; width: 80px' },
      { name: 'caja_fuerte', label: 'Caja Fuerte', field: 'caja_fuerte', align: 'left', sortable: true, style: 'font-weight: 600' },
      { name: 'quien_revisa', label: 'Revisado por', field: 'quien_revisa', align: 'left', sortable: true },
      { name: 'created_at', label: 'Fecha', field: 'created_at', align: 'left', sortable: true, format: val => formatFullDate(val) },
      { name: 'chromecast', label: 'Chromecast', field: 'chromecast', align: 'center', sortable: true },
      { name: 'speaker', label: 'Speaker', field: 'speaker', align: 'center', sortable: true },
      { name: 'usb_speaker', label: 'USB Spk', field: 'usb_speaker', align: 'center', sortable: true },
      { name: 'controles_tv', label: 'Control TV', field: 'controles_tv', align: 'center', sortable: true },
      { name: 'secadora', label: 'Secadora', field: 'secadora', align: 'center', sortable: true },
      { name: 'accesorios_secadora', label: 'Acc Sec', field: 'accesorios_secadora', align: 'center', sortable: true },
      { name: 'steamer', label: 'Steamer', field: 'steamer', align: 'center', sortable: true },
      { name: 'bolsa_vapor', label: 'Bolsa Vapor', field: 'bolsa_vapor', align: 'center', sortable: true },
      { name: 'binoculares', label: 'Binoculares', field: 'binoculares', align: 'center', sortable: true },
      { name: 'trapo_binoculares', label: 'Trapo Bin', field: 'trapo_binoculares', align: 'center', sortable: true },
      { name: 'plancha_cabello', label: 'Plancha', field: 'plancha_cabello', align: 'center', sortable: true },
      { name: 'cola_caballo', label: 'Cola', field: 'cola_caballo', align: 'center', sortable: true },
      { name: 'bolso_yute', label: 'Yute', field: 'bolso_yute', align: 'center', sortable: true },
      { name: 'bulto', label: 'Bulto', field: 'bulto', align: 'center', sortable: true },
      { name: 'sombrero', label: 'Sombrero', field: 'sombrero', align: 'center', sortable: true },
      { name: 'camas_ordenadas', label: 'Camas', field: 'camas_ordenadas', align: 'center', sortable: true },
      { name: 'notas', label: 'Notas', field: 'notas', align: 'left', style: 'max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis' },
      { name: 'nota_extra', label: 'Nota Extra', field: 'nota_extra', align: 'center', sortable: false }
    ]

    const tablePagination = ref({ rowsPerPage: 100, page: 1 })
    const tableContainer = ref(null)
    const tableHeight = ref('60vh')

    const updateTableHeight = () => {
      const el = tableContainer.value
      if (!el) return
      const available = window.innerHeight - el.getBoundingClientRect().top - 24
      tableHeight.value = `${Math.max(320, Math.round(available))}px`
    }

    const showFilterModal = ref(false)
    const showLoginModal = ref(false)
    const showLoginPassword = ref(false)
    const showAuthenticatorModal = ref(false)
    const showGoogleReturnHint = ref(false)

    // Opciones de filtro
    const filterOptions = [
      { label: 'Sin trapo binocular', value: JSON.stringify({ field: 'trapo_binoculares', value: 'No', label: 'Sin trapo binocular' }) },
      { label: 'Con trapo binocular', value: JSON.stringify({ field: 'trapo_binoculares', value: 'Si', label: 'Con trapo binocular' }) },
      { label: 'Sin sombrero', value: JSON.stringify({ field: 'sombrero', value: 'No', label: 'Sin sombrero' }) },
      { label: 'Con sombrero', value: JSON.stringify({ field: 'sombrero', value: 'Si', label: 'Con sombrero' }) },
      { label: 'Sin bulto', value: JSON.stringify({ field: 'bulto', value: 'No', label: 'Sin bulto' }) },
      { label: 'Con bulto', value: JSON.stringify({ field: 'bulto', value: 'Si', label: 'Con bulto' }) },
      { label: 'Sin cola de caballo', value: JSON.stringify({ field: 'cola_caballo', value: 'No', label: 'Sin cola de caballo' }) },
      { label: 'Con cola de caballo', value: JSON.stringify({ field: 'cola_caballo', value: 'Si', label: 'Con cola de caballo' }) },
      { label: 'Sin Yute', value: JSON.stringify({ field: 'bolso_yute', value: '0', label: 'No hay Yute', isArray: false }) },
      { label: 'Hay un Yute', value: JSON.stringify({ field: 'bolso_yute', value: '1,01', label: 'Hay un Yute', isArray: true }) },
      { label: 'Hay 2 Yutes', value: JSON.stringify({ field: 'bolso_yute', value: '2,02', label: 'Hay 2 Yutes', isArray: true }) },
      { label: 'No hay steamer', value: JSON.stringify({ field: 'steamer', value: '0', label: 'No hay steamer' }) },
      { label: 'No hay secadora', value: JSON.stringify({ field: 'secadora', value: '0', label: 'No hay secadora' }) }
    ]

    const selectedFilter = ref(null)
    const filterDate = ref(null)

    const applyFilters = async () => {
      // Si hay fecha seleccionada, aplicar filtro de fecha
      if (filterDate.value) {
        await store.applyAdvancedFilter({
          date: filterDate.value,
          label: 'Fecha: ' + filterDate.value
        })
        showFilterModal.value = false
        filterDate.value = null
        selectedFilter.value = null
        scrollAppToTop()
        notify({
          type: 'positive',
          message: `Filtro aplicado: ${store.activeFilter?.label}`,
          position: 'top'
        })
        return
      }
      
      if (!selectedFilter.value) return
      
      const filterData = JSON.parse(selectedFilter.value)
      
      await store.applyAdvancedFilter({
        field: filterData.field,
        value: filterData.value,
        label: filterData.label,
        isArray: filterData.isArray || false
      })
      
      showFilterModal.value = false
      scrollAppToTop()
      notify({
        type: 'positive',
        message: `Filtro aplicado: ${filterData.label}`,
        position: 'top'
      })
    }

    const clearFilters = async () => {
      selectedFilter.value = null
      filterDate.value = null
      await store.clearAdvancedFilter()
      showFilterModal.value = false
      scrollAppToTop()
      notify({
        type: 'info',
        message: 'Filtros limpiados',
        position: 'top'
      })
    }

    const clearFiltersFromBadge = async () => {
      selectedFilter.value = null
      filterDate.value = null
      await store.clearAdvancedFilter()
      scrollAppToTop()
      notify({
        type: 'info',
        message: 'Filtro limpiado',
        position: 'top'
      })
    }

    const resetQuery = async () => {
      selectedFilter.value = null
      filterDate.value = null
      store.setSearch('')
      await store.clearAdvancedFilter()
      scrollAppToTop()
    }
    const loginLoading = computed(() => authStore.loading)
    const loginError = computed(() => authStore.error)
    const googleLoginPending = computed(() => authStore.googleLoginPending)
    const isLoggedIn = computed(() => authStore.isLoggedIn)
    const currentUser = computed(() => authStore.user)
    const daysRemaining = computed(() => authStore.daysRemaining)
    const canAdd = computed(() => authStore.canAdd)

    const loginData = reactive({
      username: '',
      password: ''
    })
    const usesHourlySession = computed(() => authStore.usesHourlySession)
    const sessionRemainingLabel = computed(() => authStore.sessionRemainingLabel)

    const handleLogin = async () => {
      const result = await authStore.login(loginData.username, loginData.password)
      if (result.useAuthenticator) {
        switchToAuthenticatorLogin()
        return
      }
      if (result.success) {
        showLoginModal.value = false
        loginData.username = ''
        loginData.password = ''
        await loadData()
      }
    }

    const handleGoogleLogin = async () => {
      const tab = openBlankExternalTab()
      const result = await authStore.loginWithGoogle()
      if (!result.url) {
        if (tab && !tab.closed) tab.close()
        return
      }
      openInExternalBrowser(result.url, tab)
    }

    const openAuthenticatorLogin = () => {
      showLoginModal.value = false
      showAuthenticatorModal.value = true
    }

    const switchToAuthenticatorLogin = () => {
      showLoginModal.value = false
      showAuthenticatorModal.value = true
    }

    const handleAuthenticatorSuccess = async () => {
      showAuthenticatorModal.value = false
      showLoginModal.value = false
      loginData.username = ''
      loginData.password = ''
      if (authStore.usesGoogle && !isStandaloneDisplay()) {
        showGoogleReturnHint.value = true
      }
      await loadData()
    }

    const handleLogout = async () => {
      await authStore.logout()
      loginData.username = ''
      loginData.password = ''
      showLoginModal.value = true
    }
    
    const search = computed({
      get: () => store.search,
      set: (val) => store.setSearch(val)
    })

    const casas = computed(() => store.filteredCasas)
    const desktopCasas = computed(() => store.filteredCasas)
    const loading = computed(() => store.loading)
    const searchLoading = computed(() => store.searchLoading)
    const syncState = computed(() => store.homeSyncState)
    // firstSyncPending blocks the UI only when we have no quick-loaded data yet.
    // Once quickLoadReady=true the user can see the most-recent records immediately
    // while the full RxDB sync continues in background.
    const firstSyncPending = computed(() => syncState.value.firstSyncPending && !store.quickLoadReady)
    const syncError = computed(() => syncState.value.error)
    const syncTitle = 'Sincronizando'

    const syncStatusText = computed(() => {
      if (syncState.value.initialSyncPulled > 0) {
        return `${syncState.value.initialSyncPulled} registros descargados para uso offline`
      }

      return 'Preparando el cache local del inicio...'
    })

    const isDesktopView = computed(() => isLoggedIn.value && $q.screen.gt.md)

    const visibleRecordsCount = computed(() => casas.value.length)

    const recordsBadgeText = computed(() => {
      const shown = visibleRecordsCount.value
      const matched = store.matchedCasas.length

      if (matched > shown) {
        return `Mostrando ${shown} de ${matched} registros`
      }

      return `Mostrando ${shown} registros`
    })

    const hasActiveQuery = computed(() => {
      return Boolean(String(store.search || '').trim() || store.activeFilter)
    })

    const showListSpinner = computed(() => {
      return firstSyncPending.value || ((loading.value || searchLoading.value) && casas.value.length === 0)
    })

    const showEmptyState = computed(() => {
      return !showListSpinner.value && casas.value.length === 0
    })

    const emptyStateTitle = computed(() => {
      return hasActiveQuery.value ? 'Sin resultados' : 'No encontramos nada'
    })

    const initData = async () => {
      if (!store.loading) {
        await store.fetchCasas()
      }
    }

    const loadData = async () => {
      await store.fetchCasas()
    }

    watch(() => authStore.mfa.step, (step) => {
      if (step && !authStore.isLoggedIn) {
        showLoginModal.value = false
        showAuthenticatorModal.value = true
      }
    })

    watch(isLoggedIn, async (logged) => {
      if (!logged) return
      if (!authStore.googleLoginPending && route.query.google_return !== '1') return
      showLoginModal.value = false
      showAuthenticatorModal.value = false
      authStore.googleLoginPending = false
      await loadData()
    })

    const onLoad = async (_, done) => {
      if (searchLoading.value || store.activeFilter || casas.value.length === 0) {
        done(true)
        return
      }

      if (store.loading) {
        done()
        return
      }

      if (!store.hasMore) {
        done(true)
        return
      }

      await store.fetchMoreCasas()
      done(!store.hasMore)
    }

    const maybeLoadMoreDesktop = async () => {
      if (!isDesktopView.value || store.activeFilter || store.loading || searchLoading.value) {
        return
      }

      if (!store.hasMore || casas.value.length === 0) {
        return
      }

      const { page, rowsPerPage } = tablePagination.value

      if (!rowsPerPage) {
        return
      }

      if (page * rowsPerPage >= casas.value.length) {
        await store.fetchMoreCasas()
      }
    }

    watch(() => store.search, () => {
      tablePagination.value = { ...tablePagination.value, page: 1 }
      userHasScrolledList.value = false
      nextTick(() => {
        infiniteScroll.value?.reset()
        scrollAppToTop()
      })
    })

    watch([tablePagination, () => store.casas.length, isDesktopView], () => {
      maybeLoadMoreDesktop()
    }, { deep: true })

    const checkSessionInterval = setInterval(async () => {
      if (isLoggedIn.value && !(await authStore.checkSessionExpiry())) {
        showLoginModal.value = true
      }
    }, 60000)

    onUnmounted(() => {
      clearInterval(checkSessionInterval)
      window.removeEventListener('resize', updateTableHeight)
    })

    onMounted(async () => {
      if (route.query.google_return === '1') {
        if (isLoggedIn.value && !isStandaloneDisplay()) {
          showGoogleReturnHint.value = true
        }
        router.replace({ path: '/', query: {} }).catch(() => null)
      }
      if (authStore.mfa.step && !isLoggedIn.value) {
        showAuthenticatorModal.value = true
      } else if ((authStore.error || authStore.googleLoginPending) && !isLoggedIn.value) {
        showLoginModal.value = true
      }
      if (isLoggedIn.value) {
        if (store.allCasas.length === 0) {
          await initData()
        }
      }

      await nextTick()
      updateTableHeight()
      window.addEventListener('resize', updateTableHeight)
    })

    watch([visibleRecordsCount, isLoggedIn], () => {
      nextTick(updateTableHeight)
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
      if (!canAdd.value) return

      localStorage.removeItem('new_revision_form')
      localStorage.removeItem('new_revision_compression_info')
      router.push('/new-revision')
    }

    const goToDashboardHorario = () => {
      router.push('/dashboard-horario')
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
      if (s === 'back to back' || s === 'backtoback') return 'theme-brown'
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
      if (s === 'back to back' || s === 'backtoback') return 'bg-brown-action'
      return 'bg-green-action'
    }

    const getActionIcon = (status) => {
      if (!status) return 'login'
      const s = status.toLowerCase()
      if (s.includes('check out')) return 'logout'
      if (s.includes('guardar upsell')) return 'file_download'
      if (s.includes('upsell')) return 'file_download'
      if (s.includes('move')) return 'sync_alt'
      if (s === 'si' || s === 'no') return 'lock'
      if (s === 'back to back' || s === 'backtoback') return 'repeat'
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

    const getStatusColor = (status) => {
      if (!status) return 'green'
      const s = status.toLowerCase()
      if (s.includes('check out')) return 'red'
      if (s.includes('guardar upsell')) return 'purple'
      if (s.includes('upsell')) return 'blue'
      if (s.includes('move')) return 'orange'
      if (s === 'si' || s === 'no') return 'amber'
      if (s === 'back to back' || s === 'backtoback') return 'brown'
      return 'green'
    }

    return {
      store,
      search,
      casas,
      desktopCasas,
      canAdd,
      loading,
      searchLoading,
      addNew,
      formatFullDate,
      loadData,
      onLoad,
      infiniteScroll,
      pageScrollTarget,
      userHasScrolledList,
      showFloatingSearch,
      onScroll,
      showScrollTop,
      scrollToTop,
      getThemeClass,
      getActionBadgeClass,
      getActionIcon,
      getCardNoteText,
      goToDashboardHorario,
      goToDetails,
      showFilterModal,
      applyFilters,
      filterOptions,
      selectedFilter,
      filterDate,
      clearFilters,
      clearFiltersFromBadge,
      showLoginModal,
      showLoginPassword,
      showAuthenticatorModal,
      showGoogleReturnHint,
      loginData,
      loginLoading,
      loginError,
      googleLoginPending,
      isLoggedIn,
      currentUser,
      daysRemaining,
      usesHourlySession,
      sessionRemainingLabel,
      handleLogin,
      handleGoogleLogin,
      handleLogout,
      openAuthenticatorLogin,
      switchToAuthenticatorLogin,
      handleAuthenticatorSuccess,
      firstSyncPending,
      syncError,
      syncTitle,
      syncStatusText,
      visibleRecordsCount,
      recordsBadgeText,
      hasActiveQuery,
      showListSpinner,
      showEmptyState,
      emptyStateTitle,
      resetQuery,
      // Table
      tableColumns,
      tablePagination,
      tableContainer,
      tableHeight,
      getStatusColor
    }
  }
})
</script>

<style scoped>
.home-page {
  padding: 12px !important;
}

.home-top {
  padding: 10px 12px 12px;
  border: 1px solid #eceff1;
  border-radius: 14px;
  background: #fff;
}

.home-profile {
  padding-bottom: 0;
  margin-bottom: 0;
  border-bottom: none;
}

:global(.body--dark) .home-top {
  border-color: rgba(255, 255, 255, 0.08);
  background: #1e1e1e;
}

.records-badge {
  background: #eceff1;
  color: #607d8b;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  box-shadow: none;
}

.sync-status-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(227, 242, 253, 0.98) 100%);
  border: 1px solid rgba(25, 118, 210, 0.12);
  border-radius: 18px;
  padding: 14px 16px;
  box-shadow: 0 8px 18px rgba(25, 118, 210, 0.08);
}

.modern-card {
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(255, 255, 255, 0.35) inset;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.modern-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 38%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.38) 0%, rgba(255, 255, 255, 0) 100%);
  pointer-events: none;
}

.modern-card:active {
  transform: scale(0.97);
  box-shadow:
    0 7px 18px rgba(0, 0, 0, 0.09),
    0 1px 5px rgba(255, 255, 255, 0.28) inset;
}

/* Themes */
.theme-green {
  background: linear-gradient(145deg, #b8f0d9 0%, #e6fff3 58%, #ffffff 100%);
  box-shadow: 0 12px 20px rgba(0, 210, 106, 0.18);
}
.theme-red {
  background: linear-gradient(145deg, #ffd7dc 0%, #fff0f2 58%, #ffffff 100%);
  box-shadow: 0 12px 20px rgba(255, 77, 77, 0.18);
}
.theme-purple {
  background: linear-gradient(145deg, #e9cbef 0%, #f8efff 58%, #ffffff 100%);
  box-shadow: 0 12px 20px rgba(147, 51, 234, 0.18);
}
.theme-orange {
  background: linear-gradient(145deg, #ffd39a 0%, #fff3e1 58%, #ffffff 100%);
  box-shadow: 0 12px 20px rgba(255, 152, 0, 0.2);
}
.theme-gold {
  background: linear-gradient(145deg, #ffe7a3 0%, #fff8df 58%, #ffffff 100%);
  box-shadow: 0 12px 20px rgba(255, 215, 0, 0.2);
}
.theme-blue {
  background: linear-gradient(145deg, #c4ecff 0%, #e8f7ff 58%, #ffffff 100%);
  box-shadow: 0 12px 20px rgba(33, 150, 243, 0.18);
}
.theme-brown {
  background: linear-gradient(145deg, #e1d5d1 0%, #f4ece9 58%, #ffffff 100%);
  box-shadow: 0 12px 20px rgba(121, 85, 72, 0.18);
}

.card-header {
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.casita-number {
  font-size: 20px;
  font-weight: 800;
  color: #1a1a1a;
  line-height: 1;
  flex-shrink: 0;
}

.casita-number.has-nota-extra {
  color: #FF9800 !important;
}

.status-chip {
  padding: 5px 10px;
  border-radius: 999px;
  color: white;
  font-size: 10px;
  font-weight: 700;
  box-shadow:
    0 5px 10px rgba(0, 0, 0, 0.14),
    0 1px 2px rgba(255, 255, 255, 0.25) inset;
  letter-spacing: 0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 130px;
  line-height: 1;
  -webkit-text-size-adjust: none;
  text-size-adjust: none;
  transform-origin: center;
  flex-shrink: 0;
}

.status-chip span {
  font-size: 11px !important;
  line-height: 1;
  display: inline;
  max-width: 100%;
  -webkit-text-size-adjust: none;
  text-size-adjust: none;
}

.status-chip .q-icon {
  font-size: 12px !important;
  flex-shrink: 0;
}

.bg-green-action { background-color: #00D26A; }
.bg-red-action { background-color: #FF4D4D; }
.bg-purple-action { background-color: #9333EA; }
.bg-orange-action { background-color: #FF9800; }
.bg-gold-action { background-color: #FFD700; }
.bg-blue-action { background-color: #2196F3; }
.bg-brown-action { background-color: #3e2723; }

.card-content {
  margin: 14px 0 12px;
  flex-grow: 1;
  background: rgba(255, 255, 255, 0.45);
  border-radius: 12px;
  padding: 8px;
}

.info-row {
  margin-bottom: 4px;
}

.note-text {
  font-size: 11px;
  color: #0505F5;
  font-weight: 600;
  line-height: 1.35;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
}

.mobile-cards-grid {
  margin-bottom: 6px;
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

.floating-search-bar {
  width: calc(100vw - 24px);
  max-width: 560px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(8px);
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  z-index: 300;
}

.floating-filter-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
}

.float-search-enter-active,
.float-search-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.float-search-enter-from,
.float-search-leave-to {
  transform: translateY(-110%);
  opacity: 0;
}

.scroll-top-btn {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.scroll-top-fade-enter-active,
.scroll-top-fade-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.scroll-top-fade-enter-from,
.scroll-top-fade-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

.filter-btn {
  border-radius: 12px;
  width: 40px;
  height: 40px;
}

.active-filter-badge {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.4);
}

.logout-btn {
  background: #ffebee;
  color: #e53935;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  min-width: auto;
}

.session-dots {
  background: #f5f5f5;
  padding: 4px 10px;
  border-radius: 20px;
  flex-wrap: nowrap;
}

.home-profile {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    "user logout"
    "session session";
  gap: 4px 8px;
  align-items: center;
}

.home-profile__user {
  grid-area: user;
}

.home-profile__name {
  color: #37474f;
  font-size: 14px;
  font-weight: 700;
}

.home-profile__role {
  color: #90a4ae;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.1;
}

.home-profile__session {
  grid-area: session;
}

.home-profile__logout {
  grid-area: logout;
}

.home-toolbar {
  display: grid;
  grid-template-areas:
    "search"
    "actions";
  gap: 8px;
  margin-bottom: 12px;
}

.home-actions {
  grid-area: actions;
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.dashboard-action-btn {
  width: 100%;
  min-height: 36px;
  box-shadow: none;
}

.home-search {
  grid-area: search;
  gap: 8px;
}

.search-input {
  box-shadow: none;
}

/* En pantallas grandes, ocultamos la fila inferior */
@media (min-width: 600px) {
  .session-dots {
    max-width: none;
  }
}

@media (max-width: 1023px) {
  .theme-green {
    background: linear-gradient(145deg, #e8f6ee 0%, #ffffff 100%);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  .theme-red {
    background: linear-gradient(145deg, #fbecee 0%, #ffffff 100%);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  .theme-purple {
    background: linear-gradient(145deg, #f4eef8 0%, #ffffff 100%);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  .theme-orange {
    background: linear-gradient(145deg, #f8f0e6 0%, #ffffff 100%);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  .theme-gold {
    background: linear-gradient(145deg, #f8f3e4 0%, #ffffff 100%);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  .theme-blue {
    background: linear-gradient(145deg, #eaf4fb 0%, #ffffff 100%);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  .theme-brown {
    background: linear-gradient(145deg, #f3eeec 0%, #ffffff 100%);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .modern-card::before {
    height: 22%;
  }

  .filter-btn {
    box-shadow: none;
  }

  .home-records-row {
    margin-bottom: 8px;
  }
}

@media (max-width: 599px) {
  .modern-card {
    border-radius: 16px;
    padding: 12px;
  }

  .casita-number {
    font-size: 20px;
  }

  .status-chip {
    max-width: 110px;
    padding: 5px 8px;
  }

  .card-content {
    margin: 10px 0 8px;
    padding: 7px;
  }

  .info-row :deep(.q-icon) {
    font-size: 16px !important;
  }

  .info-row .text-body1 {
    font-size: 13px;
  }

  .info-row .text-subtitle2 {
    font-size: 11px;
  }

  .note-text {
    font-size: 11px;
    padding: 5px 6px;
  }
}

.rounded-btn {
  border-radius: 12px;
}

/* Desktop Table Styles */
.table-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: auto;
  margin-top: 16px;
}

.modern-table {
  font-size: 11px;
  min-width: 1100px;
}

.modern-table .q-table__top {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  position: sticky;
  top: 0;
  z-index: 50;
}

.modern-table .q-table__bottom {
  font-size: 11px;
}

.modern-table :deep(.q-table__middle) {
  overflow: auto;
}

.modern-table :deep(thead) {
  position: sticky;
  top: 0;
  z-index: 100;
}

.modern-table :deep(thead th) {
  position: sticky;
  top: 0;
  z-index: 101;
  background: #f5f5f5 !important;
}

.table-header-cell {
  font-weight: 700 !important;
  color: #424242 !important;
  background: #f5f5f5 !important;
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 8px 4px;
}

.table-row {
  cursor: pointer;
  transition: background 0.2s;
}

.table-row:hover {
  background: #f0f7ff !important;
}

.modern-table :deep(.q-td) {
  padding: 4px 8px;
}

.casita-cell {
  font-weight: 800;
  font-size: 13px;
  color: #1a1a1a;
}

.casita-cell.has-nota {
  color: #FF9800;
}

.notes-cell {
  color: #0505F5;
  font-weight: 500;
}

/* Sticky first 4 columns */
.table-container :deep(td:nth-child(1)),
.table-container :deep(td:nth-child(2)),
.table-container :deep(td:nth-child(3)),
.table-container :deep(td:nth-child(4)),
.table-container :deep(th:nth-child(1)),
.table-container :deep(th:nth-child(2)),
.table-container :deep(th:nth-child(3)),
.table-container :deep(th:nth-child(4)) {
  position: sticky;
  left: 0;
  z-index: 10;
  background: white;
}

.table-container :deep(th:nth-child(1)),
.table-container :deep(th:nth-child(2)),
.table-container :deep(th:nth-child(3)),
.table-container :deep(th:nth-child(4)) {
  background: #f5f5f5;
  z-index: 20;
}

.table-container :deep(tr:hover td:nth-child(1)),
.table-container :deep(tr:hover td:nth-child(2)),
.table-container :deep(tr:hover td:nth-child(3)),
.table-container :deep(tr:hover td:nth-child(4)) {
  background: #e3f2fd;
}

/* Horizontal scroll for table on smaller desktops */
@media (max-width: 1400px) {
  .table-container {
    overflow-x: auto;
  }
  
  .modern-table {
    min-width: 1200px;
  }
}

/* ===== Escritorio: cabecera limpia y compacta ===== */
@media (min-width: 1024px) {
  .home-page {
    padding: 16px 24px 24px !important;
  }

  .home-top {
    padding: 10px 14px 12px;
    margin-bottom: 12px;
    border: 1px solid #eceff1;
    border-radius: 14px;
    background: #fff;
  }

  .home-profile {
    grid-template-columns: auto auto 1fr auto;
    grid-template-areas: "user session . logout";
    gap: 0 12px;
    padding-bottom: 8px;
    margin-bottom: 8px;
    border-bottom: 1px solid #f0f2f4;
  }

  .logout-btn {
    background: #ffebee;
    color: #e53935;
    font-weight: 600;
  }

  .home-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin-bottom: 10px;
  }

  .home-search {
    flex: 1 1 240px;
    max-width: 360px;
    min-width: 200px;
    margin-left: auto;
  }

  .home-search .search-input {
    box-shadow: none;
  }

  .home-actions {
    display: flex;
    flex: 0 0 auto;
    gap: 6px;
  }

  .dashboard-action-btn {
    width: auto;
    min-width: 0;
    height: 34px;
    padding: 0 12px;
    box-shadow: none;
  }

  .records-badge {
    background: #eceff1;
    color: #607d8b;
    box-shadow: none;
  }

  .home-records-row {
    justify-content: flex-start !important;
  }

  .table-container {
    margin-top: 0;
  }

  .filter-btn {
    flex-shrink: 0;
    box-shadow: none;
  }

  :global(.body--dark) .home-top {
    border-color: rgba(255, 255, 255, 0.08);
    background: #1e1e1e;
  }

  :global(.body--dark) .home-profile {
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }
}
</style>

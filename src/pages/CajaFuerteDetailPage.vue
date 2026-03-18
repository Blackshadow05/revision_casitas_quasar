<template>
  <q-page class="cf-detail-page q-pa-md">
    <div class="cf-detail-shell">
      <div class="cf-detail-header q-mb-md">
        <q-btn
          flat
          round
          dense
          icon="arrow_back"
          color="grey-7"
          class="mobile-only back-btn"
          @click="goBack"
        />
        <div class="col">
          <div class="cf-detail-eyebrow">Caja fuerte</div>
          <div class="text-h5 text-weight-bold">{{ pageTitle }}</div>
          <div class="text-caption text-grey-6 q-mt-xs">{{ headerDescription }}</div>
        </div>
        <div class="result-pill mobile-only">{{ filteredMovimientos.length }}</div>
      </div>

      <div class="detail-toolbar q-mb-md">
        <q-input
          v-model="searchTerm"
          rounded
          outlined
          dense
          placeholder="Buscar por casita, usuario, tipo o detalle..."
          class="detail-search"
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

        <div class="detail-toolbar-footer q-mt-sm">
          <div class="text-caption text-grey-6">{{ resultSummary }}</div>
          <q-btn
            v-if="hasActiveFilters"
            flat
            dense
            no-caps
            color="primary"
            label="Limpiar"
            @click="clearFilters"
          />
        </div>

        <div class="quick-filter-row mobile-only q-mt-sm">
          <q-chip
            v-for="filter in quickFilters"
            :key="filter.value"
            clickable
            :class="['quick-filter-chip', { 'quick-filter-chip--active': quickFilter === filter.value }]"
            @click="quickFilter = filter.value"
          >
            <q-icon :name="filter.icon" size="16px" class="q-mr-xs" />
            {{ filter.label }}
          </q-chip>
        </div>
      </div>

      <q-btn
        v-if="!isAllMovimientos && isLoggedIn"
        unelevated
        rounded
        color="primary"
        icon="add"
        label="Agregar movimiento"
        class="q-mb-lg full-width desktop-only"
        style="text-transform: none; font-weight: 600;"
        @click="showAddDialog = true"
      />

      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner color="primary" size="40px" />
        <div class="q-mt-md text-grey-6 text-body2">Cargando movimientos...</div>
      </div>

      <div v-else-if="filteredMovimientos.length > 0" class="movements-list">
        <div
          v-for="(movimiento, index) in filteredMovimientos"
          :key="movimiento.id || index"
          class="movement-card"
        >
          <template v-if="editingId === movimiento.id">
            <div class="q-pa-md">
              <div class="text-caption text-grey-6 q-mb-sm text-weight-medium">EDITANDO MOVIMIENTO</div>
              <q-input
                v-model="editMovimiento.movimiento_caja"
                label="Tipo de acción"
                dense
                outlined
                class="q-mb-sm"
                rounded
              />
              <q-input
                v-model="editMovimiento.detalle"
                label="Detalle"
                type="textarea"
                dense
                outlined
                class="q-mb-sm"
                rounded
                autogrow
              />
              <div class="row q-gutter-sm q-mt-xs">
                <q-btn
                  unelevated
                  rounded
                  color="primary"
                  label="Guardar"
                  dense
                  size="sm"
                  style="text-transform:none; padding: 4px 14px;"
                  :loading="savingEdit"
                  @click="guardarEdicionMovimiento(movimiento)"
                />
                <q-btn
                  flat
                  rounded
                  label="Cancelar"
                  dense
                  size="sm"
                  style="text-transform:none;"
                  @click="cancelarEdicion"
                />
              </div>
            </div>
          </template>

          <template v-else>
            <div class="movement-card-inner q-pa-md">
              <div class="movement-card-top">
                <div class="movement-icon-wrap">
                  <q-icon name="inventory_2" color="white" size="18px" />
                </div>
                <div class="col">
                  <div class="movement-topline">
                    <span class="movement-date-badge">{{ formatRelativeDate(movimiento.created_at) }}</span>
                    <span class="movement-time">{{ formatTime(movimiento.created_at) }}</span>
                  </div>
                  <div class="text-weight-bold movement-title">
                    {{ formatMovimiento(movimiento.movimiento_caja) }}
                  </div>
                </div>
                <q-btn
                  v-if="movimiento.usuario === authStore.user?.Usuario"
                  flat
                  round
                  dense
                  icon="edit"
                  size="sm"
                  color="grey-5"
                  @click="iniciarEdicion(movimiento)"
                />
              </div>

              <div class="movement-detail-card q-mt-md">
                <div class="text-caption text-grey-6 q-mb-xs">Detalle</div>
                <div class="movement-detail">
                  {{ movimiento.detalle || "Sin detalle adicional" }}
                </div>
              </div>

              <div class="movement-meta-grid q-mt-md">
                <div class="movement-meta-item">
                  <q-icon name="home" color="primary" size="18px" />
                  <div>
                    <div class="movement-meta-label">Casita</div>
                    <div class="movement-meta-value">
                      {{ isAllMovimientos ? `Casita ${movimiento.casita_caja}` : `Casita ${numeroCasita}` }}
                    </div>
                  </div>
                </div>
                <div class="movement-meta-item">
                  <q-icon name="person_outline" color="grey-7" size="18px" />
                  <div>
                    <div class="movement-meta-label">Usuario</div>
                    <div class="movement-meta-value">{{ movimiento.usuario || "Sin usuario" }}</div>
                  </div>
                </div>
                <div class="movement-meta-item movement-meta-item--full">
                  <q-icon name="schedule" color="grey-7" size="18px" />
                  <div>
                    <div class="movement-meta-label">Fecha</div>
                    <div class="movement-meta-value">{{ formatDate(movimiento.created_at) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div v-else-if="hasActiveFilters" class="empty-state">
        <q-icon name="search_off" size="52px" color="grey-4" />
        <div class="text-body1 text-grey-5 q-mt-sm">Sin resultados</div>
        <div class="text-caption text-grey-4">{{ emptySearchMessage }}</div>
        <q-btn
          flat
          rounded
          no-caps
          color="primary"
          label="Limpiar filtros"
          class="q-mt-sm"
          @click="clearFilters"
        />
      </div>

      <div v-else class="empty-state">
        <q-icon name="inbox" size="52px" color="grey-4" />
        <div class="text-body1 text-grey-5 q-mt-sm">Sin movimientos</div>
        <div class="text-caption text-grey-4">No hay movimientos registrados para esta caja fuerte</div>
      </div>

      <q-page-sticky
        v-if="!isAllMovimientos && isLoggedIn"
        position="bottom"
        :offset="[0, 16]"
        class="mobile-only detail-sticky-action"
      >
        <div class="mobile-add-panel">
          <q-btn
            unelevated
            rounded
            color="primary"
            icon="add"
            label="Agregar movimiento"
            class="full-width mobile-add-btn"
            @click="showAddDialog = true"
          />
        </div>
      </q-page-sticky>

      <q-dialog v-model="showAddDialog" persistent>
        <q-card class="movement-dialog-card">
          <q-card-section class="q-pb-none">
            <div class="text-h6 text-weight-bold">
              Nuevo movimiento
              <span v-if="!isAllMovimientos" class="text-grey-6 text-body2 q-ml-xs">· Caja {{ numeroCasita }}</span>
            </div>
          </q-card-section>

          <q-card-section>
            <q-input
              v-model="nuevoMovimiento.movimiento_caja"
              label="Tipo de acción"
              outlined
              rounded
              class="q-mb-md"
            />
            <q-input
              v-model="nuevoMovimiento.detalle"
              label="Detalle (opcional)"
              type="textarea"
              outlined
              rounded
              autogrow
            />
          </q-card-section>

          <q-card-actions align="right" class="q-px-md q-pb-md q-gutter-sm">
            <q-btn flat rounded label="Cancelar" style="text-transform:none;" @click="cerrarDialog" />
            <q-btn
              unelevated
              rounded
              color="primary"
              label="Guardar"
              style="text-transform:none; font-weight:600;"
              :loading="saving"
              @click="guardarMovimiento"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script>
import { computed, defineComponent, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { supabase } from "../supabase";
import { useAuthStore } from "../stores/auth";

export default defineComponent({
  name: "CajaFuerteDetailPage",
  setup() {
    const route = useRoute();
    const router = useRouter();
    const authStore = useAuthStore();
    const isLoggedIn = computed(() => authStore.isLoggedIn);

    const editingId = ref(null);
    const editMovimiento = ref({ movimiento_caja: "", detalle: "" });
    const savingEdit = ref(false);
    const loading = ref(true);
    const saving = ref(false);
    const showAddDialog = ref(false);
    const movimientos = ref([]);
    const searchTerm = ref("");
    const quickFilter = ref("all");
    const numeroCasita = computed(() => route.params.numero);
    const isAllMovimientos = computed(
      () => !numeroCasita.value || numeroCasita.value === "todos"
    );
    const pageTitle = computed(() => {
      if (isAllMovimientos.value) return "Todos los movimientos";
      return `Casita ${numeroCasita.value}`;
    });
    const headerDescription = computed(() => {
      if (isAllMovimientos.value) {
        return "Consulta el historial completo y filtra por usuario o por fecha.";
      }

      return `Revisa y registra movimientos de la casita ${numeroCasita.value}.`;
    });

    const nuevoMovimiento = ref({
      movimiento_caja: "",
      detalle: "",
    });

    const formatMovimiento = (movimiento) => {
      if (!movimiento) return "";
      if (typeof movimiento === "string") return movimiento;
      if (typeof movimiento === "object") return JSON.stringify(movimiento);
      return String(movimiento);
    };

    const parseDateValue = (dateString) => {
      if (!dateString) return null;

      const normalizedValue = typeof dateString === "string"
        ? dateString.replace(" ", "T")
        : dateString;
      const parsedDate = new Date(normalizedValue);

      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate;
      }

      if (typeof dateString !== "string") {
        return null;
      }

      const [datePart, timePart = "00:00:00"] = dateString.split(" ");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hours = 0, minutes = 0, seconds = 0] = timePart.split(":").map(Number);

      if ([year, month, day].some((value) => Number.isNaN(value))) {
        return null;
      }

      return new Date(year, month - 1, day, hours, minutes, seconds);
    };

    const isSameCalendarDay = (leftDate, rightDate) => {
      return (
        leftDate.getFullYear() === rightDate.getFullYear() &&
        leftDate.getMonth() === rightDate.getMonth() &&
        leftDate.getDate() === rightDate.getDate()
      );
    };

    const formatDate = (dateString) => {
      const date = parseDateValue(dateString);

      if (!date) return "";

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${day}/${month}/${year} · ${hours}:${minutes}`;
    };

    const formatTime = (dateString) => {
      const date = parseDateValue(dateString);

      if (!date) return "";

      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${hours}:${minutes}`;
    };

    const formatRelativeDate = (dateString) => {
      const date = parseDateValue(dateString);

      if (!date) return "Sin fecha";

      const today = new Date();
      const todayAtMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const targetAtMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const differenceInDays = Math.round(
        (todayAtMidnight.getTime() - targetAtMidnight.getTime()) / 86400000
      );

      if (differenceInDays === 0) return "Hoy";
      if (differenceInDays === 1) return "Ayer";
      if (differenceInDays > 1 && differenceInDays < 7) {
        return `Hace ${differenceInDays} días`;
      }

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");

      return `${day}/${month}`;
    };

    const filteredMovimientos = computed(() => {
      const term = searchTerm.value.trim().toLowerCase();

      return movimientos.value.filter((movimiento) => {
        if (
          quickFilter.value === "mine" &&
          movimiento.usuario !== authStore.user?.Usuario
        ) {
          return false;
        }

        if (quickFilter.value === "today") {
          const createdAt = parseDateValue(movimiento.created_at);
          if (!createdAt || !isSameCalendarDay(createdAt, new Date())) {
            return false;
          }
        }

        if (!term) {
          return true;
        }

        const casita = String(movimiento.casita_caja || "").toLowerCase();
        const usuario = (movimiento.usuario || "").toLowerCase();
        const movimientoLabel = formatMovimiento(movimiento.movimiento_caja).toLowerCase();
        const detalle = (movimiento.detalle || "").toLowerCase();

        return (
          casita.includes(term) ||
          usuario.includes(term) ||
          movimientoLabel.includes(term) ||
          detalle.includes(term)
        );
      });
    });

    const quickFilters = computed(() => {
      const filters = [
        { label: "Todos", value: "all", icon: "apps" },
        { label: "Hoy", value: "today", icon: "today" },
      ];

      if (isLoggedIn.value) {
        filters.splice(1, 0, { label: "Míos", value: "mine", icon: "person" });
      }

      return filters;
    });

    const hasActiveFilters = computed(
      () => Boolean(searchTerm.value.trim()) || quickFilter.value !== "all"
    );

    const resultSummary = computed(() => {
      if (loading.value) {
        return "Preparando historial...";
      }

      const count = filteredMovimientos.value.length;
      const segments = [`${count} ${count === 1 ? "movimiento" : "movimientos"}`];

      if (quickFilter.value === "mine") {
        segments.push("solo tuyos");
      }

      if (quickFilter.value === "today") {
        segments.push("de hoy");
      }

      if (searchTerm.value.trim()) {
        segments.push(`coinciden con "${searchTerm.value.trim()}"`);
      }

      return segments.join(" · ");
    });

    const emptySearchMessage = computed(() => {
      const pieces = [];

      if (searchTerm.value.trim()) {
        pieces.push(`"${searchTerm.value.trim()}"`);
      }

      if (quickFilter.value === "mine") {
        pieces.push("mis movimientos");
      }

      if (quickFilter.value === "today") {
        pieces.push("los movimientos de hoy");
      }

      if (!pieces.length) {
        return "No hay movimientos que coincidan con los filtros actuales.";
      }

      return `No encontramos resultados para ${pieces.join(" y ")}.`;
    });

    const iniciarEdicion = (movimiento) => {
      editingId.value = movimiento.id;
      editMovimiento.value = {
        movimiento_caja: movimiento.movimiento_caja,
        detalle: movimiento.detalle,
      };
    };

    const cancelarEdicion = () => {
      editingId.value = null;
      editMovimiento.value = { movimiento_caja: "", detalle: "" };
    };

    const guardarEdicionMovimiento = async (movimiento) => {
      if (!editMovimiento.value.movimiento_caja.trim()) {
        alert("Por favor ingrese el tipo de acción");
        return;
      }

      savingEdit.value = true;

      try {
        const { error } = await supabase
          .from("cajas_fuertes")
          .update({
            movimiento_caja: editMovimiento.value.movimiento_caja,
            detalle: editMovimiento.value.detalle,
          })
          .eq("id", movimiento.id)
          .eq("usuario", authStore.user?.Usuario);

        if (error) throw error;

        const movementIndex = movimientos.value.findIndex((item) => item.id === movimiento.id);

        if (movementIndex !== -1) {
          movimientos.value[movementIndex] = {
            ...movimientos.value[movementIndex],
            movimiento_caja: editMovimiento.value.movimiento_caja,
            detalle: editMovimiento.value.detalle,
          };
        }

        cancelarEdicion();
      } catch (error) {
        alert("Error al guardar la edición");
        console.error(error);
      } finally {
        savingEdit.value = false;
      }
    };

    const fetchMovimientos = async () => {
      loading.value = true;

      try {
        let query = supabase.from("cajas_fuertes").select("*");

        if (!isAllMovimientos.value) {
          query = query.eq("casita_caja", numeroCasita.value);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) throw error;
        movimientos.value = data || [];
      } catch (error) {
        console.error("Error fetching movimientos:", error);
        movimientos.value = [];
      } finally {
        loading.value = false;
      }
    };

    const cerrarDialog = () => {
      showAddDialog.value = false;
      nuevoMovimiento.value = {
        movimiento_caja: "",
        detalle: "",
      };
    };

    const clearFilters = () => {
      searchTerm.value = "";
      quickFilter.value = "all";
    };

    const goBack = () => {
      if (window.history.length > 1) {
        router.back();
        return;
      }

      router.push("/caja-fuerte");
    };

    const guardarMovimiento = async () => {
      if (!nuevoMovimiento.value.movimiento_caja.trim()) {
        alert("Por favor ingrese el tipo de acción");
        return;
      }

      if (isAllMovimientos.value) {
        alert("Para agregar un movimiento, seleccione una caja fuerte específica");
        return;
      }

      saving.value = true;

      try {
        const now = new Date();
        const localDateTime = new Date(
          now.getTime() - now.getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

        const { error } = await supabase.from("cajas_fuertes").insert({
          casita_caja: numeroCasita.value,
          movimiento_caja: nuevoMovimiento.value.movimiento_caja,
          detalle: nuevoMovimiento.value.detalle,
          usuario: authStore.user?.Usuario,
          created_at: localDateTime,
        });

        if (error) throw error;

        cerrarDialog();
        await fetchMovimientos();
      } catch (error) {
        console.error("Error saving movimiento:", error);
        alert("Error al guardar el movimiento");
      } finally {
        saving.value = false;
      }
    };

    onMounted(() => {
      fetchMovimientos();
    });

    return {
      authStore,
      cancelarEdicion,
      clearFilters,
      cerrarDialog,
      editMovimiento,
      editingId,
      emptySearchMessage,
      filteredMovimientos,
      formatDate,
      formatMovimiento,
      formatRelativeDate,
      formatTime,
      guardarEdicionMovimiento,
      guardarMovimiento,
      goBack,
      hasActiveFilters,
      headerDescription,
      iniciarEdicion,
      isAllMovimientos,
      isLoggedIn,
      loading,
      movimientos,
      nuevoMovimiento,
      numeroCasita,
      pageTitle,
      quickFilter,
      quickFilters,
      resultSummary,
      saving,
      savingEdit,
      searchTerm,
      showAddDialog,
    };
  },
});
</script>

<style scoped>
.mobile-only {
  display: block;
}

.desktop-only {
  display: none;
}

.cf-detail-page {
  max-width: 640px;
  margin: 0 auto;
  padding-bottom: 108px;
}

.cf-detail-shell {
  position: relative;
}

.cf-detail-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-top: 8px;
}

.cf-detail-eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #667085;
}

.back-btn {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
  flex-shrink: 0;
}

.result-pill {
  min-width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  box-shadow: 0 12px 24px rgba(102, 126, 234, 0.26);
  flex-shrink: 0;
}

.detail-toolbar {
  background: rgba(255, 255, 255, 0.94);
  border-radius: 18px;
  padding: 14px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.detail-search :deep(.q-field__control) {
  border-radius: 14px;
}

.detail-toolbar-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.quick-filter-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin: 0 -2px;
}

.quick-filter-row::-webkit-scrollbar {
  display: none;
}

.quick-filter-chip {
  flex-shrink: 0;
  background: #f3f4f6;
  color: #475467;
  border: 1px solid transparent;
  font-weight: 600;
}

.quick-filter-chip--active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.quick-filter-chip--active :deep(.q-chip__content),
.quick-filter-chip--active :deep(.q-icon) {
  color: white;
}

.movements-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.movement-card {
  background: white;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.movement-card-inner {
  display: flex;
  flex-direction: column;
}

.movement-card-top {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.movement-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.28);
}

.movement-topline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.movement-date-badge {
  padding: 4px 10px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 11px;
  font-weight: 700;
}

.movement-time {
  font-size: 12px;
  color: #667085;
}

.movement-title {
  font-size: 15px;
  line-height: 1.35;
  color: #1f2937;
}

.movement-detail-card {
  background: #f8fafc;
  border-radius: 14px;
  padding: 12px;
}

.movement-detail {
  font-size: 14px;
  line-height: 1.45;
  color: #344054;
}

.movement-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.movement-meta-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  background: white;
  border: 1px solid #eef2f6;
  min-width: 0;
}

.movement-meta-item--full {
  grid-column: 1 / -1;
}

.movement-meta-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #98a2b3;
}

.movement-meta-value {
  font-size: 13px;
  font-weight: 600;
  color: #344054;
  word-break: break-word;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.84);
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}

.movement-dialog-card {
  width: min(420px, calc(100vw - 24px));
  max-width: 100%;
  border-radius: 20px;
}

.detail-sticky-action {
  width: calc(100vw - 24px);
  max-width: 616px;
}

.mobile-add-panel {
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 20px;
  padding: 10px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
}

.mobile-add-btn {
  min-height: 50px;
  font-weight: 600;
  text-transform: none;
  border-radius: 14px;
}

@media (max-width: 480px) {
  .movement-meta-grid {
    grid-template-columns: 1fr;
  }

  .movement-meta-item--full {
    grid-column: auto;
  }
}

@media (min-width: 1024px) {
  .mobile-only {
    display: none !important;
  }

  .desktop-only {
    display: block !important;
  }

  .cf-detail-page {
    max-width: 840px;
    padding-bottom: 24px;
  }

  .detail-toolbar {
    padding: 16px 18px;
  }

  .movements-list {
    gap: 16px;
  }

  .movement-card {
    border-radius: 20px;
  }
}

.body--dark .back-btn,
.body--dark .detail-toolbar,
.body--dark .movement-card,
.body--dark .empty-state,
.body--dark .mobile-add-panel {
  background: #1e1e1e;
  border-color: rgba(255, 255, 255, 0.06);
}

.body--dark .quick-filter-chip {
  background: #2a2a2a;
  color: #d0d5dd;
}

.body--dark .movement-detail-card {
  background: #23262d;
}

.body--dark .movement-meta-item {
  background: #22252b;
  border-color: rgba(255, 255, 255, 0.06);
}

.body--dark .movement-detail,
.body--dark .movement-title,
.body--dark .movement-meta-value {
  color: #f3f4f6;
}

.body--dark .movement-time,
.body--dark .cf-detail-eyebrow,
.body--dark .movement-meta-label {
  color: #98a2b3;
}

.body--dark .movement-date-badge {
  background: rgba(102, 126, 234, 0.18);
  color: #c7d2fe;
}
</style>

<template>
  <q-page class="cf-detail-page q-pa-md">
    <!-- Header -->
    <div class="cf-detail-header q-mb-md">
      <div class="text-h5 text-weight-bold">{{ pageTitle }}</div>
      <div class="text-caption text-grey-6 q-mt-xs">Historial de movimientos</div>
    </div>

    <!-- Search bar -->
    <q-input
      v-model="searchTerm"
      rounded
      outlined
      dense
      placeholder="Buscar por casita, usuario, tipo o detalle..."
      class="q-mb-md"
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

    <!-- Add button (non-FAB, inline) -->
    <q-btn
      v-if="!isAllMovimientos && isLoggedIn"
      unelevated
      rounded
      color="primary"
      icon="add"
      label="Agregar movimiento"
      class="q-mb-lg full-width"
      style="text-transform: none; font-weight: 600;"
      @click="showAddDialog = true"
    />

    <!-- Loading state -->
    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner color="primary" size="40px" />
      <div class="q-mt-md text-grey-6 text-body2">Cargando movimientos...</div>
    </div>

    <!-- Movement cards -->
    <div v-else-if="filteredMovimientos.length > 0" class="movements-list">
      <div
        v-for="(movimiento, index) in filteredMovimientos"
        :key="index"
        class="movement-card q-mb-sm"
      >
        <!-- Edit mode -->
        <template v-if="editingIndex === index">
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
                @click="guardarEdicionMovimiento(index, movimiento)"
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

        <!-- View mode -->
        <template v-else>
          <div class="movement-card-inner q-pa-md">
            <div class="movement-card-top">
              <div class="movement-icon-wrap">
                <q-icon name="swap_horiz" color="white" size="18px" />
              </div>
              <div class="col">
                <div class="text-weight-bold movement-title">
                  {{ formatMovimiento(movimiento.movimiento_caja) }}
                </div>
                <div class="text-body2 text-grey-7 q-mt-xs movement-detail">
                  {{ movimiento.detalle || '—' }}
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
                @click="iniciarEdicion(index, movimiento)"
              />
            </div>

            <div class="movement-card-footer q-mt-sm">
              <q-chip
                v-if="isAllMovimientos"
                dense
                color="blue-1"
                text-color="blue-8"
                icon="home"
                size="sm"
                class="movement-chip"
              >
                Casita {{ movimiento.casita_caja }}
              </q-chip>
              <q-chip
                v-else
                dense
                color="blue-1"
                text-color="blue-8"
                icon="home"
                size="sm"
                class="movement-chip"
              >
                Casita {{ numeroCasita }}
              </q-chip>
              <q-chip
                dense
                color="grey-2"
                text-color="grey-7"
                icon="person_outline"
                size="sm"
                class="movement-chip"
              >
                {{ movimiento.usuario }}
              </q-chip>
              <q-chip
                dense
                color="grey-2"
                text-color="grey-7"
                icon="schedule"
                size="sm"
                class="movement-chip"
              >
                {{ formatDate(movimiento.created_at) }}
              </q-chip>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Empty: search no results -->
    <div v-else-if="searchTerm" class="empty-state">
      <q-icon name="search_off" size="52px" color="grey-4" />
      <div class="text-body1 text-grey-5 q-mt-sm">Sin resultados</div>
      <div class="text-caption text-grey-4">No hay movimientos que coincidan con "{{ searchTerm }}"</div>
    </div>

    <!-- Empty: no data -->
    <div v-else class="empty-state">
      <q-icon name="inbox" size="52px" color="grey-4" />
      <div class="text-body1 text-grey-5 q-mt-sm">Sin movimientos</div>
      <div class="text-caption text-grey-4">No hay movimientos registrados para esta caja fuerte</div>
    </div>

    <!-- Dialog: agregar movimiento -->
    <q-dialog v-model="showAddDialog" persistent>
      <q-card style="min-width: 320px; border-radius: 20px;">
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
  </q-page>
</template>

<script>
import { defineComponent, ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { supabase } from "../supabase";
import { useAuthStore } from "../stores/auth";

export default defineComponent({
  name: "CajaFuerteDetailPage",
  setup() {
    const route = useRoute();
    const authStore = useAuthStore();
    const isLoggedIn = computed(() => authStore.isLoggedIn);

    const editingIndex = ref(null)
    const editMovimiento = ref({ movimiento_caja: '', detalle: '' })
    const savingEdit = ref(false)

    const iniciarEdicion = (index, movimiento) => {
      editingIndex.value = index
      editMovimiento.value = { movimiento_caja: movimiento.movimiento_caja, detalle: movimiento.detalle }
    }

    const cancelarEdicion = () => {
      editingIndex.value = null
      editMovimiento.value = { movimiento_caja: '', detalle: '' }
    }

    const guardarEdicionMovimiento = async (index, movimiento) => {
      if (!editMovimiento.value.movimiento_caja.trim()) {
        alert('Por favor ingrese el tipo de acción')
        return
      }
      savingEdit.value = true
      try {
        const { error } = await supabase
          .from('cajas_fuertes')
          .update({
            movimiento_caja: editMovimiento.value.movimiento_caja,
            detalle: editMovimiento.value.detalle
          })
          .eq('id', movimiento.id)
          .eq('usuario', authStore.user?.Usuario)
        if (error) throw error
        // Actualizar localmente
        movimientos.value[index].movimiento_caja = editMovimiento.value.movimiento_caja
        movimientos.value[index].detalle = editMovimiento.value.detalle
        cancelarEdicion()
      } catch (error) {
        alert('Error al guardar la edición')
        console.error(error)
      } finally {
        savingEdit.value = false
      }
    }
    const numeroCasita = computed(() => route.params.numero);

    const isAllMovimientos = computed(() => !numeroCasita.value || numeroCasita.value === 'todos');
    const pageTitle = computed(() => {
      if (isAllMovimientos.value) return 'Todos los movimientos';
      return `Caja fuerte casita ${numeroCasita.value}`;
    });
    const loading = ref(true);
    const saving = ref(false);
    const showAddDialog = ref(false);
    const movimientos = ref([]);
    const searchTerm = ref("");
    const filteredMovimientos = computed(() => {
      if (!searchTerm.value) return movimientos.value;
      const term = searchTerm.value.toLowerCase();
      return movimientos.value.filter(m => {
        const casita = String(m.casita_caja || "").toLowerCase();
        const usuario = (m.usuario || "").toLowerCase();
        const movimiento = formatMovimiento(m.movimiento_caja).toLowerCase();
        const detalle = (m.detalle || "").toLowerCase();
        return casita.includes(term) || usuario.includes(term) || movimiento.includes(term) || detalle.includes(term);
      });
    });

    const nuevoMovimiento = ref({
      movimiento_caja: "",
      detalle: "",
    });

    // Obtener movimientos de la base de datos
    const fetchMovimientos = async () => {
      loading.value = true;
      try {

        let query = supabase
          .from("cajas_fuertes")
          .select("*");

        // Si no es "todos", filtrar por número de casita
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

    // Formatear movimiento (puede ser string o JSON)
    const formatMovimiento = (movimiento) => {
      if (!movimiento) return "";
      if (typeof movimiento === "string") return movimiento;
      if (typeof movimiento === "object") return JSON.stringify(movimiento);
      return String(movimiento);
    };

    // Formatear fecha sin zona horaria
    const formatDate = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      // Obtener fecha local sin timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    // Cerrar diálogo
    const cerrarDialog = () => {
      showAddDialog.value = false;
      nuevoMovimiento.value = {
        movimiento_caja: "",
        detalle: "",
      };
    };

    // Guardar nuevo movimiento
    const guardarMovimiento = async () => {
      if (!nuevoMovimiento.value.movimiento_caja.trim()) {
        alert("Por favor ingrese el tipo de acción");
        return;
      }

      // No permitir guardar movimientos si está en modo "todos"
      if (isAllMovimientos.value) {
        alert("Para agregar un movimiento, seleccione una caja fuerte específica");
        return;
      }

      saving.value = true;
      try {
        // Obtener fecha local sin timezone
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
      numeroCasita,
      isAllMovimientos,
      pageTitle,
      loading,
      saving,
      showAddDialog,
      movimientos,
      filteredMovimientos,
      searchTerm,
      nuevoMovimiento,
      formatDate,
      formatMovimiento,
      cerrarDialog,
      guardarMovimiento,
      isLoggedIn,
      editingIndex,
      editMovimiento,
      iniciarEdicion,
      cancelarEdicion,
      guardarEdicionMovimiento,
      savingEdit,
      authStore
    }
  },
});
</script>

<style scoped>
.cf-detail-page {
  max-width: 600px;
  margin: 0 auto;
}

.cf-detail-header {
  padding-top: 8px;
}

/* Movement cards */
.movement-card {
  background: white;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.055);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.15s ease;
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
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.movement-title {
  font-size: 14px;
  line-height: 1.3;
}

.movement-detail {
  font-size: 13px;
  line-height: 1.4;
}

.movement-card-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-left: 48px;
}

.movement-chip {
  font-size: 11px !important;
  height: 22px !important;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

/* Dark mode */
.body--dark .movement-card {
  background: #1e1e1e;
  border-color: rgba(255, 255, 255, 0.06);
}
</style>

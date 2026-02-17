<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">{{ pageTitle }}</div>

    <!-- Buscador -->
    <q-input
      v-model="searchTerm"
      debounce="300"
      filled
      placeholder="Buscar por casita, usuario, tipo de acción o detalle..."
      class="q-mb-md"
    >
      <template v-slot:append>
        <q-icon v-if="searchTerm" name="clear" class="cursor-pointer" @click="searchTerm = ''" />
        <q-icon name="search" />
      </template>
    </q-input>

    <!-- Botón para agregar nuevo movimiento -->
    <q-btn
      v-if="!isAllMovimientos"
      color="primary"
      icon="add"
      label="Agregar Movimiento"
      class="q-mb-md"
      @click="showAddDialog = true"
    />

    <!-- Indicador de carga -->
    <div v-if="loading" class="text-center q-pa-md">
      <q-spinner color="primary" size="3em" />
      <div class="q-mt-md">Cargando datos...</div>
    </div>

    <!-- Lista de movimientos -->
    <q-list v-else-if="filteredMovimientos.length > 0" bordered separator class="rounded-borders">
      <q-item v-for="(movimiento, index) in filteredMovimientos" :key="index">
        <q-item-section>
          <q-item-label class="text-weight-bold">
            {{ formatMovimiento(movimiento.movimiento_caja) }}
          </q-item-label>
          <q-item-label caption>
            {{ movimiento.detalle }}
          </q-item-label>
          <q-item-label caption class="q-mt-xs">
            <span v-if="isAllMovimientos" class="text-weight-bold">Caja casita {{ movimiento.casita_caja }}</span>
            <span v-else class="text-weight-bold">Caja casita {{ numeroCasita }}</span>
            <span> | Fecha: {{ formatDate(movimiento.created_at) }} | Usuario: {{ movimiento.usuario }}</span>
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Mensaje cuando no hay datos -->
    <div v-else-if="searchTerm" class="text-center q-pa-md text-grey">
      <q-icon name="search_off" size="3em" />
      <div class="q-mt-md">No se encontraron resultados para "{{ searchTerm }}"</div>
    </div>
    <div v-else class="text-center q-pa-md text-grey">
      <q-icon name="info" size="3em" />
      <div class="q-mt-md">No hay movimientos registrados para esta caja fuerte</div>
    </div>

    <!-- Diálogo para agregar movimiento -->
    <q-dialog v-model="showAddDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Agregar Movimiento{{ isAllMovimientos ? '' : ' - Caja ' + numeroCasita }}</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="nuevoMovimiento.movimiento_caja"
            label="Tipo de acción"
            filled
            class="q-mb-md"
          />
          <q-input
            v-model="nuevoMovimiento.detalle"
            label="Detalle"
            type="textarea"
            filled
          />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Cancelar" @click="cerrarDialog" />
          <q-btn flat label="Guardar" @click="guardarMovimiento" :loading="saving" />
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
          .select("*")
          .eq("usuario", authStore.user?.Usuario);

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
    };
  },
});
</script>

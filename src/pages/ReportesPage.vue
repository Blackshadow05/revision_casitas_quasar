<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Reportes - Revisiones de Casitas</div>

    <q-card bordered class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1 q-mb-md">Configuración del Reporte</div>
        
        <!-- Date Range Selection - only show for "all" report type -->
        <div class="row q-col-gutter-md q-mb-md" v-if="reportType === 'all'">
          <div class="col-12 col-sm-6">
            <q-input
              v-model="dateFrom"
              type="date"
              label="Fecha desde"
              outlined
              dense
              :rules="[val => !!val || 'La fecha desde es requerida']"
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-input
              v-model="dateTo"
              type="date"
              label="Fecha hasta"
              outlined
              dense
              :rules="[val => !!val || 'La fecha hasta es requerida']"
            />
          </div>
        </div>

        <!-- Info message when last revision is selected -->
        <div class="q-mb-md text-caption text-grey-7" v-if="reportType === 'last'">
          <q-icon name="info" class="q-mr-xs" />
          Se generará un reporte con la última revisión de cada casita (sin límite de fecha)
        </div>

        <!-- Report Type Selection -->
        <div class="q-mb-md">
          <div class="text-subtitle2 q-mb-sm">Tipo de reporte:</div>
          <q-option-group
            v-model="reportType"
            :options="reportTypeOptions"
            type="radio"
            inline
          />
        </div>

        <!-- Field Selection -->
        <div class="q-mb-md">
          <div class="text-subtitle2 q-mb-sm">Seleccionar campos para el reporte:</div>
          <div class="row q-col-gutter-sm">
            <div class="col-6 col-sm-4 col-md-3" v-for="field in availableFields" :key="field.value">
              <q-checkbox
                v-model="selectedFields"
                :val="field.value"
                :label="field.label"
                dense
              />
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="row q-gutter-sm">
          <q-btn
            color="primary"
            icon="download"
            label="Generar CSV"
            @click="generateCSV"
            :loading="loading"
            :disable="!isLoggedIn || (reportType === 'all' && (!dateFrom || !dateTo)) || selectedFields.length === 0"
          />
          <q-btn
            color="grey"
            icon="select_all"
            label="Seleccionar Todos"
            @click="selectAllFields"
            flat
          />
          <q-btn
            color="grey"
            icon="deselect"
            label="Limpiar Selección"
            @click="clearFieldSelection"
            flat
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Results Info -->
    <q-card v-if="recordsFound !== null" bordered>
      <q-card-section>
        <div class="row items-center">
          <q-icon 
            :name="recordsFound > 0 ? 'check_circle' : 'warning'" 
            :color="recordsFound > 0 ? 'positive' : 'warning'"
            size="md"
            class="q-mr-md"
          />
          <div>
            <div class="text-subtitle1">
              {{ recordsFound }} registro(s) encontrado(s)
            </div>
            <div class="text-caption text-grey" v-if="recordsFound > 0">
              {{ selectedFields.length }} campos seleccionados
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Preview Table -->
    <q-card v-if="previewData.length > 0" bordered class="q-mt-md">
      <q-card-section>
        <div class="text-subtitle1 q-mb-md">Vista Previa (primeros 5 registros)</div>
        <q-table
          :rows="previewData"
          :columns="previewColumns"
          row-key="id"
          flat
          dense
          :pagination="{ rowsPerPage: 5 }"
          :rows-per-page-options="[5]"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed } from "vue";
import { notify } from '../utils/notify'
import { supabase } from "../supabase";
import { useQuasar } from "quasar";
import { useAuthStore } from '../stores/auth'

const $q = useQuasar();
const authStore = useAuthStore();
const isLoggedIn = computed(() => authStore.isLoggedIn);

const dateFrom = ref("");
const dateTo = ref("");
const selectedFields = ref([]);
const loading = ref(false);
const recordsFound = ref(null);
const previewData = ref([]);
const reportType = ref("all");

const reportTypeOptions = [
  { label: "Todas las revisiones", value: "all" },
  { label: "Última revisión por casita", value: "last" },
];

// Available fields for the report - ordered as specified by user
const availableFields = [
  { label: "Casita", value: "casita" },
  { label: "Quién Revisa", value: "quien_revisa" },
  { label: "Fecha Creación", value: "created_at" },
  { label: "Caja Fuerte", value: "caja_fuerte" },
  { label: "Puertas y Ventanas", value: "puertas_ventanas" },
  { label: "Chromecast", value: "chromecast" },
  { label: "Speaker", value: "speaker" },
  { label: "USB Speaker", value: "usb_speaker" },
  { label: "Controles TV", value: "controles_tv" },
  { label: "Binoculares", value: "binoculares" },
  { label: "Trapo Binoculares", value: "trapo_binoculares" },
  { label: "Secadora", value: "secadora" },
  { label: "Accesorios Secadora", value: "accesorios_secadora" },
  { label: "Steamer", value: "steamer" },
  { label: "Bolsa Vapor", value: "bolsa_vapor" },
  { label: "Plancha Cabello", value: "plancha_cabello" },
  { label: "Cola Caballo", value: "cola_caballo" },
  { label: "Bulto", value: "bulto" },
  { label: "Sombrero", value: "sombrero" },
  { label: "Bolso Yute", value: "bolso_yute" },
  { label: "Camas Ordenadas", value: "camas_ordenadas" },
  { label: "Notas", value: "observaciones" },
  { label: "Evidencia 1", value: "evidencia_1" },
  { label: "Evidencia 2", value: "evidencia_2" },
  { label: "Evidencia 3", value: "evidencia_3" },
];

// Default selected fields - all fields in the specified order
const defaultFields = availableFields.map((f) => f.value);

// Initialize with default fields
selectedFields.value = [...defaultFields];

// Preview columns
const previewColumns = computed(() => {
  return selectedFields.value.map((field) => {
    const fieldInfo = availableFields.find((f) => f.value === field);
    return {
      name: field,
      label: fieldInfo ? fieldInfo.label : field,
      field: field,
      align: "left",
      sortable: false,
    };
  });
});

// Select all fields
const selectAllFields = () => {
  selectedFields.value = availableFields.map((f) => f.value);
};

// Clear field selection
const clearFieldSelection = () => {
  selectedFields.value = [];
};

// Format date for CSV (with time)
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  // Format: YYYY-MM-DD HH:MM:SS
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Escape CSV field
const escapeCSVField = (field) => {
  if (field === null || field === undefined) return "";
  const stringField = String(field);
  // If the field contains comma, newline, or quote, wrap in quotes and escape quotes
  if (stringField.includes(",") || stringField.includes("\n") || stringField.includes('"')) {
    return '"' + stringField.replace(/"/g, '""') + '"';
  }
  return stringField;
};

// Generate CSV
const generateCSV = async () => {
  // Check validation based on report type
  if (reportType.value === "all") {
    if (!dateFrom.value || !dateTo.value) {
      notify({
        type: "warning",
        message: "Por favor seleccione un rango de fechas",
      });
      return;
    }
  }

  if (selectedFields.value.length === 0) {
    notify({
      type: "warning",
      message: "Por favor seleccione al menos un campo",
    });
    return;
  }

  loading.value = true;
  recordsFound.value = null;
  previewData.value = [];

  try {
    let data, error;

    if (reportType.value === "all") {
      // Fetch all records in the date range
      const startDate = dateFrom.value + "T00:00:00";
      const endDate = dateTo.value + "T23:59:59";

      const result = await supabase
        .from("revisiones_casitas")
        .select("*")
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: false });

      data = result.data;
      error = result.error;
    } else {
      // Fetch ALL records (no date filter) for last revision per casita
      const result = await supabase
        .from("revisiones_casitas")
        .select("*")
        .order("created_at", { ascending: false });

      data = result.data;
      error = result.error;
    }

    if (error) throw error;

    // If "last revision per casita" is selected, filter to keep only the most recent
    let filteredData = data;
    if (reportType.value === "last") {
      const latestByCasa = {};
      for (const casa of data) {
        if (!latestByCasa[casa.casita]) {
          latestByCasa[casa.casita] = casa;
        }
      }
      filteredData = Object.values(latestByCasa);
    }

    recordsFound.value = filteredData.length;
    previewData.value = filteredData.slice(0, 5);

    if (data.length === 0) {
      notify({
        type: "info",
        message: "No se encontraron registros en el rango de fechas seleccionado",
      });
      return;
    }

    // Generate CSV content
    const headers = selectedFields.value.map((field) => {
      const fieldInfo = availableFields.find((f) => f.value === field);
      return fieldInfo ? fieldInfo.label : field;
    });

    const csvRows = [];
    csvRows.push(headers.join(","));

    for (const row of filteredData) {
      const values = selectedFields.value.map((field) => {
        let value = row[field];
        // Format dates
        if (field === "created_at" && value) {
          value = formatDate(value);
        }
        return escapeCSVField(value);
      });
      csvRows.push(values.join(","));
    }

    const csvContent = csvRows.join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    // Generate file name based on report type
    const fileName = reportType.value === "last" 
      ? `reporte_ultima_casita_${new Date().toISOString().split('T')[0]}.csv`
      : `reporte_casitas_${dateFrom.value}_${dateTo.value}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const reportTypeLabel = reportType.value === "last" ? "última revisión por casita" : "todas las revisiones";

    notify({
      type: "positive",
      message: `Reporte generado exitosamente: ${filteredData.length} registros (${reportTypeLabel})`,
    });
  } catch (error) {
    console.error("Error generating CSV:", error);
    notify({
      type: "negative",
      message: "Error al generar el reporte: " + error.message,
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.q-checkbox {
  font-size: 0.9rem;
}
</style>

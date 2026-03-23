<template>
  <q-page class="q-pa-md dashboard-horario lt-md">
    <div class="row items-center q-mb-md">
      <q-btn flat round icon="arrow_back" @click="$router.push('/config')" />
      <div class="text-h5 q-ml-sm">Dashboard Horario</div>
    </div>

    <!-- Tabs -->
    <q-tabs v-model="activeTab" dense class="text-primary q-mb-md" active-color="primary" indicator-color="primary" align="left" narrow-indicator>
      <q-tab name="horarios" label="Horarios" icon="schedule" />
      <q-tab name="extras" label="Extras" icon="more_time" />
    </q-tabs>

    <q-separator class="q-mb-md" />

    <!-- ==================== TAB HORARIOS ==================== -->
    <div v-show="activeTab === 'horarios'">
      <!-- Date picker -->
      <div class="row items-center q-mb-md q-gutter-sm">
        <q-icon name="event" size="sm" color="primary" />
        <q-input
          v-model="selectedDate"
          type="date"
          dense
          outlined
          style="max-width: 200px"
          @update:model-value="fetchHorarios"
        />
      </div>

      <q-inner-loading :showing="loading">
        <q-spinner-gears size="50px" color="primary" />
      </q-inner-loading>

      <q-banner v-if="errorMsg" class="bg-negative text-white q-mb-md" rounded>
        <template #avatar><q-icon name="error" /></template>
        {{ errorMsg }}
      </q-banner>

      <template v-if="!loading">
        <!-- Turno Diurno -->
        <q-card class="q-mb-md">
          <q-card-section class="bg-amber-6 text-white">
            <div class="row items-center">
              <q-icon name="wb_sunny" size="sm" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-bold">Turno Diurno</div>
              <q-space />
              <q-badge color="white" text-color="amber-8" :label="turnoDiurno.length" />
            </div>
          </q-card-section>
          <q-list separator>
            <q-item v-for="emp in turnoDiurno" :key="emp.id">
              <q-item-section avatar>
                <q-avatar color="amber-2" text-color="amber-9">
                  {{ emp.empleado.charAt(0).toUpperCase() }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ emp.empleado }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge outline color="amber-8" :label="emp.turno" />
              </q-item-section>
            </q-item>
            <q-item v-if="turnoDiurno.length === 0">
              <q-item-section class="text-grey text-center">Sin personal en este turno</q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Turno Mixto -->
        <q-card class="q-mb-md">
          <q-card-section class="bg-deep-purple-6 text-white">
            <div class="row items-center">
              <q-icon name="brightness_6" size="sm" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-bold">Turno Mixto</div>
              <q-space />
              <q-badge color="white" text-color="deep-purple-8" :label="turnoMixto.length" />
            </div>
          </q-card-section>
          <q-list separator>
            <q-item v-for="emp in turnoMixto" :key="emp.id">
              <q-item-section avatar>
                <q-avatar color="deep-purple-2" text-color="deep-purple-9">
                  {{ emp.empleado.charAt(0).toUpperCase() }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ emp.empleado }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge outline color="deep-purple-8" :label="emp.turno" />
              </q-item-section>
            </q-item>
            <q-item v-if="turnoMixto.length === 0">
              <q-item-section class="text-grey text-center">Sin personal en este turno</q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Turno Nocturno -->
        <q-card class="q-mb-md">
          <q-card-section class="bg-blue-grey-8 text-white">
            <div class="row items-center">
              <q-icon name="nights_stay" size="sm" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-bold">Turno Nocturno</div>
              <q-space />
              <q-badge color="white" text-color="blue-grey-8" :label="turnoNocturno.length" />
            </div>
          </q-card-section>
          <q-list separator>
            <q-item v-for="emp in turnoNocturno" :key="emp.id">
              <q-item-section avatar>
                <q-avatar color="blue-grey-2" text-color="blue-grey-9">
                  {{ emp.empleado.charAt(0).toUpperCase() }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ emp.empleado }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge outline color="blue-grey-8" :label="emp.turno" />
              </q-item-section>
            </q-item>
            <q-item v-if="turnoNocturno.length === 0">
              <q-item-section class="text-grey text-center">Sin personal en este turno</q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Otros -->
        <q-card v-if="turnoOtros.length > 0" class="q-mb-md">
          <q-card-section class="bg-grey-6 text-white">
            <div class="row items-center">
              <q-icon name="info" size="sm" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-bold">Otros</div>
              <q-space />
              <q-badge color="white" text-color="grey-8" :label="turnoOtros.length" />
            </div>
          </q-card-section>
          <q-list separator>
            <q-item v-for="emp in turnoOtros" :key="emp.id">
              <q-item-section avatar>
                <q-avatar color="grey-3" text-color="grey-8">
                  {{ emp.empleado.charAt(0).toUpperCase() }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ emp.empleado }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge outline color="grey-8" :label="emp.turno" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </template>
    </div>

    <!-- ==================== TAB EXTRAS ==================== -->
    <div v-show="activeTab === 'extras'">
      <div class="text-caption text-grey-7 q-mb-sm">
        Quincena: <strong>{{ quincenaLabel }}</strong>
      </div>

      <q-inner-loading :showing="loadingExtras">
        <q-spinner-gears size="50px" color="primary" />
      </q-inner-loading>

      <q-banner v-if="errorExtras" class="bg-negative text-white q-mb-md" rounded>
        <template #avatar><q-icon name="error" /></template>
        {{ errorExtras }}
      </q-banner>

      <template v-if="!loadingExtras && extrasResumen.length > 0">
        <!-- Extras Nocturnas -->
        <q-card class="q-mb-md">
          <q-card-section class="bg-blue-grey-8 text-white">
            <div class="row items-center">
              <q-icon name="nights_stay" size="sm" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-bold">Horas Extra Nocturnas</div>
              <q-space />
              <q-badge color="white" text-color="blue-grey-8" :label="totalExtrasNocturnas + 'h'" />
            </div>
          </q-card-section>
          <q-list separator>
            <q-item v-for="emp in extrasNocturnas" :key="emp.empleado">
              <q-item-section avatar>
                <q-avatar color="blue-grey-2" text-color="blue-grey-9">
                  {{ emp.empleado.charAt(0).toUpperCase() }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ emp.empleado }}</q-item-label>
                <q-item-label caption>{{ emp.dias }} día(s) con turno 10pm/6am</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge color="blue-grey-8" text-color="white" :label="emp.horas + 'h extras'" />
              </q-item-section>
            </q-item>
            <q-item v-if="extrasNocturnas.length === 0">
              <q-item-section class="text-grey text-center">Sin horas extra nocturnas</q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Extras Mixtas -->
        <q-card class="q-mb-md">
          <q-card-section class="bg-deep-purple-6 text-white">
            <div class="row items-center">
              <q-icon name="brightness_6" size="sm" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-bold">Horas Extra Mixtas</div>
              <q-space />
              <q-badge color="white" text-color="deep-purple-8" :label="totalExtrasMixtas + 'h'" />
            </div>
          </q-card-section>
          <q-list separator>
            <q-item v-for="emp in extrasMixtas" :key="emp.empleado">
              <q-item-section avatar>
                <q-avatar color="deep-purple-2" text-color="deep-purple-9">
                  {{ emp.empleado.charAt(0).toUpperCase() }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ emp.empleado }}</q-item-label>
                <q-item-label caption>{{ emp.dias }} día(s) con turno 2pm/10pm</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge color="deep-purple-8" text-color="white" :label="emp.horas + 'h extras'" />
              </q-item-section>
            </q-item>
            <q-item v-if="extrasMixtas.length === 0">
              <q-item-section class="text-grey text-center">Sin horas extra mixtas</q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </template>

      <div v-if="!loadingExtras && extrasResumen.length === 0 && !errorExtras" class="text-grey text-center q-pa-lg">
        No hay horas extra en esta quincena
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from "vue";
import { supabase } from "../supabase";

export default defineComponent({
  name: "DashboardHorarioPage",
  setup() {
    const activeTab = ref("horarios");
    const loading = ref(false);
    const horarios = ref([]);
    const errorMsg = ref("");

    // --- Extras state ---
    const loadingExtras = ref(false);
    const horariosQuincena = ref([]);
    const errorExtras = ref("");

    function getLocalDateString() {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    const selectedDate = ref(getLocalDateString());

    // --- Quincena helpers ---
    function getQuincenaRange() {
      const today = new Date();
      const y = today.getFullYear();
      const m = today.getMonth(); // 0-based
      const day = today.getDate();

      let desde, hasta;
      if (day >= 12 && day <= 28) {
        // Quincena del 12 al 28 del mes actual
        desde = new Date(y, m, 12);
        hasta = new Date(y, m, 28);
      } else if (day >= 29) {
        // Quincena del 29 del mes actual al 11 del mes siguiente
        desde = new Date(y, m, 29);
        hasta = new Date(y, m + 1, 11);
      } else {
        // day 1-11: Quincena del 29 del mes anterior al 11 del mes actual
        desde = new Date(y, m - 1, 29);
        hasta = new Date(y, m, 11);
      }
      return { desde, hasta };
    }

    function formatDate(d) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    const quincenaLabel = computed(() => {
      const { desde, hasta } = getQuincenaRange();
      return `${formatDate(desde)}  al  ${formatDate(hasta)}`;
    });

    // --- Turno classification ---
    const turnosDiurno = ["6am/2pm", "7am/3pm", "6am/5pm", "8am/4pm", "11am/7pm", "07:00/16:00", "8am/5pm", "8am/7pm"];
    const turnosMixto = ["2pm/10pm", "3pm/10pm", "12md/10pm"];
    const turnosNocturno = ["10pm/6am", "10pm/4am"];

    const normalizar = (t) => (t || "").trim();

    const turnoDiurno = computed(() =>
      horarios.value.filter((h) => turnosDiurno.includes(normalizar(h.turno)))
    );
    const turnoMixto = computed(() =>
      horarios.value.filter((h) => turnosMixto.includes(normalizar(h.turno)))
    );
    const turnoNocturno = computed(() =>
      horarios.value.filter((h) => turnosNocturno.includes(normalizar(h.turno)))
    );
    const turnoOtros = computed(() =>
      horarios.value.filter((h) => {
        const t = normalizar(h.turno);
        return (
          !turnosDiurno.includes(t) &&
          !turnosMixto.includes(t) &&
          !turnosNocturno.includes(t)
        );
      })
    );

    // --- Extras calculation ---
    // 10pm/6am = 2 horas extras nocturnas por día
    // 2pm/10pm = 1 hora extra mixta por día
    const extrasResumen = computed(() => {
      const map = {};
      for (const h of horariosQuincena.value) {
        const t = normalizar(h.turno);
        let tipo = null;
        let horasExtra = 0;
        if (t === "10pm/6am") {
          tipo = "nocturna";
          horasExtra = 2;
        } else if (t === "2pm/10pm") {
          tipo = "mixta";
          horasExtra = 1;
        }
        if (!tipo) continue;

        const key = `${h.empleado}__${tipo}`;
        if (!map[key]) {
          map[key] = { empleado: h.empleado, tipo, dias: 0, horas: 0 };
        }
        map[key].dias++;
        map[key].horas += horasExtra;
      }
      return Object.values(map).sort((a, b) => a.empleado.localeCompare(b.empleado));
    });

    const extrasNocturnas = computed(() => extrasResumen.value.filter((e) => e.tipo === "nocturna"));
    const extrasMixtas = computed(() => extrasResumen.value.filter((e) => e.tipo === "mixta"));
    const totalExtrasNocturnas = computed(() => extrasNocturnas.value.reduce((s, e) => s + e.horas, 0));
    const totalExtrasMixtas = computed(() => extrasMixtas.value.reduce((s, e) => s + e.horas, 0));

    // --- Fetch functions ---
    async function fetchHorarios() {
      loading.value = true;
      errorMsg.value = "";
      const { data, error } = await supabase
        .from("horarios")
        .select("id, empleado, turno, fecha")
        .eq("fecha", selectedDate.value)
        .order("empleado");

      if (error) {
        errorMsg.value = error.message;
      } else {
        horarios.value = data || [];
      }
      loading.value = false;
    }

    async function fetchExtras() {
      loadingExtras.value = true;
      errorExtras.value = "";
      const { desde, hasta } = getQuincenaRange();
      const { data, error } = await supabase
        .from("horarios")
        .select("id, empleado, turno, fecha")
        .gte("fecha", formatDate(desde))
        .lte("fecha", formatDate(hasta))
        .in("turno", ["10pm/6am", "2pm/10pm"])
        .order("empleado");

      if (error) {
        errorExtras.value = error.message;
      } else {
        horariosQuincena.value = data || [];
      }
      loadingExtras.value = false;
    }

    watch(activeTab, (tab) => {
      if (tab === "extras" && horariosQuincena.value.length === 0 && !loadingExtras.value) {
        fetchExtras();
      }
    });

    onMounted(() => {
      fetchHorarios();
    });

    return {
      activeTab,
      loading,
      selectedDate,
      errorMsg,
      turnoDiurno,
      turnoMixto,
      turnoNocturno,
      turnoOtros,
      fetchHorarios,
      loadingExtras,
      errorExtras,
      quincenaLabel,
      extrasResumen,
      extrasNocturnas,
      extrasMixtas,
      totalExtrasNocturnas,
      totalExtrasMixtas,
    };
  },
});
</script>

<style scoped>
.dashboard-horario {
  max-width: 700px;
  margin: 0 auto;
}
</style>

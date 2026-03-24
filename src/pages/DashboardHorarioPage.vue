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
      <q-tab name="vacaciones" label="Vacaciones" icon="beach_access" />
      <q-tab name="feriados" label="Feriados" icon="celebration" />
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
          <q-card-section class="bg-red-6 text-white">
            <div class="row items-center">
              <q-icon name="wb_sunny" size="sm" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-bold">Turno Diurno</div>
              <q-space />
              <q-badge color="white" text-color="red-8" :label="turnoDiurno.length" />
            </div>
          </q-card-section>
          <q-list separator>
            <q-item v-for="emp in turnoDiurno" :key="emp.id">
              <q-item-section avatar>
                <q-avatar color="red-2" text-color="red-9">
                  {{ emp.empleado.charAt(0).toUpperCase() }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ emp.empleado }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge outline color="red-8" :label="emp.turno" />
              </q-item-section>
            </q-item>
            <q-item v-if="turnoDiurno.length === 0">
              <q-item-section class="text-grey text-center">Sin personal en este turno</q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Jornada Partida -->
        <q-card class="q-mb-md">
          <q-card-section class="bg-orange-7 text-white">
            <div class="row items-center">
              <q-icon name="schedule" size="sm" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-bold">Jornada Partida</div>
              <q-space />
              <q-badge color="white" text-color="orange-9" :label="turnoPartida.length" />
            </div>
          </q-card-section>
          <q-list separator>
            <q-item v-for="emp in turnoPartida" :key="emp.id">
              <q-item-section avatar>
                <q-avatar color="orange-2" text-color="orange-9">
                  {{ emp.empleado.charAt(0).toUpperCase() }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ emp.empleado }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge outline color="orange-8" :label="emp.turno" />
              </q-item-section>
            </q-item>
            <q-item v-if="turnoPartida.length === 0">
              <q-item-section class="text-grey text-center">Sin personal en esta jornada</q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Turno Mixto -->
        <q-card class="q-mb-md">
          <q-card-section class="bg-green-6 text-white">
            <div class="row items-center">
              <q-icon name="brightness_6" size="sm" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-bold">Turno Mixto</div>
              <q-space />
              <q-badge color="white" text-color="green-8" :label="turnoMixto.length" />
            </div>
          </q-card-section>
          <q-list separator>
            <q-item v-for="emp in turnoMixto" :key="emp.id">
              <q-item-section avatar>
                <q-avatar color="green-2" text-color="green-9">
                  {{ emp.empleado.charAt(0).toUpperCase() }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ emp.empleado }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge outline color="green-8" :label="emp.turno" />
              </q-item-section>
            </q-item>
            <q-item v-if="turnoMixto.length === 0">
              <q-item-section class="text-grey text-center">Sin personal en este turno</q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Turno Nocturno -->
        <q-card class="q-mb-md">
          <q-card-section class="bg-blue-8 text-white">
            <div class="row items-center">
              <q-icon name="nights_stay" size="sm" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-bold">Turno Nocturno</div>
              <q-space />
              <q-badge color="white" text-color="blue-8" :label="turnoNocturno.length" />
            </div>
          </q-card-section>
          <q-list separator>
            <q-item v-for="emp in turnoNocturno" :key="emp.id">
              <q-item-section avatar>
                <q-avatar color="blue-2" text-color="blue-9">
                  {{ emp.empleado.charAt(0).toUpperCase() }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ emp.empleado }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge outline color="blue-8" :label="emp.turno" />
              </q-item-section>
            </q-item>
            <q-item v-if="turnoNocturno.length === 0">
              <q-item-section class="text-grey text-center">Sin personal en este turno</q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Otros -->
        <q-card v-if="turnoOtros.length > 0" class="q-mb-md">
          <q-card-section class="bg-yellow-7 text-black">
            <div class="row items-center">
              <q-icon name="info" size="sm" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-bold">Otros</div>
              <q-space />
              <q-badge color="white" text-color="yellow-9" :label="turnoOtros.length" />
            </div>
          </q-card-section>
          <q-list separator>
            <q-item v-for="emp in turnoOtros" :key="emp.id">
              <q-item-section avatar>
                <q-avatar color="yellow-2" text-color="yellow-10">
                  {{ emp.empleado.charAt(0).toUpperCase() }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ emp.empleado }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge outline color="yellow-8" :label="emp.turno" />
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
          <q-card-section class="bg-blue-8 text-white">
            <div class="row items-center">
              <q-icon name="nights_stay" size="sm" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-bold">Horas Extra Nocturnas</div>
              <q-space />
              <q-badge color="white" text-color="blue-8" :label="totalExtrasNocturnas + 'h'" />
            </div>
          </q-card-section>
          <q-list separator>
            <q-item v-for="emp in extrasNocturnas" :key="emp.empleado" clickable v-ripple @click="openDiasDialog(emp)">
              <q-item-section avatar>
                <q-avatar color="blue-2" text-color="blue-9">
                  {{ emp.empleado.charAt(0).toUpperCase() }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ emp.empleado }}</q-item-label>
                <q-item-label caption>{{ emp.dias }} día(s) con turno 10pm/6am</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row items-center q-gutter-xs">
                  <q-badge color="blue-8" text-color="white" :label="emp.horas + 'h extras'" />
                  <q-icon name="chevron_right" color="blue-5" />
                </div>
              </q-item-section>
            </q-item>
            <q-item v-if="extrasNocturnas.length === 0">
              <q-item-section class="text-grey text-center">Sin horas extra nocturnas</q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Extras Mixtas -->
        <q-card class="q-mb-md">
          <q-card-section class="bg-green-6 text-white">
            <div class="row items-center">
              <q-icon name="brightness_6" size="sm" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-bold">Horas Extra Mixtas</div>
              <q-space />
              <q-badge color="white" text-color="green-8" :label="totalExtrasMixtas + 'h'" />
            </div>
          </q-card-section>
          <q-list separator>
            <q-item v-for="emp in extrasMixtas" :key="emp.empleado" clickable v-ripple @click="openDiasDialog(emp)">
              <q-item-section avatar>
                <q-avatar color="green-2" text-color="green-9">
                  {{ emp.empleado.charAt(0).toUpperCase() }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ emp.empleado }}</q-item-label>
                <q-item-label caption>{{ emp.dias }} día(s) con turno 2pm/10pm</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row items-center q-gutter-xs">
                  <q-badge color="green-8" text-color="white" :label="emp.horas + 'h extras'" />
                  <q-icon name="chevron_right" color="green-5" />
                </div>
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

    <!-- ==================== TAB VACACIONES ==================== -->
    <div v-show="activeTab === 'vacaciones'">
      <div class="row q-gutter-sm q-mb-md">
        <q-select
          v-model="vacacionesAnio"
          :options="vacacionesAnioOptions"
          label="Año"
          dense
          outlined
          emit-value
          map-options
          style="min-width: 120px"
        />
      </div>

      <q-inner-loading :showing="loadingVacaciones">
        <q-spinner-gears size="50px" color="primary" />
      </q-inner-loading>

      <q-banner v-if="errorVacaciones" class="bg-negative text-white q-mb-md" rounded>
        <template #avatar><q-icon name="error" /></template>
        {{ errorVacaciones }}
      </q-banner>

      <template v-if="!loadingVacaciones && vacacionesResumen.length > 0">
        <q-card class="q-mb-md" v-for="vac in vacacionesResumen" :key="vac.empleado">
          <q-card-section class="bg-cyan-7 text-white">
            <div class="row items-center">
              <q-avatar color="cyan-2" text-color="cyan-9" class="q-mr-sm" size="36px">
                {{ vac.empleado.charAt(0).toUpperCase() }}
              </q-avatar>
              <div>
                <div class="text-subtitle1 text-weight-bold">{{ vac.empleado }}</div>
                <div class="text-caption">{{ vac.periodos.length }} periodo(s) en {{ vacacionesAnio }}</div>
              </div>
              <q-space />
              <q-badge color="white" text-color="cyan-9" :label="vac.totalDiasVacaciones + ' día(s)'" />
            </div>
          </q-card-section>
          <q-card-section class="q-pa-none">
            <div v-for="(periodo, idx) in vac.periodos" :key="periodo.desde + periodo.hasta">
              <div class="q-pa-md">
                <div class="row items-center q-mb-sm">
                  <div class="text-subtitle2 text-weight-bold">Periodo {{ idx + 1 }}</div>
                  <q-space />
                  <q-badge color="cyan-7" text-color="white" :label="periodo.diasVacaciones + ' día(s)'" />
                </div>
                <div class="text-caption text-grey-7 q-mb-sm">
                  {{ periodo.desde }} → {{ periodo.hasta }}
                </div>
                <q-list separator dense>
                  <q-item v-for="d in periodo.detalle" :key="d.fecha">
                    <q-item-section avatar>
                      <q-icon
                        :name="d.esVacacion ? 'beach_access' : 'event_busy'"
                        :color="d.esVacacion ? 'cyan-7' : 'grey-5'"
                        size="xs"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label :class="d.esVacacion ? '' : 'text-grey'">
                        {{ formatFechaDisplay(d.fecha) }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-badge
                        :color="d.esVacacion ? 'cyan-7' : 'grey-5'"
                        text-color="white"
                        :label="d.esVacacion ? 'Vacaciones' : d.esFeriadoDia ? 'Feriado' : 'Libre'"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
              <q-separator v-if="idx < vac.periodos.length - 1" />
            </div>
          </q-card-section>
        </q-card>
      </template>

      <div v-if="!loadingVacaciones && vacacionesResumen.length === 0 && !errorVacaciones" class="text-grey text-center q-pa-lg">
        No se encontraron registros de vacaciones
      </div>
    </div>

    <!-- ==================== TAB FERIADOS ==================== -->
    <div v-show="activeTab === 'feriados'">
      <div class="row q-gutter-sm q-mb-md">
        <q-select
          v-model="feriadoAnio"
          :options="feriadoAnioOptions"
          label="Año"
          dense
          outlined
          emit-value
          map-options
          clearable
          style="min-width: 120px"
          @update:model-value="fetchFeriados"
        />
        <q-select
          v-model="feriadoEmpleado"
          :options="feriadoEmpleadoOptions"
          label="Empleado"
          dense
          outlined
          emit-value
          map-options
          clearable
          style="min-width: 200px"
          @update:model-value="fetchFeriados"
        />
      </div>

      <q-inner-loading :showing="loadingFeriados">
        <q-spinner-gears size="50px" color="primary" />
      </q-inner-loading>

      <q-banner v-if="errorFeriados" class="bg-negative text-white q-mb-md" rounded>
        <template #avatar><q-icon name="error" /></template>
        {{ errorFeriados }}
      </q-banner>

      <template v-if="!loadingFeriados && feriadosList.length > 0">
        <q-card class="q-mb-md">
          <q-card-section class="bg-orange-7 text-white">
            <div class="row items-center">
              <q-icon name="celebration" size="sm" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-bold">Feriados</div>
              <q-space />
              <q-badge color="white" text-color="orange-9" :label="feriadosList.length + ' registro(s)'" />
            </div>
          </q-card-section>
          <q-list separator>
            <q-item v-for="f in feriadosList" :key="f.id">
              <q-item-section avatar>
                <q-avatar color="orange-2" text-color="orange-9" size="36px">
                  {{ f.empleado.charAt(0).toUpperCase() }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ f.empleado }}</q-item-label>
                <q-item-label caption>{{ formatFechaDisplay(f.fecha) }} &mdash; {{ f.fecha }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge outline color="orange-8" :label="f.turno" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </template>

      <div v-if="!loadingFeriados && feriadosList.length === 0 && !errorFeriados" class="text-grey text-center q-pa-lg">
        No se encontraron feriados
      </div>
    </div>

    <!-- Dialog días de extras -->
    <q-dialog v-model="showDiasDialog" position="bottom">
      <q-card style="width: 100%; max-width: 500px">
        <q-card-section
          :class="selectedExtra?.tipo === 'nocturna' ? 'bg-blue-8 text-white' : 'bg-green-6 text-white'"
          class="row items-center"
        >
          <q-icon
            :name="selectedExtra?.tipo === 'nocturna' ? 'nights_stay' : 'brightness_6'"
            size="sm"
            class="q-mr-sm"
          />
          <div>
            <div class="text-subtitle1 text-weight-bold">{{ selectedExtra?.empleado }}</div>
            <div class="text-caption">
              {{ selectedExtra?.tipo === 'nocturna' ? 'Extras nocturnas (10pm/6am)' : 'Extras mixtas (2pm/10pm)' }}
            </div>
          </div>
          <q-space />
          <q-badge color="white"
            :text-color="selectedExtra?.tipo === 'nocturna' ? 'blue-8' : 'green-8'"
            :label="selectedExtra?.horas + 'h'"
          />
        </q-card-section>

        <q-card-section class="q-pa-none">
          <q-list separator>
            <q-item
              v-for="(fecha, i) in (selectedExtra?.fechas || []).slice().sort()"
              :key="fecha"
            >
              <q-item-section avatar>
                <q-avatar
                  size="32px"
                  :color="selectedExtra?.tipo === 'nocturna' ? 'blue-2' : 'green-2'"
                  :text-color="selectedExtra?.tipo === 'nocturna' ? 'blue-9' : 'green-9'"
                >
                  {{ i + 1 }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">{{ formatFechaDisplay(fecha) }}</q-item-label>
                <q-item-label caption>{{ fecha }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge
                  outline
                  :color="selectedExtra?.tipo === 'nocturna' ? 'blue-8' : 'green-8'"
                  :label="(selectedExtra?.tipo === 'nocturna' ? 2 : 1) + 'h'"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cerrar" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
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
    const turnosDiurno = ["6am/2pm", "7am/3pm", "6am/5pm", "8am/5pm"];
    const turnosPartida = ["7am/4pm", "8am/7pm", "8am/4pm", "11am/7pm", "07:00/16:00"];
    const turnosMixto = ["2pm/10pm", "3pm/10pm", "12md/10pm"];
    const turnosNocturno = ["10pm/6am", "10pm/4am"];

    const normalizar = (t) => (t || "").trim();

    const turnoDiurno = computed(() =>
      horarios.value.filter((h) => turnosDiurno.includes(normalizar(h.turno)))
    );
    const turnoPartida = computed(() =>
      horarios.value.filter((h) => turnosPartida.includes(normalizar(h.turno)))
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
          !turnosPartida.includes(t) &&
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
          map[key] = { empleado: h.empleado, tipo, dias: 0, horas: 0, fechas: [] };
        }
        map[key].dias++;
        map[key].horas += horasExtra;
        map[key].fechas.push(h.fecha);
      }
      return Object.values(map).sort((a, b) => a.empleado.localeCompare(b.empleado));
    });

    const extrasNocturnas = computed(() => extrasResumen.value.filter((e) => e.tipo === "nocturna"));
    const extrasMixtas = computed(() => extrasResumen.value.filter((e) => e.tipo === "mixta"));
    const totalExtrasNocturnas = computed(() => extrasNocturnas.value.reduce((s, e) => s + e.horas, 0));
    const totalExtrasMixtas = computed(() => extrasMixtas.value.reduce((s, e) => s + e.horas, 0));

    // --- Dialog de días extras ---
    const showDiasDialog = ref(false);
    const selectedExtra = ref(null);

    function openDiasDialog(emp) {
      selectedExtra.value = emp;
      showDiasDialog.value = true;
    }

    const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    function formatFechaDisplay(fechaStr) {
      // fechaStr = "YYYY-MM-DD"
      const [y, m, d] = fechaStr.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      const diaSem = diasSemana[date.getDay()];
      const mes = meses[m - 1];
      return `${diaSem} ${d}/${mes}`;
    }

    // --- Vacaciones state ---
    const loadingVacaciones = ref(false);
    const vacacionesRaw = ref([]);
    const errorVacaciones = ref("");
    const vacacionesAnio = ref(new Date().getFullYear());

    const vacacionesAnioOptions = computed(() => {
      const years = [...new Set(vacacionesRaw.value.map((r) => new Date(r.fecha).getFullYear()))].sort((a, b) => b - a);
      if (!years.includes(new Date().getFullYear())) {
        years.unshift(new Date().getFullYear());
      }
      return years.map((y) => ({ label: String(y), value: y }));
    });

    // Normalizar texto quitando tildes para comparar "vacaciones"
    function sinTildes(str) {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    function esVacaciones(turno) {
      return sinTildes((turno || "").trim().toLowerCase()).includes("vacaciones");
    }

    function esLibre(turno) {
      return (turno || "").trim().toUpperCase() === "L";
    }

    function esFeriado(turno) {
      return sinTildes((turno || "").trim().toLowerCase()).includes("feriado");
    }

    const vacacionesFiltradas = computed(() => {
      const anio = vacacionesAnio.value;
      return vacacionesRaw.value.filter((r) => new Date(r.fecha).getFullYear() === Number(anio));
    });

    const vacacionesResumen = computed(() => {
      const byEmpleado = {};
      for (const h of vacacionesFiltradas.value) {
        if (!byEmpleado[h.empleado]) byEmpleado[h.empleado] = [];
        byEmpleado[h.empleado].push(h);
      }

      const resultado = [];
      for (const [empleado, registros] of Object.entries(byEmpleado)) {
        registros.sort((a, b) => a.fecha.localeCompare(b.fecha));

        const periodos = [];
        let i = 0;
        while (i < registros.length) {
          if (!esVacaciones(registros[i].turno)) {
            i++;
            continue;
          }

          const rangoItems = [registros[i]];
          let j = i + 1;
          while (j < registros.length) {
            const prev = new Date(rangoItems[rangoItems.length - 1].fecha);
            const curr = new Date(registros[j].fecha);
            const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
            if (diffDays <= 2 && (esVacaciones(registros[j].turno) || esLibre(registros[j].turno) || esFeriado(registros[j].turno))) {
              rangoItems.push(registros[j]);
              j++;
            } else {
              break;
            }
          }

          const detalle = rangoItems.map((r) => ({
            fecha: r.fecha,
            turno: r.turno,
            esVacacion: esVacaciones(r.turno),
            esFeriadoDia: esFeriado(r.turno),
          }));

          periodos.push({
            desde: rangoItems[0].fecha,
            hasta: rangoItems[rangoItems.length - 1].fecha,
            diasVacaciones: detalle.filter((d) => d.esVacacion).length,
            detalle,
          });

          i = j;
        }

        if (periodos.length > 0) {
          resultado.push({
            empleado,
            periodos,
            totalDiasVacaciones: periodos.reduce((acc, p) => acc + p.diasVacaciones, 0),
          });
        }
      }

      return resultado.sort((a, b) => a.empleado.localeCompare(b.empleado));
    });

    async function fetchVacaciones() {
      loadingVacaciones.value = true;
      errorVacaciones.value = "";
      // Traer registros con turno "vacaciones", "L" o "feriado" (para detectar días dentro de rangos)
      const { data, error } = await supabase
        .from("horarios")
        .select("id, empleado, turno, fecha")
        .or("turno.ilike.%vacaciones%,turno.eq.L,turno.ilike.%feriado%")
        .order("empleado")
        .order("fecha");

      if (error) {
        errorVacaciones.value = error.message;
      } else {
        vacacionesRaw.value = data || [];
      }
      loadingVacaciones.value = false;
    }

    // --- Feriados state ---
    const loadingFeriados = ref(false);
    const feriadosList = ref([]);
    const feriadosAllEmpleados = ref([]);
    const errorFeriados = ref("");
    const feriadoAnio = ref(null);
    const feriadoEmpleado = ref(null);

    const currentYear = new Date().getFullYear();
    const feriadoAnioOptions = computed(() => {
      const years = [];
      for (let y = currentYear; y >= currentYear - 5; y--) {
        years.push({ label: String(y), value: y });
      }
      return years;
    });

    const feriadoEmpleadoOptions = computed(() =>
      feriadosAllEmpleados.value.map((e) => ({ label: e, value: e }))
    );

    async function fetchFeriados() {
      loadingFeriados.value = true;
      errorFeriados.value = "";

      let query = supabase
        .from("horarios")
        .select("id, empleado, turno, fecha")
        .or("turno.ilike.%feriado%,turno.ilike.%feriados%");

      if (feriadoAnio.value) {
        query = query
          .gte("fecha", `${feriadoAnio.value}-01-01`)
          .lte("fecha", `${feriadoAnio.value}-12-31`);
      }
      if (feriadoEmpleado.value) {
        query = query.eq("empleado", feriadoEmpleado.value);
      }

      query = query.order("fecha", { ascending: false }).limit(20);

      const { data, error } = await query;

      if (error) {
        errorFeriados.value = error.message;
      } else {
        feriadosList.value = data || [];
      }
      loadingFeriados.value = false;
    }

    async function fetchFeriadosEmpleados() {
      // Obtener lista única de empleados con feriados para el dropdown
      const { data } = await supabase
        .from("horarios")
        .select("empleado")
        .or("turno.ilike.%feriado%,turno.ilike.%feriados%");
      if (data) {
        const unique = [...new Set(data.map((d) => d.empleado))].sort();
        feriadosAllEmpleados.value = unique;
      }
    }

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
      if (tab === "vacaciones" && vacacionesRaw.value.length === 0 && !loadingVacaciones.value) {
        fetchVacaciones();
      }
      if (tab === "feriados" && feriadosList.value.length === 0 && !loadingFeriados.value) {
        fetchFeriados();
        fetchFeriadosEmpleados();
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
      turnoPartida,
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
      showDiasDialog,
      selectedExtra,
      openDiasDialog,
      formatFechaDisplay,
      // Vacaciones
      loadingVacaciones,
      errorVacaciones,
      vacacionesAnio,
      vacacionesAnioOptions,
      vacacionesResumen,
      // Feriados
      loadingFeriados,
      errorFeriados,
      feriadosList,
      feriadoAnio,
      feriadoEmpleado,
      feriadoAnioOptions,
      feriadoEmpleadoOptions,
      fetchFeriados,
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

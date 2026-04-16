<template>
  <q-page class="q-pa-md dashboard-horario">
    <div class="row items-center q-mb-md">
      <q-btn flat round icon="arrow_back" @click="$router.push('/config')" />
      <div class="text-h5 q-ml-sm">Dashboard Horario</div>
    </div>

    <!-- Tabs -->
    <q-tabs v-model="activeTab" dense class="text-primary q-mb-md" active-color="primary" indicator-color="primary" align="left" narrow-indicator>
      <q-tab name="horarios" label="Horarios" icon="schedule" />
      <q-tab name="extras" label="Extras" icon="more_time" />
      <q-tab v-if="isSuperAdmin" name="quincena" label="Quincena" icon="date_range" />
      <q-tab name="vacaciones" label="Vacaciones" icon="beach_access" />
      <q-tab name="feriados" label="Feriados" icon="celebration" />
    </q-tabs>

    <q-separator class="q-mb-md" />

    <!-- ==================== TAB HORARIOS ==================== -->
    <div v-show="activeTab === 'horarios'">
      <!-- Date picker -->
      <div v-if="!$q.screen.gt.md" class="row items-center q-mb-md q-gutter-sm">
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
        <!-- VISTA MÓVIL (Normal) -->
        <div v-if="!$q.screen.gt.md">
          <turno-cards
            :turno-diurno="turnoDiurno"
            :turno-partida="turnoPartida"
            :turno-mixto="turnoMixto"
            :turno-nocturno="turnoNocturno"
            :turno-otros="turnoOtros"
          />
        </div>

        <!-- VISTA PC (3 días en filas) -->
        <div v-else class="column q-gutter-y-xl container-pc-horarios">
          <div v-for="dia in horarios3Dias" :key="dia.fecha" class="day-row">
            <div class="row items-center q-mb-md">
              <q-icon name="event" color="primary" size="md" class="q-mr-sm" />
              <div class="text-h6 text-primary">{{ formatFechaLarga(dia.fecha) }}</div>
              <q-badge color="grey-3" text-color="grey-9" class="q-ml-md" label="3 turnos principales" />
            </div>
            
            <div class="row q-col-gutter-lg">
              <!-- Diurno -->
              <div class="col-12 col-sm-6 col-md-3">
                <q-card flat bordered class="full-height shadow-1">
                  <q-card-section class="bg-red-6 text-white q-py-sm">
                    <div class="row items-center">
                      <q-icon name="wb_sunny" size="sm" class="q-mr-sm" />
                      <div class="text-subtitle1 text-weight-bold">Diurno</div>
                      <q-space />
                      <q-badge color="white" text-color="red-8" :label="dia.diurno.length" />
                    </div>
                  </q-card-section>
                  <q-list separator class="q-py-xs">
                    <q-item v-for="emp in dia.diurno" :key="emp.id" class="q-px-md">
                      <q-item-section>
                        <q-item-label class="text-weight-medium">{{ emp.empleado }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-badge outline color="red-8" :label="emp.turno" class="text-bold" />
                      </q-item-section>
                    </q-item>
                    <q-item v-if="dia.diurno.length === 0">
                      <q-item-section class="text-grey text-caption text-center q-py-md">Sin personal</q-item-section>
                    </q-item>
                  </q-list>
                </q-card>
              </div>

              <!-- Partida -->
              <div class="col-12 col-sm-6 col-md-3">
                <q-card flat bordered class="full-height shadow-1">
                  <q-card-section class="bg-orange-7 text-white q-py-sm">
                    <div class="row items-center">
                      <q-icon name="schedule" size="sm" class="q-mr-sm" />
                      <div class="text-subtitle1 text-weight-bold">Partida</div>
                      <q-space />
                      <q-badge color="white" text-color="orange-9" :label="dia.partida.length" />
                    </div>
                  </q-card-section>
                  <q-list separator class="q-py-xs">
                    <q-item v-for="emp in dia.partida" :key="emp.id" class="q-px-md">
                      <q-item-section>
                        <q-item-label class="text-weight-medium">{{ emp.empleado }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-badge outline color="orange-8" :label="emp.turno" class="text-bold" />
                      </q-item-section>
                    </q-item>
                    <q-item v-if="dia.partida.length === 0">
                      <q-item-section class="text-grey text-caption text-center q-py-md">Sin personal</q-item-section>
                    </q-item>
                  </q-list>
                </q-card>
              </div>

              <!-- Mixto -->
              <div class="col-12 col-sm-6 col-md-3">
                <q-card flat bordered class="full-height shadow-1">
                  <q-card-section class="bg-green-6 text-white q-py-sm">
                    <div class="row items-center">
                      <q-icon name="brightness_6" size="sm" class="q-mr-sm" />
                      <div class="text-subtitle1 text-weight-bold">Mixto</div>
                      <q-space />
                      <q-badge color="white" text-color="green-8" :label="dia.mixto.length" />
                    </div>
                  </q-card-section>
                  <q-list separator class="q-py-xs">
                    <q-item v-for="emp in dia.mixto" :key="emp.id" class="q-px-md">
                      <q-item-section>
                        <q-item-label class="text-weight-medium">{{ emp.empleado }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-badge outline color="green-8" :label="emp.turno" class="text-bold" />
                      </q-item-section>
                    </q-item>
                    <q-item v-if="dia.mixto.length === 0">
                      <q-item-section class="text-grey text-caption text-center q-py-md">Sin personal</q-item-section>
                    </q-item>
                  </q-list>
                </q-card>
              </div>

              <!-- Nocturno -->
              <div class="col-12 col-sm-6 col-md-3">
                <q-card flat bordered class="full-height shadow-1">
                  <q-card-section class="bg-blue-8 text-white q-py-sm">
                    <div class="row items-center">
                      <q-icon name="nights_stay" size="sm" class="q-mr-sm" />
                      <div class="text-subtitle1 text-weight-bold">Nocturno</div>
                      <q-space />
                      <q-badge color="white" text-color="blue-8" :label="dia.nocturno.length" />
                    </div>
                  </q-card-section>
                  <q-list separator class="q-py-xs">
                    <q-item v-for="emp in dia.nocturno" :key="emp.id" class="q-px-md">
                      <q-item-section>
                        <q-item-label class="text-weight-medium">{{ emp.empleado }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-badge outline color="blue-8" :label="emp.turno" class="text-bold" />
                      </q-item-section>
                    </q-item>
                    <q-item v-if="dia.nocturno.length === 0">
                      <q-item-section class="text-grey text-caption text-center q-py-md">Sin personal</q-item-section>
                    </q-item>
                  </q-list>
                </q-card>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ... rest of the tabs ... -->


    <!-- ==================== TAB EXTRAS ==================== -->
    <div v-show="activeTab === 'extras'">

      <!-- Modo: quincena vs rango personalizado -->
      <div class="row q-mb-md">
        <q-btn-toggle
          v-model="extrasMode"
          toggle-color="primary"
          :options="[
            { label: 'Por quincena', value: 'quincena', icon: 'date_range' },
            { label: 'Rango personalizado', value: 'rango', icon: 'tune' }
          ]"
          dense
          unelevated
          rounded
          spread
        />
      </div>

      <!-- Modo quincena: selector -->
      <template v-if="extrasMode === 'quincena'">
        <q-select
          v-model="selectedPeriodo"
          :options="periodosOptions"
          label="Seleccionar Quincena"
          dense
          outlined
          emit-value
          map-options
          class="q-mb-sm"
          :loading="loadingPeriodos"
          @update:model-value="fetchExtrasByPeriodo"
        />
        <div v-if="selectedPeriodo" class="q-mb-md">
          <div class="text-caption text-grey-7">
            {{ selectedPeriodo.fecha_inicio }} al {{ selectedPeriodo.fecha_fin }}
          </div>
          <div v-if="selectedPeriodo.created_by" class="text-caption text-grey-6">
            <q-icon name="person" size="xs" /> Registrada por: <strong>{{ selectedPeriodo.created_by }}</strong>
          </div>
        </div>
      </template>

      <!-- Modo rango personalizado: date pickers -->
      <template v-else>
        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-6">
            <q-input v-model="rangoDesde" label="Desde" dense outlined readonly>
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy transition-show="scale" transition-hide="scale">
                    <q-date v-model="rangoDesde" mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Cerrar" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div class="col-6">
            <q-input v-model="rangoHasta" label="Hasta" dense outlined readonly>
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy transition-show="scale" transition-hide="scale">
                    <q-date v-model="rangoHasta" mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Cerrar" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </div>
        <div class="row justify-end q-mb-md">
          <q-btn color="primary" icon="search" label="Calcular" dense unelevated
            :disable="!rangoDesde || !rangoHasta"
            @click="fetchExtrasByRango" />
        </div>
      </template>

      <q-inner-loading :showing="loadingExtrasQuincena">
        <q-spinner-gears size="50px" color="primary" />
      </q-inner-loading>

      <q-banner v-if="errorExtrasQuincena" class="bg-negative text-white q-mb-md" rounded>
        <template #avatar><q-icon name="error" /></template>
        {{ errorExtrasQuincena }}
      </q-banner>

      <template v-if="!loadingExtrasQuincena && extrasResumenQuincena.length > 0">
        <!-- Extras Nocturnas -->
        <q-card class="q-mb-md">
          <q-card-section class="bg-blue-8 text-white">
            <div class="row items-center">
              <q-icon name="nights_stay" size="sm" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-bold">Horas Extra Nocturnas</div>
              <q-space />
              <q-badge color="white" text-color="blue-8" :label="totalNocturnasQuincena + 'h'" />
            </div>
          </q-card-section>
          <q-list separator>
            <q-item v-for="emp in extrasNocturnasQuincena" :key="emp.empleado" clickable v-ripple @click="openDiasDialog(emp)">
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
            <q-item v-if="extrasNocturnasQuincena.length === 0">
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
              <q-badge color="white" text-color="green-8" :label="totalMixtasQuincena + 'h'" />
            </div>
          </q-card-section>
          <q-list separator>
            <q-item v-for="emp in extrasMixtasQuincena" :key="emp.empleado" clickable v-ripple @click="openDiasDialog(emp)">
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
            <q-item v-if="extrasMixtasQuincena.length === 0">
              <q-item-section class="text-grey text-center">Sin horas extra mixtas</q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </template>

      <div v-if="!loadingExtrasQuincena && (extrasMode === 'quincena' ? selectedPeriodo : rangoDesde && rangoHasta) && extrasResumenQuincena.length === 0 && !errorExtrasQuincena" class="text-grey text-center q-pa-lg">
        No hay horas extra en este periodo
      </div>
      <div v-if="extrasMode === 'quincena' && !selectedPeriodo && !loadingPeriodos" class="text-grey text-center q-pa-lg">
        Selecciona una quincena para ver las horas extra
      </div>
    </div>

    <!-- ==================== TAB QUINCENA ==================== -->
    <div v-if="isSuperAdmin" v-show="activeTab === 'quincena'">

      <!-- Lista de quincenas existentes -->
      <div class="text-subtitle2 text-weight-bold q-mb-sm">Quincenas registradas</div>
      <q-list bordered separator class="q-mb-lg rounded-borders">
        <q-item v-for="p in periodos" :key="p.id">
          <q-item-section>
            <q-item-label>{{ p.nombre }}</q-item-label>
            <q-item-label caption>{{ p.fecha_inicio }} → {{ p.fecha_fin }}</q-item-label>
            <q-item-label v-if="p.created_by" caption class="text-grey-6">
              <q-icon name="person" size="xs" /> {{ p.created_by }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn flat round icon="edit" color="primary" size="sm" @click="openEditDialog(p)" />
          </q-item-section>
        </q-item>
        <q-item v-if="periodos.length === 0 && !loadingPeriodos">
          <q-item-section class="text-grey text-center">Sin quincenas registradas</q-item-section>
        </q-item>
        <q-item v-if="loadingPeriodos">
          <q-item-section class="text-center"><q-spinner-dots color="primary" /></q-item-section>
        </q-item>
      </q-list>

      <div class="text-subtitle2 text-weight-bold q-mb-sm">Crear quincena</div>
      <q-card flat bordered class="q-pa-md q-mb-md">
        <q-card-section class="q-pa-none q-mb-md">
          <div class="text-subtitle1 text-weight-bold">Crear quincena</div>
          <div class="text-caption text-grey-7">Define el nombre y el rango de fechas del periodo de pago.</div>
        </q-card-section>

        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-sm-6">
            <q-select
              v-model="periodoTipo"
              :options="tipoOptions"
              label="Tipo"
              dense
              outlined
              emit-value
              map-options
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-select
              v-model="periodoMes"
              :options="mesOptions"
              label="Mes"
              dense
              outlined
              emit-value
              map-options
            />
          </div>
        </div>

        <q-input
          v-model="nombrePeriodo"
          label="Nombre"
          dense
          outlined
          readonly
          class="q-mb-md"
        />

        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-sm-6">
            <q-input v-model="fechaInicio" label="Fecha inicio" dense outlined readonly>
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy transition-show="scale" transition-hide="scale">
                    <q-date v-model="fechaInicio" mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Cerrar" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6">
            <q-input v-model="fechaFin" label="Fecha fin" dense outlined readonly>
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy transition-show="scale" transition-hide="scale">
                    <q-date v-model="fechaFin" mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Cerrar" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </div>

        <div class="row justify-end">
          <q-btn
            color="primary"
            icon="save"
            label="Guardar quincena"
            :loading="savingPeriodo"
            :disable="!fechaInicio || !fechaFin"
            @click="guardarPeriodo"
          />
        </div>
      </q-card>
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

    <!-- Diálogo editar quincena -->
    <q-dialog v-model="showEditDialog" persistent>
      <q-card style="min-width: 320px; max-width: 95vw">
        <q-card-section class="bg-primary text-white">
          <div class="text-subtitle1 text-weight-bold">Editar quincena</div>
        </q-card-section>
        <q-card-section v-if="editingPeriodo" class="q-pt-md q-gutter-md">
          <q-input v-model="editingPeriodo.nombre" label="Nombre" dense outlined />
          <q-input v-model="editingPeriodo.fecha_inicio" label="Fecha inicio" dense outlined readonly>
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy transition-show="scale" transition-hide="scale">
                  <q-date v-model="editingPeriodo.fecha_inicio" mask="YYYY-MM-DD">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Cerrar" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <q-input v-model="editingPeriodo.fecha_fin" label="Fecha fin" dense outlined readonly>
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy transition-show="scale" transition-hide="scale">
                  <q-date v-model="editingPeriodo.fecha_fin" mask="YYYY-MM-DD">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Cerrar" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey" v-close-popup />
          <q-btn color="primary" icon="save" label="Guardar" :loading="savingEditPeriodo" @click="saveEditPeriodo" />
        </q-card-actions>
      </q-card>
    </q-dialog>

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
import { useQuasar } from "quasar";
import { supabase } from "../supabase";
import { useAuthStore } from "../stores/auth";

export default defineComponent({
  name: "DashboardHorarioPage",
  setup() {
    const $q = useQuasar();
    const authStore = useAuthStore();
    const isSuperAdmin = computed(() => authStore.user?.Rol === 'SuperAdmin');

    // --- Extras mode: quincena vs rango personalizado ---
    const extrasMode = ref('quincena');
    const rangoDesde = ref('');
    const rangoHasta = ref('');

    // --- Periodos de Pago (Creation Form) ---
    const currentYearForm = new Date().getFullYear();
    const tipoOptions = [
      { label: "Primera quincena de", value: "Primera quincena de" },
      { label: "Segunda quincena de", value: "Segunda quincena de" }
    ];
    const mesOptions = [
      { label: "Enero", value: "Enero" }, { label: "Febrero", value: "Febrero" },
      { label: "Marzo", value: "Marzo" }, { label: "Abril", value: "Abril" },
      { label: "Mayo", value: "Mayo" }, { label: "Junio", value: "Junio" },
      { label: "Julio", value: "Julio" }, { label: "Agosto", value: "Agosto" },
      { label: "Septiembre", value: "Septiembre" }, { label: "Octubre", value: "Octubre" },
      { label: "Noviembre", value: "Noviembre" }, { label: "Diciembre", value: "Diciembre" }
    ];
    const periodoTipo = ref("Primera quincena de");
    const periodoMes = ref(mesOptions[new Date().getMonth()].value);
    const fechaInicio = ref("");
    const fechaFin = ref("");
    const savingPeriodo = ref(false);

    const nombrePeriodo = computed(() => {
      if (!periodoTipo.value || !periodoMes.value) return "";
      return `${periodoTipo.value} ${periodoMes.value} ${currentYearForm}`;
    });

    async function guardarPeriodo() {
      if (!fechaInicio.value || !fechaFin.value) return;
      if (fechaInicio.value >= fechaFin.value) {
        $q.notify({ type: "warning", message: "La fecha de inicio debe ser anterior a la fecha de fin" });
        return;
      }
      savingPeriodo.value = true;
      const { error } = await supabase.from("periodos_pago").insert({
        nombre: nombrePeriodo.value,
        fecha_inicio: fechaInicio.value,
        fecha_fin: fechaFin.value,
        abierto: true,
        created_by: authStore.user?.Usuario || null,
      });
      savingPeriodo.value = false;
      if (error) {
        $q.notify({ type: "negative", message: `Error: ${error.message}` });
      } else {
        $q.notify({ type: "positive", message: "Periodo guardado correctamente", icon: "check" });
        fechaInicio.value = "";
        fechaFin.value = "";
        fetchPeriodos();
      }
    }

    const activeTab = ref("horarios");
    const loading = ref(false);
    const horarios = ref([]);
    const errorMsg = ref("");



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

    // --- Periodos de Pago ---
    const loadingPeriodos = ref(false);
    const periodos = ref([]);
    const selectedPeriodo = ref(null);
    const loadingExtrasQuincena = ref(false);
    const horariosQuincenaSelected = ref([]);
    const errorExtrasQuincena = ref("");

    const periodosOptions = computed(() =>
      periodos.value.map((p) => ({ label: p.nombre, value: p }))
    );

    const extrasResumenQuincena = computed(() => {
      const map = {};
      for (const h of horariosQuincenaSelected.value) {
        const t = normalizar(h.turno);
        let tipo = null;
        let horasExtra = 0;
        if (t === "10pm/6am") { tipo = "nocturna"; horasExtra = 2; }
        else if (t === "2pm/10pm") { tipo = "mixta"; horasExtra = 1; }
        if (!tipo) continue;
        const key = `${h.empleado}__${tipo}`;
        if (!map[key]) map[key] = { empleado: h.empleado, tipo, dias: 0, horas: 0, fechas: [] };
        map[key].dias++;
        map[key].horas += horasExtra;
        map[key].fechas.push(h.fecha);
      }
      return Object.values(map).sort((a, b) => a.empleado.localeCompare(b.empleado));
    });

    const extrasNocturnasQuincena = computed(() => extrasResumenQuincena.value.filter((e) => e.tipo === "nocturna"));
    const extrasMixtasQuincena = computed(() => extrasResumenQuincena.value.filter((e) => e.tipo === "mixta"));
    const totalNocturnasQuincena = computed(() => extrasNocturnasQuincena.value.reduce((s, e) => s + e.horas, 0));
    const totalMixtasQuincena = computed(() => extrasMixtasQuincena.value.reduce((s, e) => s + e.horas, 0));

    async function fetchPeriodos() {
      loadingPeriodos.value = true;
      const { data } = await supabase
        .from("periodos_pago")
        .select("id, nombre, fecha_inicio, fecha_fin, abierto, created_by")
        .order("fecha_inicio", { ascending: false })
        .limit(10);
      periodos.value = data || [];
      // Auto-seleccionar el periodo más reciente si no hay uno seleccionado
      if (periodos.value.length > 0 && !selectedPeriodo.value) {
        selectedPeriodo.value = periodos.value[0];
        fetchExtrasByPeriodo(periodos.value[0]);
      }
      loadingPeriodos.value = false;
    }

    // --- Editar quincena ---
    const showEditDialog = ref(false);
    const editingPeriodo = ref(null);
    const savingEditPeriodo = ref(false);

    function openEditDialog(periodo) {
      editingPeriodo.value = { ...periodo };
      showEditDialog.value = true;
    }

    async function saveEditPeriodo() {
      if (!editingPeriodo.value) return;
      if (!editingPeriodo.value.nombre || !editingPeriodo.value.fecha_inicio || !editingPeriodo.value.fecha_fin) {
        $q.notify({ type: 'warning', message: 'Completa todos los campos' });
        return;
      }
      savingEditPeriodo.value = true;
      const { error } = await supabase
        .from('periodos_pago')
        .update({
          nombre: editingPeriodo.value.nombre,
          fecha_inicio: editingPeriodo.value.fecha_inicio,
          fecha_fin: editingPeriodo.value.fecha_fin,
        })
        .eq('id', editingPeriodo.value.id);
      savingEditPeriodo.value = false;
      if (error) {
        $q.notify({ type: 'negative', message: `Error: ${error.message}` });
      } else {
        $q.notify({ type: 'positive', message: 'Quincena actualizada', icon: 'check' });
        showEditDialog.value = false;
        // Refrescar lista
        const saved = selectedPeriodo.value?.id;
        await fetchPeriodos();
        // Si el periodo editado estaba seleccionado, actualizar la selección
        if (saved === editingPeriodo.value.id) {
          const updated = periodos.value.find(p => p.id === saved);
          if (updated) {
            selectedPeriodo.value = updated;
            fetchExtrasByPeriodo(updated);
          }
        }
      }
    }

    // --- Fetch extras por rango personalizado ---
    async function fetchExtrasByRango() {
      if (!rangoDesde.value || !rangoHasta.value) return;
      loadingExtrasQuincena.value = true;
      errorExtrasQuincena.value = '';
      const { data, error } = await supabase
        .from('horarios')
        .select('id, empleado, turno, fecha')
        .gte('fecha', rangoDesde.value)
        .lte('fecha', rangoHasta.value)
        .in('turno', ['10pm/6am', '2pm/10pm'])
        .order('empleado');
      if (error) {
        errorExtrasQuincena.value = error.message;
      } else {
        horariosQuincenaSelected.value = data || [];
      }
      loadingExtrasQuincena.value = false;
    }

    async function fetchExtrasByPeriodo(periodo) {
      if (!periodo) return;
      loadingExtrasQuincena.value = true;
      errorExtrasQuincena.value = "";
      const { data, error } = await supabase
        .from("horarios")
        .select("id, empleado, turno, fecha")
        .gte("fecha", periodo.fecha_inicio)
        .lte("fecha", periodo.fecha_fin)
        .in("turno", ["10pm/6am", "2pm/10pm"])
        .order("empleado");
      if (error) {
        errorExtrasQuincena.value = error.message;
      } else {
        horariosQuincenaSelected.value = data || [];
      }
      loadingExtrasQuincena.value = false;
    }



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

      try {
        if ($q.screen.gt.md) {
          // Obtener fechas: hoy, mañana y pasado mañana
          const hoy = new Date();
          const fechas = [];
          for (let i = 0; i < 3; i++) {
            const d = new Date(hoy);
            d.setDate(hoy.getDate() + i);
            fechas.push(formatDate(d));
          }

          const { data, error } = await supabase
            .from("horarios")
            .select("id, empleado, turno, fecha")
            .in("fecha", fechas)
            .order("fecha")
            .order("empleado");

          if (error) throw error;
          horarios.value = data || [];
        } else {
          const { data, error } = await supabase
            .from("horarios")
            .select("id, empleado, turno, fecha")
            .eq("fecha", selectedDate.value)
            .order("empleado");

          if (error) throw error;
          horarios.value = data || [];
        }
      } catch (err) {
        errorMsg.value = err.message;
      } finally {
        loading.value = false;
      }
    }

    const horarios3Dias = computed(() => {
      if (!$q.screen.gt.md) return [];
      
      const hoy = new Date();
      const dias = [];
      for (let i = 0; i < 3; i++) {
        const d = new Date(hoy);
        d.setDate(hoy.getDate() + i);
        const f = formatDate(d);
        const diaData = horarios.value.filter(h => h.fecha === f);
        
        dias.push({
          fecha: f,
          diurno: diaData.filter(h => turnosDiurno.includes(normalizar(h.turno))),
          partida: diaData.filter(h => turnosPartida.includes(normalizar(h.turno))),
          mixto: diaData.filter(h => turnosMixto.includes(normalizar(h.turno))),
          nocturno: diaData.filter(h => turnosNocturno.includes(normalizar(h.turno))),
          otros: diaData.filter(h => {
            const t = normalizar(h.turno);
            return !turnosDiurno.includes(t) && !turnosPartida.includes(t) && !turnosMixto.includes(t) && !turnosNocturno.includes(t);
          })
        });
      }
      return dias;
    });

    function formatFechaLarga(fechaStr) {
      if (!fechaStr) return "";
      const [y, m, d] = fechaStr.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
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
      if (tab === "extras") {
        if (periodos.value.length === 0 && !loadingPeriodos.value) {
          fetchPeriodos(); // también auto-selecciona el primero
        } else if (periodos.value.length > 0 && !selectedPeriodo.value) {
          selectedPeriodo.value = periodos.value[0];
          fetchExtrasByPeriodo(periodos.value[0]);
        }
      }
      if (tab === "quincena" && periodos.value.length === 0 && !loadingPeriodos.value) {
        fetchPeriodos();
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
      tipoOptions,
      mesOptions,
      periodoTipo,
      periodoMes,
      fechaInicio,
      fechaFin,
      savingPeriodo,
      nombrePeriodo,
      guardarPeriodo,
      loading,
      selectedDate,
      errorMsg,
      turnoDiurno,
      turnoPartida,
      turnoMixto,
      turnoNocturno,
      turnoOtros,
      fetchHorarios,
      horarios3Dias,
      formatFechaLarga,
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
      // Permisos
      isSuperAdmin,
      // Periodos de Pago
      periodos,
      loadingPeriodos,
      periodosOptions,
      selectedPeriodo,
      loadingExtrasQuincena,
      errorExtrasQuincena,
      extrasResumenQuincena,
      extrasNocturnasQuincena,
      extrasMixtasQuincena,
      totalNocturnasQuincena,
      totalMixtasQuincena,
      fetchExtrasByPeriodo,
      // Extras mode
      extrasMode,
      rangoDesde,
      rangoHasta,
      fetchExtrasByRango,
      // Editar quincena
      showEditDialog,
      editingPeriodo,
      savingEditPeriodo,
      openEditDialog,
      saveEditPeriodo,
    };
  },
});
</script>

<style scoped>
.dashboard-horario {
  max-width: 700px;
  margin: 0 auto;
}

@media (min-width: 1024px) {
  .dashboard-horario {
    max-width: 1200px;
  }

  /* Hacer las columnas de los turnos más anchas horizontalmente */
  .container-pc-horarios .col-12.col-sm-6.col-md-3 {
    flex: 0 0 24%;
    max-width: 24%;
  }

  /* Asegurar que las tarjetas tengan un ancho mínimo para que el contenido no quede apretado */
  .container-pc-horarios q-card {
    min-width: 260px;
  }
}
</style>

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
      <q-card flat bordered class="schedule-view-selector q-mb-md">
        <q-card-section class="row items-center q-col-gutter-md q-py-sm">
          <div class="col-12 col-sm">
            <div class="text-subtitle2 text-weight-bold">¿Qué horario deseas consultar?</div>
            <div class="text-caption text-grey-7">Elige una fecha o revisa la agenda completa desde hoy.</div>
          </div>
          <div class="col-12 col-sm-auto">
            <q-btn-toggle
              v-model="scheduleView"
              :options="[
                { label: 'Vista habitual', value: 'habitual', icon: 'today' },
                { label: 'Próximos 15 días', value: 'proximos15', icon: 'view_agenda' }
              ]"
              color="white"
              text-color="grey-8"
              toggle-color="primary"
              toggle-text-color="white"
              unelevated
              spread
              class="schedule-view-toggle"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Date picker and quick selector -->
      <div v-if="scheduleView === 'habitual' && !$q.screen.gt.md" class="column q-mb-md q-gutter-y-sm">
        <div class="row items-center q-gutter-sm">
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

        <div class="row q-gutter-xs no-wrap q-pb-xs date-selector-scroll">
          <q-btn
            v-for="day in next9Days"
            :key="day.fecha"
            padding="xs sm"
            :color="selectedDate === day.fecha ? 'primary' : 'grey-2'"
            :text-color="selectedDate === day.fecha ? 'white' : 'grey-9'"
            unelevated
            class="text-bold"
            @click="selectQuickDate(day.fecha)"
          >
            <div class="column items-center">
              <span class="text-caption" style="font-size: 0.65rem; line-height: 1">{{ day.labelDia }}</span>
              <span class="text-subtitle1">{{ day.labelNum }}</span>
            </div>
          </q-btn>
        </div>
      </div>

      <q-inner-loading :showing="loading">
        <q-spinner-gears size="50px" color="primary" />
      </q-inner-loading>

      <q-banner v-if="errorMsg" class="bg-negative text-white q-mb-md" rounded>
        <template #avatar><q-icon name="error" /></template>
        {{ errorMsg }}
      </q-banner>

      <template v-if="!loading">
        <template v-if="scheduleView === 'habitual'">
        <!-- Mi horario (usuario en sesión) -->
        <div v-if="currentUserName" class="q-mb-md">
          <q-card flat bordered class="my-schedule-card">
            <q-card-section class="row items-center bg-primary text-white q-py-sm">
              <q-icon name="person" size="sm" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-bold">Mi horario</div>
              <q-space />
              <q-badge color="white" text-color="primary" :label="empleadoDelUsuario || currentUserName" />
            </q-card-section>
            <q-list separator class="q-py-none">
              <template v-if="currentUserScheduleHasTurno">
                <q-item
                  v-for="(item, index) in currentUserSchedule"
                  :key="item.id || item.fecha || index"
                  class="q-px-md"
                  :class="{ 'my-schedule-card__item--today': item.esHoy }"
                >
                  <q-item-section v-if="item.fechaLabel">
                    <q-item-label class="text-caption text-grey-7 text-capitalize">{{ item.fechaLabel }}</q-item-label>
                    <q-item-label v-if="item.esHoy" class="text-primary text-weight-bold text-caption">Hoy</q-item-label>
                  </q-item-section>
                  <q-item-section v-else>
                    <q-item-label class="text-weight-medium">{{ item.empleado }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge
                      v-if="!item.sinHorario"
                      outline
                      :color="getTurnoBadgeColor(item.turno)"
                      :label="item.turno"
                      class="text-bold"
                    />
                    <span v-else class="text-grey-6 text-caption">Sin horario</span>
                  </q-item-section>
                </q-item>
              </template>
              <q-item v-else>
                <q-item-section class="text-grey text-caption text-center q-py-md">
                  Sin horario registrado para esta fecha
                </q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </div>

        <!-- VISTA MÓVIL (Normal) -->
        <div v-if="!$q.screen.gt.md">
          <div class="q-mb-md">
            <q-card flat bordered>
              <q-card-section class="row items-center justify-between bg-red-6 text-white q-py-sm">
                <div class="text-subtitle1 text-weight-bold">Diurno</div>
                <q-badge color="white" text-color="red-8" :label="turnoDiurno.length" />
              </q-card-section>
              <q-list separator class="q-py-none">
                <q-item v-for="emp in turnoDiurno" :key="emp.id" class="q-px-md">
                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ emp.empleado }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge outline color="red-8" :label="emp.turno" class="text-bold" />
                  </q-item-section>
                </q-item>
                <q-item v-if="turnoDiurno.length === 0">
                  <q-item-section class="text-grey text-caption text-center q-py-md">Sin personal</q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>

          <div class="q-mb-md">
            <q-card flat bordered>
              <q-card-section class="row items-center justify-between bg-orange-7 text-white q-py-sm">
                <div class="text-subtitle1 text-weight-bold">Partida</div>
                <q-badge color="white" text-color="orange-9" :label="turnoPartida.length" />
              </q-card-section>
              <q-list separator class="q-py-none">
                <q-item v-for="emp in turnoPartida" :key="emp.id" class="q-px-md">
                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ emp.empleado }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge outline color="orange-8" :label="emp.turno" class="text-bold" />
                  </q-item-section>
                </q-item>
                <q-item v-if="turnoPartida.length === 0">
                  <q-item-section class="text-grey text-caption text-center q-py-md">Sin personal</q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>

          <div class="q-mb-md">
            <q-card flat bordered>
              <q-card-section class="row items-center justify-between bg-green-6 text-white q-py-sm">
                <div class="text-subtitle1 text-weight-bold">Mixto</div>
                <q-badge color="white" text-color="green-8" :label="turnoMixto.length" />
              </q-card-section>
              <q-list separator class="q-py-none">
                <q-item v-for="emp in turnoMixto" :key="emp.id" class="q-px-md">
                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ emp.empleado }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge outline color="green-8" :label="emp.turno" class="text-bold" />
                  </q-item-section>
                </q-item>
                <q-item v-if="turnoMixto.length === 0">
                  <q-item-section class="text-grey text-caption text-center q-py-md">Sin personal</q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>

          <div class="q-mb-md">
            <q-card flat bordered>
              <q-card-section class="row items-center justify-between bg-blue-8 text-white q-py-sm">
                <div class="text-subtitle1 text-weight-bold">Nocturno</div>
                <q-badge color="white" text-color="blue-8" :label="turnoNocturno.length" />
              </q-card-section>
              <q-list separator class="q-py-none">
                <q-item v-for="emp in turnoNocturno" :key="emp.id" class="q-px-md">
                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ emp.empleado }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge outline color="blue-8" :label="emp.turno" class="text-bold" />
                  </q-item-section>
                </q-item>
                <q-item v-if="turnoNocturno.length === 0">
                  <q-item-section class="text-grey text-caption text-center q-py-md">Sin personal</q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>

          <div class="q-mb-md">
            <q-card flat bordered>
              <q-card-section class="row items-center justify-between bg-yellow-6 text-black q-py-sm">
                <div class="text-subtitle1 text-weight-bold">Otros</div>
                <q-badge color="white" text-color="yellow-10" :label="turnoOtros.length" />
              </q-card-section>
              <q-list separator class="q-py-none">
                <q-item v-for="emp in turnoOtros" :key="emp.id" class="q-px-md">
                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ emp.empleado }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge outline color="yellow-9" :label="emp.turno" class="text-bold" />
                  </q-item-section>
                </q-item>
                <q-item v-if="turnoOtros.length === 0">
                  <q-item-section class="text-grey text-caption text-center q-py-md">Sin personal</q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>
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

        <!-- VISTA DE LOS PRÓXIMOS 15 DÍAS -->
        <section v-else class="schedule-fortnight" aria-labelledby="schedule-fortnight-title">
          <div class="schedule-fortnight__header q-mb-md">
            <div>
              <div id="schedule-fortnight-title" class="text-h6 text-weight-bold">Próximos 15 días</div>
              <div class="text-body2 text-grey-7">
                {{ formatFechaRango(horarios15Dias[0]?.fecha) }} al
                {{ formatFechaRango(horarios15Dias[horarios15Dias.length - 1]?.fecha) }}
              </div>
            </div>
            <q-badge color="primary" rounded class="q-px-sm q-py-xs">15 días</q-badge>
          </div>

          <q-card flat bordered class="schedule-user-filter q-mb-md">
            <q-card-section class="row items-center q-col-gutter-sm q-py-sm">
              <div class="col-12 col-sm">
                <q-select
                  v-model="scheduleUserFilter"
                  :options="scheduleUserOptions"
                  label="Filtrar por usuario"
                  aria-label="Filtrar horario por usuario"
                  outlined
                  dense
                  clearable
                  options-dense
                >
                  <template #prepend>
                    <q-icon name="person_search" color="primary" />
                  </template>
                </q-select>
              </div>
              <div v-if="scheduleUserFilter" class="col-12 col-sm-auto">
                <q-btn
                  flat
                  no-caps
                  color="primary"
                  icon="group"
                  label="Ver todos"
                  @click="scheduleUserFilter = null"
                />
              </div>
            </q-card-section>
            <q-separator v-if="scheduleUserFilter" />
            <q-card-section v-if="scheduleUserFilter" class="schedule-user-filter__active q-py-xs text-caption">
              Mostrando únicamente el horario de <strong>{{ scheduleUserFilter }}</strong>
            </q-card-section>
          </q-card>

          <div class="row q-col-gutter-md q-row-gutter-md">
            <div
              v-for="dia in horarios15Dias"
              :key="dia.fecha"
              class="col-12 col-sm-6 col-lg-4"
            >
              <q-card
                flat
                bordered
                class="schedule-day-card full-height"
                :class="[
                  { 'schedule-day-card--today': dia.esHoy },
                  dia.estado ? 'schedule-day-card--filtered' : '',
                  dia.estado ? `schedule-day-card--status-${dia.estado.key}` : ''
                ]"
              >
                <q-card-section class="schedule-day-card__header q-py-sm">
                  <div class="row items-center no-wrap">
                    <div class="schedule-day-card__date">
                      <div class="text-subtitle1 text-weight-bold text-capitalize">{{ formatFechaLarga(dia.fecha) }}</div>
                      <div class="row items-center q-gutter-xs q-mt-xs">
                        <span v-if="dia.esHoy" class="text-caption text-primary text-weight-bold">Hoy</span>
                        <span v-else-if="dia.esManana" class="text-caption text-grey-7 text-weight-medium">Mañana</span>
                        <q-badge v-if="dia.estado" :color="dia.estado.color" rounded class="schedule-status-badge">
                          <q-icon :name="dia.estado.icon" size="13px" class="q-mr-xs" />
                          {{ dia.estado.label }}
                        </q-badge>
                      </div>
                    </div>
                    <q-space />
                    <q-badge
                      :color="dia.estado ? dia.estado.color : (dia.total ? 'primary' : 'grey-4')"
                      :text-color="dia.total ? 'white' : 'grey-8'"
                      rounded
                      :label="scheduleUserFilter
                        ? `${dia.total} ${dia.total === 1 ? 'turno' : 'turnos'}`
                        : `${dia.total} ${dia.total === 1 ? 'persona' : 'personas'}`"
                    />
                  </div>
                </q-card-section>

                <q-separator />

                <q-card-section v-if="dia.total === 0" class="column items-center justify-center schedule-day-card__empty">
                  <q-icon name="event_busy" size="28px" color="grey-5" />
                  <div class="text-body2 text-grey-6 q-mt-xs text-center">
                    {{ scheduleUserFilter ? `Sin horario para ${scheduleUserFilter}` : 'Sin horarios registrados' }}
                  </div>
                </q-card-section>

                <q-list v-else separator class="schedule-day-card__list">
                  <template v-for="grupo in dia.grupos" :key="grupo.key">
                    <q-item-label v-if="grupo.personas.length" header class="schedule-shift-header">
                      <q-icon
                        :name="dia.estado?.icon || grupo.icon"
                        :color="dia.estado?.color || grupo.color"
                        size="16px"
                        class="q-mr-xs"
                      />
                      {{ dia.estado?.label || grupo.label }}
                      <span class="text-grey-6">· {{ grupo.personas.length }}</span>
                    </q-item-label>
                    <q-item v-for="emp in grupo.personas" :key="emp.id" dense class="q-px-md">
                      <q-item-section>
                        <q-item-label class="text-weight-medium">{{ emp.empleado }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-badge outline :color="dia.estado?.color || grupo.color" :label="emp.turno" />
                      </q-item-section>
                    </q-item>
                  </template>
                </q-list>
              </q-card>
            </div>
          </div>
        </section>
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
    <div v-show="activeTab === 'vacaciones'" class="vacaciones-ios">
      <header class="vacaciones-hero">
        <div class="vacaciones-hero__copy">
          <div class="vacaciones-hero__eyebrow">
            <q-icon name="calendar_month" size="16px" />
            <span>Tiempo libre</span>
          </div>
          <h2 class="vacaciones-hero__title">Vacaciones</h2>
          <p class="vacaciones-hero__subtitle">Consulta los descansos programados del equipo.</p>
        </div>

        <q-select
          v-model="vacacionesAnio"
          :options="vacacionesAnioOptions"
          aria-label="Año de vacaciones"
          borderless
          dense
          options-dense
          emit-value
          map-options
          behavior="menu"
          hide-bottom-space
          class="vacaciones-year"
        >
          <template #prepend>
            <q-icon name="event" size="18px" />
          </template>
        </q-select>
      </header>

      <div class="vacaciones-content">
        <q-inner-loading :showing="loadingVacaciones" class="vacaciones-loading">
          <q-spinner-ios size="42px" color="primary" />
        </q-inner-loading>

        <q-banner v-if="errorVacaciones" class="vacaciones-error q-mb-md" rounded>
          <template #avatar><q-icon name="error" /></template>
          {{ errorVacaciones }}
        </q-banner>

        <div v-if="!loadingVacaciones && vacacionesResumen.length > 0" class="vacaciones-personas">
          <section v-for="vac in vacacionesResumen" :key="vac.empleado" class="vacaciones-persona">
            <header class="vacaciones-persona__header">
              <q-avatar class="vacaciones-persona__avatar" size="48px">
                {{ vac.empleado.charAt(0).toUpperCase() }}
              </q-avatar>

              <div class="vacaciones-persona__identity">
                <div class="vacaciones-persona__name">{{ vac.empleado }}</div>
                <div class="vacaciones-persona__meta">
                  {{ vac.periodos.length }} período{{ vac.periodos.length === 1 ? '' : 's' }} · {{ vacacionesAnio }}
                </div>
              </div>

              <div class="vacaciones-persona__total" :aria-label="vac.totalDiasVacaciones + ' días de vacaciones'">
                <strong>{{ vac.totalDiasVacaciones }}</strong>
                <span>días</span>
              </div>
            </header>

            <div class="vacaciones-periodos">
              <article
                v-for="(periodo, idx) in vac.periodos"
                :key="periodo.desde + periodo.hasta"
                class="vacaciones-periodo"
                :aria-label="'Período ' + (idx + 1) + ', ' + periodo.diasVacaciones + ' días de vacaciones'"
              >
                <div class="vacaciones-periodo__header">
                  <div class="vacaciones-periodo__icon">
                    <q-icon name="flight_takeoff" size="21px" />
                  </div>
                  <div class="vacaciones-periodo__heading">
                    <div class="vacaciones-periodo__name">Período {{ idx + 1 }}</div>
                    <div class="vacaciones-periodo__range">
                      {{ formatFechaDisplay(periodo.desde) }} – {{ formatFechaDisplay(periodo.hasta) }}
                    </div>
                  </div>
                  <div class="vacaciones-periodo__count">{{ periodo.diasVacaciones }} d</div>
                </div>

                <div class="vacaciones-dias">
                  <div
                    v-for="d in periodo.detalle"
                    :key="d.fecha"
                    class="vacaciones-dia"
                    :class="{
                      'vacaciones-dia--vacacion': d.esVacacion,
                      'vacaciones-dia--feriado': d.esFeriadoDia,
                      'vacaciones-dia--libre': !d.esVacacion && !d.esFeriadoDia,
                    }"
                  >
                    <div class="vacaciones-dia__icon">
                      <q-icon :name="d.esVacacion ? 'beach_access' : d.esFeriadoDia ? 'celebration' : 'weekend'" size="17px" />
                    </div>
                    <span class="vacaciones-dia__fecha">{{ formatFechaDisplay(d.fecha) }}</span>
                    <span class="vacaciones-dia__tipo">{{ d.esVacacion ? 'Vacaciones' : d.esFeriadoDia ? 'Feriado' : 'Libre' }}</span>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>

        <div v-if="!loadingVacaciones && vacacionesResumen.length === 0 && !errorVacaciones" class="vacaciones-vacio">
          <div class="vacaciones-vacio__icon"><q-icon name="beach_access" size="32px" /></div>
          <div class="vacaciones-vacio__title">Sin vacaciones programadas</div>
          <div class="vacaciones-vacio__text">No hay períodos registrados para {{ vacacionesAnio }}.</div>
        </div>
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
import { notify } from '../utils/notify'
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
        notify({ type: "warning", message: "La fecha de inicio debe ser anterior a la fecha de fin" });
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
        notify({ type: "negative", message: `Error: ${error.message}` });
      } else {
        notify({ type: "positive", message: "Periodo guardado correctamente", icon: "check" });
        fechaInicio.value = "";
        fechaFin.value = "";
        fetchPeriodos();
      }
    }

    const activeTab = ref("horarios");
    const scheduleView = ref("habitual");
    const scheduleUserStorageKey = "dashboard-horario-user-filter";
    const storedScheduleUser = (() => {
      try {
        return window.localStorage.getItem(scheduleUserStorageKey);
      } catch {
        return null;
      }
    })();
    const scheduleUserFilter = ref(storedScheduleUser || authStore.user?.Usuario || null);
    const loading = ref(false);
    const horarios = ref([]);
    const errorMsg = ref("");



    function getLocalDateString() {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    const selectedDate = ref(getLocalDateString());

    const next9Days = computed(() => {
      const days = [];
      const base = new Date();
      for (let i = 0; i < 9; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        const fecha = formatDate(d);
        const labelNum = String(d.getDate()).padStart(2, '0');
        const labelDia = diasSemana[d.getDay()];
        days.push({ fecha, labelNum, labelDia });
      }
      return days;
    });

    function selectQuickDate(fecha) {
      selectedDate.value = fecha;
      fetchHorarios();
    }

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
    const turnosMixto = ["2pm/10pm", "2pm/9pm", "3pm/10pm", "12md/10pm"];
    const turnosNocturno = ["10pm/6am", "10pm/4am", "06pm/00mn", "6pm/00mn", "00mn/06am", "00mn/6am"];

    const normalizar = (t) => (t || "").trim();

    function sinTildes(str) {
      return (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    function normalizarNombre(n) {
      return sinTildes((n || "").trim().toLowerCase());
    }

    function nombresCoinciden(empleado, usuario) {
      const emp = normalizarNombre(empleado);
      const usr = normalizarNombre(usuario);
      if (!emp || !usr) return false;
      if (emp === usr) return true;
      if (emp.includes(usr) || usr.includes(emp)) return true;

      const empFirst = emp.split(/\s+/).filter(Boolean)[0] || "";
      const usrFirst = usr.split(/\s+/).filter(Boolean)[0] || "";
      return empFirst.length >= 3 && usrFirst.length >= 3 && empFirst === usrFirst;
    }

    const currentUserName = computed(() => authStore.user?.Usuario || null);

    const empleadosEnHorarios = computed(() =>
      [...new Set(horarios.value.map((h) => h.empleado).filter(Boolean))]
    );

    const empleadoDelUsuario = computed(() => {
      if (!currentUserName.value) return null;

      const exacto = empleadosEnHorarios.value.find(
        (empleado) => normalizarNombre(empleado) === normalizarNombre(currentUserName.value)
      );
      if (exacto) return exacto;

      return empleadosEnHorarios.value.find((empleado) =>
        nombresCoinciden(empleado, currentUserName.value)
      ) || null;
    });

    function esUsuarioActual(empleado) {
      if (!currentUserName.value || !empleado) return false;
      if (empleadoDelUsuario.value) {
        return normalizarNombre(empleado) === normalizarNombre(empleadoDelUsuario.value);
      }
      return nombresCoinciden(empleado, currentUserName.value);
    }

    function coincideConFiltro(empleado, filtro) {
      if (!filtro) return true;
      if (!empleado) return false;
      return (
        normalizarNombre(empleado) === normalizarNombre(filtro) ||
        nombresCoinciden(empleado, filtro)
      );
    }

    function sortUserFirst(list) {
      if (!currentUserName.value) return list;
      return [...list].sort((a, b) => {
        const aMatch = esUsuarioActual(a.empleado) ? 0 : 1;
        const bMatch = esUsuarioActual(b.empleado) ? 0 : 1;
        if (aMatch !== bMatch) return aMatch - bMatch;
        return (a.empleado || "").localeCompare(b.empleado || "", "es", { sensitivity: "base" });
      });
    }

    function getTurnoBadgeColor(turno) {
      const t = normalizar(turno);
      if (turnosDiurno.includes(t)) return "red-8";
      if (turnosPartida.includes(t)) return "orange-8";
      if (turnosMixto.includes(t)) return "green-8";
      if (turnosNocturno.includes(t)) return "blue-8";
      return "amber-9";
    }

    const currentUserSchedule = computed(() => {
      if (!currentUserName.value) return [];

      if ($q.screen.gt.md) {
        const hoy = new Date();
        return Array.from({ length: 3 }, (_, index) => {
          const d = new Date(hoy);
          d.setDate(hoy.getDate() + index);
          const fecha = formatDate(d);
          const registro = horarios.value.find((h) => h.fecha === fecha && esUsuarioActual(h.empleado));

          return registro
            ? { ...registro, fechaLabel: formatFechaLarga(fecha), esHoy: index === 0 }
            : { fecha, fechaLabel: formatFechaLarga(fecha), esHoy: index === 0, sinHorario: true };
        });
      }

      return horarios.value.filter((h) => esUsuarioActual(h.empleado));
    });

    const currentUserScheduleHasTurno = computed(() =>
      currentUserSchedule.value.some((item) => !item.sinHorario)
    );

    const turnoDiurno = computed(() =>
      sortUserFirst(horarios.value.filter((h) => turnosDiurno.includes(normalizar(h.turno))))
    );
    const turnoPartida = computed(() =>
      sortUserFirst(horarios.value.filter((h) => turnosPartida.includes(normalizar(h.turno))))
    );
    const turnoMixto = computed(() =>
      sortUserFirst(horarios.value.filter((h) => turnosMixto.includes(normalizar(h.turno))))
    );
    const turnoNocturno = computed(() =>
      sortUserFirst(horarios.value.filter((h) => turnosNocturno.includes(normalizar(h.turno))))
    );
    const turnoOtros = computed(() =>
      sortUserFirst(horarios.value.filter((h) => {
        const t = normalizar(h.turno);
        return (
          !turnosDiurno.includes(t) &&
          !turnosPartida.includes(t) &&
          !turnosMixto.includes(t) &&
          !turnosNocturno.includes(t)
        );
      }))
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
        notify({ type: 'warning', message: 'Completa todos los campos' });
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
        notify({ type: 'negative', message: `Error: ${error.message}` });
      } else {
        notify({ type: 'positive', message: 'Quincena actualizada', icon: 'check' });
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
        if (scheduleView.value === "proximos15") {
          const desde = new Date();
          const hasta = new Date(desde);
          hasta.setDate(desde.getDate() + 14);

          const { data, error } = await supabase
            .from("horarios")
            .select("id, empleado, turno, fecha")
            .gte("fecha", formatDate(desde))
            .lte("fecha", formatDate(hasta))
            .order("fecha")
            .order("empleado");

          if (error) throw error;
          horarios.value = data || [];
        } else if ($q.screen.gt.md) {
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

    const gruposTurno = [
      { key: "diurno", label: "Diurno", icon: "wb_sunny", color: "red-7", turnos: turnosDiurno },
      { key: "partida", label: "Partida", icon: "schedule", color: "orange-8", turnos: turnosPartida },
      { key: "mixto", label: "Mixto", icon: "brightness_6", color: "green-7", turnos: turnosMixto },
      { key: "nocturno", label: "Nocturno", icon: "nights_stay", color: "blue-8", turnos: turnosNocturno },
      { key: "otros", label: "Otros", icon: "more_horiz", color: "amber-9", turnos: [] },
    ];

    function grupoDeTurno(turno) {
      const turnoNormalizado = normalizar(turno);
      return gruposTurno.find((grupo) => grupo.turnos.includes(turnoNormalizado)) || gruposTurno[4];
    }

    const estadosEspeciales = {
      libre: { key: "libre", label: "Libre", icon: "weekend", color: "amber-9" },
      feriado: { key: "feriado", label: "Feriado", icon: "celebration", color: "purple-7" },
      vacaciones: { key: "vacaciones", label: "Vacaciones", icon: "beach_access", color: "teal-7" },
      ausencia: { key: "ausencia", label: "Ausencia", icon: "event_busy", color: "pink-7" },
      varios: { key: "varios", label: "Varios turnos", icon: "layers", color: "deep-purple-6" },
    };

    function estadoVisualDeTurno(turno) {
      const turnoNormalizado = normalizar(turno);
      const turnoBusqueda = turnoNormalizado.toLocaleLowerCase("es");

      if (turnoBusqueda.includes("feriado")) return estadosEspeciales.feriado;
      if (turnoBusqueda.includes("vacacion")) return estadosEspeciales.vacaciones;
      if (turnoBusqueda.includes("incap") || turnoBusqueda.includes("permiso")) return estadosEspeciales.ausencia;
      if (
        turnoBusqueda === "l" ||
        turnoBusqueda === "off" ||
        turnoBusqueda.includes("libre") ||
        turnoBusqueda.includes("descanso") ||
        turnoBusqueda.includes("winter break")
      ) {
        return estadosEspeciales.libre;
      }

      const grupo = grupoDeTurno(turnoNormalizado);
      return { key: grupo.key, label: grupo.label, icon: grupo.icon, color: grupo.color };
    }

    function estadoVisualDelDia(registros) {
      if (!scheduleUserFilter.value || registros.length === 0) return null;
      const estados = registros.map((registro) => estadoVisualDeTurno(registro.turno));
      const estadosUnicos = [...new Set(estados.map((estado) => estado.key))];
      return estadosUnicos.length === 1 ? estados[0] : estadosEspeciales.varios;
    }

    const scheduleUserOptions = computed(() =>
      [...new Set(horarios.value.map((horario) => horario.empleado).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }))
    );

    const horarios15Dias = computed(() => {
      const hoy = new Date();
      const manana = new Date(hoy);
      manana.setDate(hoy.getDate() + 1);
      const fechaHoy = formatDate(hoy);
      const fechaManana = formatDate(manana);

      return Array.from({ length: 15 }, (_, index) => {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() + index);
        const fechaFormateada = formatDate(fecha);
        const registros = horarios.value.filter((horario) =>
          horario.fecha === fechaFormateada &&
          coincideConFiltro(horario.empleado, scheduleUserFilter.value)
        );

        return {
          fecha: fechaFormateada,
          esHoy: fechaFormateada === fechaHoy,
          esManana: fechaFormateada === fechaManana,
          total: registros.length,
          estado: estadoVisualDelDia(registros),
          grupos: gruposTurno.map((grupo) => ({
            ...grupo,
            personas: sortUserFirst(registros.filter((horario) => grupoDeTurno(horario.turno).key === grupo.key)),
          })),
        };
      });
    });

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
          diurno: sortUserFirst(diaData.filter(h => turnosDiurno.includes(normalizar(h.turno)))),
          partida: sortUserFirst(diaData.filter(h => turnosPartida.includes(normalizar(h.turno)))),
          mixto: sortUserFirst(diaData.filter(h => turnosMixto.includes(normalizar(h.turno)))),
          nocturno: sortUserFirst(diaData.filter(h => turnosNocturno.includes(normalizar(h.turno)))),
          otros: sortUserFirst(diaData.filter(h => {
            const t = normalizar(h.turno);
            return !turnosDiurno.includes(t) && !turnosPartida.includes(t) && !turnosMixto.includes(t) && !turnosNocturno.includes(t);
          }))
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

    function formatFechaRango(fechaStr) {
      if (!fechaStr) return "";
      const [y, m, d] = fechaStr.split("-").map(Number);
      return new Date(y, m - 1, d).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
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

    watch(scheduleView, () => {
      fetchHorarios();
    });

    watch(scheduleUserFilter, (usuario) => {
      try {
        if (usuario) {
          window.localStorage.setItem(scheduleUserStorageKey, usuario);
        } else {
          window.localStorage.removeItem(scheduleUserStorageKey);
        }
      } catch {
        // La vista sigue funcionando aunque el navegador bloquee el almacenamiento local.
      }
    });

    watch(empleadoDelUsuario, (empleado) => {
      if (!empleado) return;

      const filtroActual = scheduleUserFilter.value;
      if (!filtroActual || nombresCoinciden(filtroActual, currentUserName.value)) {
        scheduleUserFilter.value = empleado;
      }
    });

    onMounted(() => {
      fetchHorarios();
    });

    return {
      activeTab,
      scheduleView,
      scheduleUserFilter,
      scheduleUserOptions,
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
      next9Days,
      selectQuickDate,
      errorMsg,
      turnoDiurno,
      turnoPartida,
      turnoMixto,
      turnoNocturno,
      turnoOtros,
      currentUserName,
      empleadoDelUsuario,
      currentUserSchedule,
      currentUserScheduleHasTurno,
      getTurnoBadgeColor,
      fetchHorarios,
      horarios3Dias,
      horarios15Dias,
      formatFechaLarga,
      formatFechaRango,
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

.date-selector-scroll {
  overflow-x: auto;
  flex-wrap: nowrap;
  -webkit-overflow-scrolling: touch;
}

.date-selector-scroll > .q-btn {
  flex: 0 0 auto;
}

.schedule-view-selector {
  overflow: hidden;
  border-color: rgb(25 118 210 / 18%);
  border-radius: 14px;
  background: linear-gradient(135deg, rgb(25 118 210 / 7%), rgb(25 118 210 / 2%));
}

.schedule-view-toggle {
  width: 100%;
  border: 1px solid rgb(0 0 0 / 8%);
  border-radius: 9px;
}

.my-schedule-card {
  overflow: hidden;
  border-color: rgb(25 118 210 / 28%);
  border-radius: 14px;
  box-shadow: 0 2px 8px rgb(25 118 210 / 10%);
}

.my-schedule-card__item--today {
  background: rgb(25 118 210 / 6%);
}

.schedule-fortnight__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.schedule-user-filter {
  overflow: hidden;
  border-color: rgb(25 118 210 / 16%);
  border-radius: 12px;
}

.schedule-user-filter__active {
  color: #0d47a1;
  background: rgb(25 118 210 / 7%);
}

.schedule-day-card {
  overflow: hidden;
  border-radius: 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.schedule-day-card--today {
  border: 2px solid var(--q-primary);
  box-shadow: 0 5px 18px rgb(25 118 210 / 13%);
}

.schedule-day-card__header {
  min-height: 72px;
  background: rgb(0 0 0 / 2%);
}

.schedule-day-card--today .schedule-day-card__header {
  background: rgb(25 118 210 / 7%);
}

.schedule-day-card--filtered {
  border: 2px solid var(--schedule-status-accent);
  background: var(--schedule-status-surface);
  box-shadow: 0 5px 16px var(--schedule-status-shadow);
}

.schedule-day-card--filtered .schedule-day-card__header {
  background: var(--schedule-status-header);
}

.schedule-day-card--filtered .schedule-day-card__list {
  background: transparent;
}

.schedule-day-card--status-diurno {
  --schedule-status-accent: #d32f2f;
  --schedule-status-header: #ffebee;
  --schedule-status-surface: #fff8f8;
  --schedule-status-shadow: rgb(211 47 47 / 12%);
}

.schedule-day-card--status-partida {
  --schedule-status-accent: #ef6c00;
  --schedule-status-header: #fff3e0;
  --schedule-status-surface: #fffbf5;
  --schedule-status-shadow: rgb(239 108 0 / 12%);
}

.schedule-day-card--status-mixto {
  --schedule-status-accent: #2e7d32;
  --schedule-status-header: #e8f5e9;
  --schedule-status-surface: #f7fcf7;
  --schedule-status-shadow: rgb(46 125 50 / 12%);
}

.schedule-day-card--status-nocturno {
  --schedule-status-accent: #1565c0;
  --schedule-status-header: #e3f2fd;
  --schedule-status-surface: #f6faff;
  --schedule-status-shadow: rgb(21 101 192 / 13%);
}

.schedule-day-card--status-libre {
  --schedule-status-accent: #f9a825;
  --schedule-status-header: #fff8e1;
  --schedule-status-surface: #fffdf5;
  --schedule-status-shadow: rgb(249 168 37 / 14%);
}

.schedule-day-card--status-feriado {
  --schedule-status-accent: #7b1fa2;
  --schedule-status-header: #f3e5f5;
  --schedule-status-surface: #fcf8fd;
  --schedule-status-shadow: rgb(123 31 162 / 13%);
}

.schedule-day-card--status-vacaciones {
  --schedule-status-accent: #00897b;
  --schedule-status-header: #e0f2f1;
  --schedule-status-surface: #f5fcfb;
  --schedule-status-shadow: rgb(0 137 123 / 13%);
}

.schedule-day-card--status-ausencia {
  --schedule-status-accent: #c2185b;
  --schedule-status-header: #fce4ec;
  --schedule-status-surface: #fff7fa;
  --schedule-status-shadow: rgb(194 24 91 / 13%);
}

.schedule-day-card--status-varios {
  --schedule-status-accent: #5e35b1;
  --schedule-status-header: #ede7f6;
  --schedule-status-surface: #faf8fd;
  --schedule-status-shadow: rgb(94 53 177 / 13%);
}

.schedule-day-card--status-otros {
  --schedule-status-accent: #757575;
  --schedule-status-header: #eeeeee;
  --schedule-status-surface: #fafafa;
  --schedule-status-shadow: rgb(97 97 97 / 11%);
}

.schedule-status-badge {
  min-height: 20px;
  padding: 3px 7px;
}

.schedule-day-card__date {
  min-width: 0;
}

.schedule-day-card__empty {
  min-height: 112px;
}

.schedule-day-card__list {
  padding-bottom: 6px;
}

.schedule-shift-header {
  display: flex;
  align-items: center;
  padding: 12px 16px 5px;
  color: inherit;
  font-size: 0.73rem;
  font-weight: 700;
  letter-spacing: 0.035em;
  text-transform: uppercase;
}

:global(.body--dark) .schedule-view-selector {
  border-color: rgb(100 181 246 / 24%);
  background: rgb(33 150 243 / 8%);
}

:global(.body--dark) .schedule-view-toggle {
  border-color: rgb(255 255 255 / 12%);
}

:global(.body--dark) .schedule-user-filter {
  border-color: rgb(100 181 246 / 22%);
}

:global(.body--dark) .schedule-user-filter__active {
  color: #90caf9;
  background: rgb(33 150 243 / 12%);
}

:global(.body--dark) .schedule-day-card__header {
  background: rgb(255 255 255 / 4%);
}

:global(.body--dark) .schedule-day-card--today .schedule-day-card__header {
  background: rgb(33 150 243 / 13%);
}

:global(.body--dark) .schedule-day-card--filtered {
  --schedule-status-surface: #1f1f1f;
}

:global(.body--dark) .schedule-day-card--status-diurno {
  --schedule-status-header: #342020;
}

:global(.body--dark) .schedule-day-card--status-partida,
:global(.body--dark) .schedule-day-card--status-libre {
  --schedule-status-header: #342b1c;
}

:global(.body--dark) .schedule-day-card--status-mixto {
  --schedule-status-header: #1d3020;
}

:global(.body--dark) .schedule-day-card--status-nocturno {
  --schedule-status-header: #192a3d;
}

:global(.body--dark) .schedule-day-card--status-feriado,
:global(.body--dark) .schedule-day-card--status-varios {
  --schedule-status-header: #2d2135;
}

:global(.body--dark) .schedule-day-card--status-vacaciones {
  --schedule-status-header: #16332f;
}

:global(.body--dark) .schedule-day-card--status-ausencia {
  --schedule-status-header: #351d29;
}

:global(.body--dark) .schedule-day-card--status-otros {
  --schedule-status-header: #2b2b2b;
}

.vacaciones-ios {
  --ios-accent: #007aff;
  --ios-bg: #f2f2f7;
  --ios-label: #1c1c1e;
  --ios-secondary: #6e6e73;
  --ios-separator: rgb(60 60 67 / 14%);
  --ios-surface: #fff;
  overflow: hidden;
  border: 1px solid rgb(60 60 67 / 8%);
  border-radius: 24px;
  background: var(--ios-bg);
  color: var(--ios-label);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  box-shadow: 0 12px 34px rgb(0 0 0 / 7%);
}

.vacaciones-hero {
  position: relative;
  display: flex;
  min-height: 156px;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  overflow: hidden;
  padding: 26px 28px 24px;
  color: #fff;
  background: linear-gradient(145deg, #0a84ff 0%, #0874db 58%, #0058b8 100%);
}

.vacaciones-hero::after {
  position: absolute;
  top: -92px;
  right: -58px;
  width: 230px;
  height: 230px;
  border: 1px solid rgb(255 255 255 / 22%);
  border-radius: 50%;
  background: rgb(255 255 255 / 8%);
  content: "";
}

.vacaciones-hero__copy,
.vacaciones-year {
  position: relative;
  z-index: 1;
}

.vacaciones-hero__eyebrow {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  color: rgb(255 255 255 / 78%);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.vacaciones-hero__title {
  margin: 0;
  font-size: clamp(2rem, 5vw, 2.55rem);
  font-weight: 750;
  letter-spacing: -0.035em;
  line-height: 1.06;
}

.vacaciones-hero__subtitle {
  margin: 8px 0 0;
  color: rgb(255 255 255 / 82%);
  font-size: 0.9rem;
  line-height: 1.35;
}

.vacaciones-year {
  width: 124px;
  min-height: 44px;
  flex: 0 0 auto;
  padding: 0 10px;
  border: 1px solid rgb(255 255 255 / 28%);
  border-radius: 13px;
  color: #fff;
  background: rgb(255 255 255 / 18%);
  backdrop-filter: blur(16px) saturate(140%);
}

.vacaciones-year :deep(.q-field__native),
.vacaciones-year :deep(.q-field__prepend),
.vacaciones-year :deep(.q-field__append) {
  color: #fff;
  font-weight: 650;
}

.vacaciones-content {
  position: relative;
  min-height: 150px;
  padding: 22px;
}

.vacaciones-loading {
  border-radius: 0 0 24px 24px;
  background: rgb(242 242 247 / 86%);
  backdrop-filter: blur(10px);
}

.vacaciones-error {
  color: #b42318;
  background: #ffebe9;
}

.vacaciones-personas {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  align-items: start;
}

.vacaciones-persona {
  overflow: hidden;
  border: 1px solid rgb(60 60 67 / 8%);
  border-radius: 20px;
  background: var(--ios-surface);
  box-shadow: 0 3px 14px rgb(0 0 0 / 4%);
}

.vacaciones-persona__header {
  display: flex;
  min-height: 84px;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--ios-separator);
}

.vacaciones-persona__avatar {
  flex: 0 0 auto;
  color: #fff;
  background: linear-gradient(145deg, #5ac8fa, var(--ios-accent));
  font-size: 1.18rem;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 24%);
}

.vacaciones-persona__identity {
  min-width: 0;
  flex: 1 1 auto;
}

.vacaciones-persona__name {
  overflow: hidden;
  font-size: 1rem;
  font-weight: 680;
  letter-spacing: -0.015em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vacaciones-persona__meta {
  margin-top: 3px;
  color: var(--ios-secondary);
  font-size: 0.78rem;
}

.vacaciones-persona__total {
  display: flex;
  min-width: 58px;
  min-height: 52px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border-radius: 14px;
  color: var(--ios-accent);
  background: #eaf4ff;
  line-height: 1;
}

.vacaciones-persona__total strong {
  font-size: 1.35rem;
  font-weight: 750;
}

.vacaciones-persona__total span {
  margin-top: 4px;
  color: #3977b4;
  font-size: 0.67rem;
  font-weight: 600;
}

.vacaciones-periodos {
  display: grid;
  gap: 14px;
  padding: 14px;
}

.vacaciones-periodo {
  overflow: hidden;
  border: 1px solid var(--ios-separator);
  border-radius: 16px;
  background: #fafafa;
}

.vacaciones-periodo__header {
  display: flex;
  min-height: 64px;
  align-items: center;
  gap: 11px;
  padding: 10px 12px;
  background: var(--ios-surface);
}

.vacaciones-periodo__icon {
  display: flex;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: #fff;
  background: var(--ios-accent);
}

.vacaciones-periodo__heading {
  min-width: 0;
  flex: 1 1 auto;
}

.vacaciones-periodo__name {
  font-size: 0.9rem;
  font-weight: 680;
}

.vacaciones-periodo__range {
  overflow: hidden;
  margin-top: 2px;
  color: var(--ios-secondary);
  font-size: 0.72rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vacaciones-periodo__count {
  flex: 0 0 auto;
  padding: 6px 9px;
  border-radius: 999px;
  color: #0064cc;
  background: #eaf4ff;
  font-size: 0.76rem;
  font-weight: 700;
}

.vacaciones-dias {
  border-top: 1px solid var(--ios-separator);
  background: var(--ios-surface);
}

.vacaciones-dia {
  position: relative;
  display: flex;
  min-height: 46px;
  align-items: center;
  gap: 10px;
  padding: 7px 12px;
}

.vacaciones-dia:not(:last-child)::after {
  position: absolute;
  right: 12px;
  bottom: 0;
  left: 50px;
  height: 1px;
  background: var(--ios-separator);
  content: "";
}

.vacaciones-dia__icon {
  display: flex;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.vacaciones-dia__fecha {
  min-width: 0;
  flex: 1 1 auto;
  font-size: 0.82rem;
  font-weight: 550;
}

.vacaciones-dia__tipo {
  flex: 0 0 auto;
  color: var(--ios-secondary);
  font-size: 0.74rem;
  font-weight: 550;
}

.vacaciones-dia--vacacion .vacaciones-dia__icon {
  color: #0070e8;
  background: #e7f3ff;
}

.vacaciones-dia--feriado,
.vacaciones-dia--libre {
  background: #fffbea;
}

.vacaciones-dia--feriado .vacaciones-dia__icon,
.vacaciones-dia--libre .vacaciones-dia__icon {
  color: #624800;
  background: #ffd60a;
}

.vacaciones-dia--feriado .vacaciones-dia__tipo,
.vacaciones-dia--libre .vacaciones-dia__tipo {
  color: #765900;
  font-weight: 650;
}

.vacaciones-vacio {
  display: flex;
  min-height: 250px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 32px;
  text-align: center;
}

.vacaciones-vacio__icon {
  display: flex;
  width: 72px;
  height: 72px;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  border-radius: 22px;
  color: var(--ios-accent);
  background: #e5f2ff;
}

.vacaciones-vacio__title {
  font-size: 1.05rem;
  font-weight: 680;
}

.vacaciones-vacio__text {
  max-width: 270px;
  margin-top: 5px;
  color: var(--ios-secondary);
  font-size: 0.84rem;
}

:global(.body--dark) .vacaciones-ios {
  --ios-bg: #000;
  --ios-label: #f5f5f7;
  --ios-secondary: #98989d;
  --ios-separator: rgb(84 84 88 / 58%);
  --ios-surface: #1c1c1e;
  border-color: #2c2c2e;
}

:global(.body--dark) .vacaciones-persona,
:global(.body--dark) .vacaciones-periodo {
  border-color: #38383a;
  background: #1c1c1e;
}

:global(.body--dark) .vacaciones-persona__total,
:global(.body--dark) .vacaciones-periodo__count {
  color: #64aefb;
  background: #102a43;
}

:global(.body--dark) .vacaciones-persona__total span {
  color: #8bc1fa;
}

:global(.body--dark) .vacaciones-loading {
  background: rgb(0 0 0 / 84%);
}

:global(.body--dark) .vacaciones-dia--feriado,
:global(.body--dark) .vacaciones-dia--libre {
  background: rgb(255 214 10 / 10%);
}

:global(.body--dark) .vacaciones-dia--feriado .vacaciones-dia__tipo,
:global(.body--dark) .vacaciones-dia--libre .vacaciones-dia__tipo {
  color: #ffd60a;
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

@media (max-width: 599px) {
  .vacaciones-ios {
    margin: 0 -8px;
    border-radius: 22px;
  }

  .vacaciones-hero {
    min-height: 176px;
    align-items: flex-start;
    flex-direction: column;
    gap: 18px;
    padding: 23px 20px 20px;
  }

  .vacaciones-hero__subtitle {
    max-width: 235px;
  }

  .vacaciones-year {
    width: 118px;
  }

  .vacaciones-content {
    padding: 14px;
  }

  .vacaciones-personas {
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
  }
}
</style>

<template>
  <q-page class="puesto01-page q-pa-md">
    <div class="puesto01-shell">
      <section class="puesto01-hero q-mb-lg">
        <div class="puesto01-hero__topbar">
          <q-btn flat round dense icon="arrow_back" class="puesto01-back-btn" @click="router.push('/seguridad')" />
          <div class="puesto01-hero__eyebrow">Gate Operations</div>
          <div class="puesto01-hero__count">{{ activeOperationsCount }}</div>
        </div>

        <div class="puesto01-hero__content">
          <div class="puesto01-hero__copy">
            <div class="puesto01-hero__kicker">Control de accesos</div>
            <h1 class="puesto01-hero__title">Tabla Puesto 01</h1>
            <p class="puesto01-hero__description">
              Registro operativo Puesto 01 ingresos,salidas y tours de huespedes. Estado actual: {{ scopeLabel }}.
            </p>

            <div class="puesto01-hero__actions gt-sm">
              <q-btn
                v-if="authStore.canAdd"
                no-caps
                unelevated
                rounded
                icon="add"
                label="Ingresar movimiento"
                class="puesto01-primary-btn"
                @click="openManualMovementForm"
              />
              <q-btn
                v-if="searchTerm"
                no-caps
                flat
                rounded
                icon="close"
                label="Limpiar búsqueda"
                class="puesto01-secondary-btn"
                @click="searchTerm = ''"
              />
            </div>
          </div>

          <div class="puesto01-hero__stats">
            <article v-for="stat in heroStats" :key="stat.label" class="puesto01-stat-card">
              <div class="puesto01-stat-card__label">{{ stat.label }}</div>
              <div class="puesto01-stat-card__value">{{ stat.value }}</div>
              <div class="puesto01-stat-card__meta">{{ stat.meta }}</div>
            </article>
          </div>
        </div>
      </section>

      <section class="puesto01-command-card q-mb-md">
        <div class="puesto01-command-card__header">
          <div>
            <div class="puesto01-command-card__eyebrow"></div>
            <div class="puesto01-command-card__title">Filtra por estado, fecha o texto.</div>
          </div>
          <div class="puesto01-panel-tag">{{ scopeLabel }}</div>
        </div>

        <div class="row q-col-gutter-sm q-mt-md">
          <div class="col-12 col-lg-7">
            <q-btn-toggle
              v-model="searchScope"
              class="puesto01-toggle-group"
              no-caps
              rounded
              unelevated
              dense
              :options="[
                { label: 'Pendientes', value: 'pendientes' },
                { label: 'Completados', value: 'completados' }
              ]"
            />
          </div>
          <div class="col-12 col-lg-5" v-if="searchScope === 'completados'">
            <q-btn-toggle
              v-model="completadosDateMode"
              class="puesto01-toggle-group"
              no-caps
              rounded
              unelevated
              dense
              :options="[
                { label: 'Fecha específica', value: 'fecha' },
                { label: 'Todos los registros', value: 'todos' }
              ]"
            />
          </div>
        </div>

        <div class="row q-col-gutter-sm q-mt-sm">
          <div v-if="searchScope === 'completados' && completadosDateMode === 'fecha'" class="col-12 col-md-4">
            <q-input
              v-model="selectedDate"
              label="Fecha"
              outlined
              dense
              readonly
              class="puesto01-date-input"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date
                      v-model="selectedDate"
                      mask="YYYY-MM-DD"
                      minimal
                    />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div :class="searchScope === 'completados' && completadosDateMode === 'fecha' ? 'col-12 col-md-8' : 'col-12'">
            <q-input
              v-model="searchTerm"
              outlined
              dense
              placeholder="Buscar por casita, tipo, salida/llegada, placa o experiencia..."
              class="puesto01-search-input"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
              <template v-slot:append>
                <q-icon v-if="searchTerm" name="clear" class="cursor-pointer" @click="searchTerm = ''" />
              </template>
            </q-input>
          </div>
        </div>
      </section>

      <!-- Diálogo para los formularios (Movimiento manual, Check-In, Check-Out) -->
      <q-dialog v-model="showMovementFormWrapper" persistent :maximized="$q.screen.lt.md" transition-show="slide-up" transition-hide="slide-down">
        <q-card class="movement-form-card" :style="$q.screen.gt.sm ? 'min-width: 600px; max-width: 800px;' : ''">
          <q-card-section class="row items-center q-pb-none">
            <div>
              <div class="text-h6 text-weight-bold">{{ activeInlineFormTitle }}</div>
              <div class="text-caption text-grey-6">{{ activeInlineFormCaption }}</div>
            </div>
            <q-space />
            <q-btn flat round dense icon="close" @click="closeAllInlineForms" />
          </q-card-section>

          <q-card-section v-if="showManualMovementForm" class="q-pt-md">
            <div class="row q-col-gutter-md q-mb-sm">
              <div class="col-12 col-md-6">
                <q-select
                  v-model="manualMovementForm.tipo"
                  :options="manualMovementTypes"
                  label="Tipo *"
                  outlined
                  rounded
                  emit-value
                  map-options
                />
              </div>
              <div v-if="manualMovementForm.tipo && (isEditMode || manualMovementForm.tipo !== 'Outside Guest')" class="col-12 col-md-6">
                <q-input v-model="manualMovementForm.casita" label="Casita *" outlined rounded />
              </div>
            </div>

            <template v-if="manualMovementForm.tipo">
              <q-input v-model="manualMovementForm.nombre" label="Nombre *" outlined rounded class="q-mb-md" />

              <q-input
                v-if="isEditMode || manualRequiresColaborador"
                v-model="manualMovementForm.colaborador"
                label="Colaborador"
                outlined
                rounded
                class="q-mb-md"
              />

              <q-input v-model="manualMovementForm.placa" label="Placa" outlined rounded class="q-mb-md" />

              <q-input
                v-if="isEditMode || manualRequiresDetalle"
                v-model="manualMovementForm.detalle"
                label="Detalle"
                outlined
                rounded
                autogrow
                type="textarea"
                class="q-mb-md"
              />

              <q-input
                v-if="isEditMode || (manualRequiresHoraIngreso && manualMovementForm.tipo !== 'EXPERIENCIA')"
                v-model="manualMovementForm.horaIngreso"
                label="Hora ingreso *"
                outlined
                rounded
                class="q-mb-md"
                placeholder="Ej: 14:30"
              />

              <q-input
                v-if="isEditMode || (manualRequiresOficialIngreso && manualMovementForm.tipo !== 'EXPERIENCIA')"
                v-model="manualMovementForm.oficialIngreso"
                label="Oficial ingreso *"
                outlined
                rounded
                class="q-mb-md"
              />

              <q-input
                v-if="isEditMode || manualRequiresHoraSalida"
                v-model="manualMovementForm.horaSalida"
                label="Hora salida *"
                outlined
                rounded
                class="q-mb-md"
                placeholder="Ej: 14:30"
              />

              <q-input
                v-if="isEditMode || manualRequiresOficialSalida"
                v-model="manualMovementForm.oficialSalida"
                label="Oficial salida *"
                outlined
                rounded
              />
            </template>
          </q-card-section>

          <q-card-section v-else-if="showCheckInDialog" class="q-pt-md">
            <div class="row q-col-gutter-md q-mb-sm">
              <div v-if="!isOutsideGuestType(checkInForm.tipo)" class="col-12 col-md-6">
                <q-input v-model="checkInForm.casita" label="Casita" outlined rounded readonly />
              </div>
              <div :class="isOutsideGuestType(checkInForm.tipo) ? 'col-12' : 'col-12 col-md-6'">
                <q-input v-model="checkInForm.tipo" label="Tipo" outlined rounded readonly />
              </div>
            </div>

            <q-input v-model="checkInForm.nombre" label="Nombre *" outlined rounded class="q-mb-md" />
            <q-input v-if="!isOutsideGuestType(checkInForm.tipo)" v-model="checkInForm.colaborador" label="Colaborador" outlined rounded class="q-mb-md" />
            <q-input v-model="checkInForm.placa" label="Placa" outlined rounded class="q-mb-md" />
            <q-input
              v-if="isOutsideGuestType(checkInForm.tipo)"
              v-model="checkInForm.detalle"
              label="Detalle"
              outlined
              rounded
              type="textarea"
              autogrow
              class="q-mb-md"
            />
            <q-input v-model="checkInForm.horaIngreso" label="Hora de ingreso *" outlined rounded class="q-mb-md" placeholder="Ej: 14:30" />
            <q-input v-model="checkInForm.oficial" label="Oficial *" outlined rounded />
          </q-card-section>

          <q-card-section v-else-if="showCheckOutDialog" class="q-pt-md">
            <div class="row q-col-gutter-md q-mb-sm">
              <div v-if="!isOutsideGuestType(checkOutForm.tipo)" class="col-12 col-md-6">
                <q-input v-model="checkOutForm.casita" label="Casita" outlined rounded readonly />
              </div>
              <div :class="isOutsideGuestType(checkOutForm.tipo) ? 'col-12' : 'col-12 col-md-6'">
                <q-input v-model="checkOutForm.tipo" label="Tipo" outlined rounded readonly />
              </div>
            </div>

            <q-input v-model="checkOutForm.nombre" label="Nombre *" outlined rounded class="q-mb-md" />
            <q-input v-model="checkOutForm.colaborador" label="Colaborador" outlined rounded class="q-mb-md" />
            <q-input v-model="checkOutForm.placa" label="Placa" outlined rounded class="q-mb-md" />
            <q-input v-if="showCheckOutDetailField" v-model="checkOutForm.detalle" label="Detalle" outlined rounded type="textarea" autogrow class="q-mb-md" />
            <q-input v-model="checkOutForm.horaSalida" label="Hora de salida *" outlined rounded class="q-mb-md" placeholder="Ej: 14:30" />
            <q-input v-model="checkOutForm.oficial" label="Oficial *" outlined rounded />
          </q-card-section>

          <q-card-actions align="right" class="q-px-md q-pb-md q-gutter-sm">
            <q-btn flat rounded no-caps label="Cancelar" @click="closeAllInlineForms" />
            <q-btn
              v-if="showManualMovementForm"
              unelevated
              rounded
              no-caps
              color="primary"
              :label="isEditMode ? 'Actualizar' : 'Guardar movimiento'"
              :loading="saving"
              :disable="!canSubmitManualMovement"
              @click="saveManualMovement"
            />
            <q-btn
              v-else-if="showCheckInDialog"
              unelevated
              rounded
              no-caps
              color="primary"
              :label="checkInSaveButtonLabel"
              :loading="saving"
              :disable="!canSubmitCheckIn"
              @click="saveCheckIn"
            />
            <q-btn
              v-else-if="showCheckOutDialog"
              unelevated
              rounded
              no-caps
              color="primary"
              :label="checkOutSaveButtonLabel"
              :loading="saving"
              :disable="!canSubmitCheckOut"
              @click="saveCheckOut"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <div v-if="loading || loadingAll" class="text-center q-pa-xl">
        <q-spinner color="primary" size="40px" />
        <div class="q-mt-md text-grey-6 text-body2">Cargando operaciones...</div>
      </div>

      <div v-else-if="searchScope === 'pendientes' && pendingOperations.length > 0" class="operations-grid">
        <!-- Column 1: EXPERIENCIA -->
        <div class="operations-column">
          <div class="column-header experiencia-header">
            <q-icon name="star" color="deep-purple" size="20px" />
            <span class="column-title">Experiencias</span>
          </div>
          <div class="column-cards">
            <div v-for="operation in filteredByType('EXPERIENCIA', pendingOperations)" :key="operation.groupKey" class="operation-card native-card">
              <div class="operation-card-inner q-pa-md">
                <div class="row items-start justify-between q-col-gutter-sm">
                  <div class="col">
                    <div class="text-caption text-grey-6">Casitas</div>
                    <div class="text-h6 text-weight-bold casitas-list">{{ operation.displayCasitas || 'Sin casita' }}</div>
                  </div>
                  <q-badge :color="getTypeColor(operation.tipo)" :label="operation.displayTipo || operation.tipo || 'Sin tipo'" rounded />
                </div>

                <div class="q-mt-sm">
                  <div class="text-caption text-grey-6">Datos registrados</div>
                  <div class="text-body2 text-grey-8">{{ operation.displaySummary || operation.salida_llegada || 'Sin dato' }}</div>
                </div>

                <div class="q-mt-sm text-caption text-grey-7">Placa: {{ operation.linkedPuestoRow?.placa || 'Sin placa' }}</div>

                <div class="q-mt-sm">
                  <div class="text-caption text-grey-6">Detalle</div>
                  <div class="text-body2 text-grey-8">{{ operation.displayDetail || operation.experiencias || 'Sin detalle' }}</div>
                </div>

                <div class="q-mt-md experience-block experience-grid">
                  <div class="info-section-exit">
                    <div class="text-caption text-red-7 text-weight-bold q-mb-xs">Salida tour</div>
                    <div class="text-body2 text-grey-8">Colaborador: {{ operation.linkedPuestoRow?.colaboradorIngreso || 'Sin colaborador' }}</div>
                    <div class="text-body2 text-grey-8">Hora salida: {{ operation.linkedPuestoRow?.horaSalida || 'Sin hora' }}</div>
                    <div class="text-body2 text-grey-8">Oficial salida: {{ operation.linkedPuestoRow?.oficialSalida || 'Sin oficial' }}</div>
                  </div>
                  <div class="info-section-entry">
                    <div class="text-caption text-green-7 text-weight-bold q-mb-xs">Ingreso tour</div>
                    <div class="text-body2 text-grey-8">Hora ingreso: {{ operation.linkedPuestoRow?.horaIngreso || 'Sin hora' }}</div>
                    <div class="text-body2 text-grey-8">Oficial ingreso: {{ operation.linkedPuestoRow?.oficialIngreso || 'Sin oficial' }}</div>
                  </div>
                </div>

                <div class="row items-center justify-between q-mt-md">
                  <q-btn
                    unelevated
                    rounded
                    no-caps
                    :color="operation.hasTourSalida || operation.manualPendingMode === 'guest-exit-in' ? 'red' : 'deep-purple'"
                    :label="getTourButtonLabel(operation)"
                    :disable="!authStore.canAdd"
                    @click="handleTourAction(operation)"
                  />
                  <q-btn
                    v-if="searchScope === 'completados' && selectedDate === getLocalDateString()"
                    flat
                    round
                    color="primary"
                    icon="edit"
                    size="sm"
                    @click="openEditDialog(operation)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Column 2: CHECK-IN -->
        <div class="operations-column">
          <div class="column-header checkin-header">
            <q-icon name="login" color="green" size="20px" />
            <span class="column-title">Check-In</span>
          </div>
          <div class="column-cards">
            <div v-for="operation in filteredByType('CHECK-IN', pendingOperations)" :key="operation.groupKey" class="operation-card native-card">
              <div class="operation-card-inner q-pa-md">
                <div class="row items-start justify-between q-col-gutter-sm">
                  <div class="col">
                    <div class="text-caption text-grey-6">Casitas</div>
                    <div class="text-h6 text-weight-bold casitas-list">{{ operation.casitasLabel || 'Sin casita' }}</div>
                  </div>
                  <q-badge :color="getTypeColor(operation.displayTipo || operation.tipo)" :label="operation.displayTipo || operation.tipo || 'Sin tipo'" rounded />
                </div>

                <div class="q-mt-sm">
                  <div class="text-caption text-grey-6">Salida/Llegada</div>
                  <div class="text-body2 text-grey-8">{{ operation.salida_llegada || 'Sin dato' }}</div>
                </div>

                <div class="q-mt-sm text-caption text-grey-7">Placa: {{ operation.linkedPuestoRow?.placa || 'Sin placa' }}</div>

                <div class="q-mt-sm">
                  <div class="text-caption text-grey-6">Detalle</div>
                  <div class="text-body2 text-grey-8">{{ operation.displayDetail || operation.experiencias || 'Sin detalle' }}</div>
                </div>

                <div class="row items-center justify-between q-mt-md">
                  <q-btn
                    unelevated
                    rounded
                    no-caps
                    color="red"
                    :label="getCheckInButtonLabel(operation)"
                    :disable="!authStore.canAdd"
                    @click="handleCheckInAction(operation)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Column 3: CHECK-OUT -->
        <div class="operations-column">
          <div class="column-header checkout-header">
            <q-icon name="logout" color="orange" size="20px" />
            <span class="column-title">Check-Out</span>
          </div>
          <div class="column-cards">
            <div v-for="operation in filteredByType('CHECK-OUT', pendingOperations)" :key="operation.groupKey" class="operation-card native-card">
              <div class="operation-card-inner q-pa-md">
                <div class="row items-start justify-between q-col-gutter-sm">
                  <div class="col">
                    <div class="text-caption text-grey-6">Casitas</div>
                    <div class="text-h6 text-weight-bold casitas-list">{{ operation.casitasLabel || 'Sin casita' }}</div>
                  </div>
                  <q-badge :color="getTypeColor(operation.displayTipo || operation.tipo)" :label="operation.displayTipo || operation.tipo || 'Sin tipo'" rounded />
                </div>

                <div class="q-mt-sm">
                  <div class="text-caption text-grey-6">Nombre</div>
                  <div class="text-body2 text-grey-8">{{ operation.linkedPuestoRow?.nombre || operation.nombre || 'Sin nombre' }}</div>
                </div>

                <div class="q-mt-sm">
                  <div class="text-caption text-grey-6">Salida/Llegada</div>
                  <div class="text-body2 text-grey-8">{{ operation.salida_llegada || 'Sin dato' }}</div>
                </div>

                <div class="q-mt-sm text-caption text-grey-7">Placa: {{ operation.linkedPuestoRow?.placa || 'Sin placa' }}</div>

                <div class="q-mt-sm">
                  <div class="text-caption text-grey-6">Detalle</div>
                  <div class="text-body2 text-grey-8">{{ operation.displayDetail || operation.experiencias || 'Sin detalle' }}</div>
                </div>

                <div class="row items-center justify-between q-mt-md">
                  <q-btn
                    unelevated
                    rounded
                    no-caps
                    :color="operation.manualPendingMode === 'outside-guest-out' ? 'orange' : 'red'"
                    :label="getCheckOutButtonLabel(operation)"
                    :disable="!authStore.canAdd"
                    @click="handleCheckOutAction(operation)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="searchScope === 'completados' && completadosDateMode === 'fecha' && completedOperations.length > 0" class="operations-grid">
        <div class="operations-column">
          <div class="column-header experiencia-header">
            <q-icon name="star" color="deep-purple" size="20px" />
            <span class="column-title">Tours Completados</span>
          </div>
          <div class="column-cards">
            <div v-for="operation in filteredByType('EXPERIENCIA', completedOperations)" :key="`done-tour-${operation.groupKey}`" class="operation-card native-card">
              <div class="operation-card-inner q-pa-md">
                <div class="row items-start justify-between q-col-gutter-sm">
                  <div class="col">
                    <div class="text-caption text-grey-6">Casitas</div>
                    <div class="text-h6 text-weight-bold casitas-list">{{ operation.displayCasitas || operation.casitasLabel || 'Sin casita' }}</div>
                  </div>
                  <q-badge color="deep-purple" :label="operation.displayTipo || operation.tipo || 'EXPERIENCIA'" rounded />
                </div>
                <div class="q-mt-sm text-body2 text-grey-8">{{ operation.displaySummary || 'Sin dato' }}</div>
                <div class="q-mt-sm text-caption text-grey-6">Placa: {{ operation.linkedPuestoRow?.placa || 'Sin placa' }}</div>
                <div class="q-mt-sm">
                  <div class="text-caption text-grey-6">Detalle</div>
                  <div class="text-body2 text-grey-8">{{ operation.displayDetail || 'Sin detalle' }}</div>
                </div>
                <div class="q-mt-sm experience-block experience-grid">
                  <div>
                    <div class="text-caption text-grey-6 q-mb-xs">Salida tour</div>
                    <div class="text-body2 text-grey-8">Colaborador: {{ operation.linkedPuestoRow?.colaboradorIngreso || 'Sin colaborador' }}</div>
                    <div class="text-body2 text-grey-8">Hora salida: {{ operation.linkedPuestoRow?.horaSalida || 'Sin hora' }}</div>
                    <div class="text-body2 text-grey-8">Oficial salida: {{ operation.linkedPuestoRow?.oficialSalida || 'Sin oficial' }}</div>
                  </div>
                  <div>
                    <div class="text-caption text-grey-6 q-mb-xs">Ingreso tour</div>
                    <div class="text-body2 text-grey-8">Hora ingreso: {{ operation.linkedPuestoRow?.horaIngreso || 'Sin hora' }}</div>
                    <div class="text-body2 text-grey-8">Oficial ingreso: {{ operation.linkedPuestoRow?.oficialIngreso || 'Sin oficial' }}</div>
                  </div>
                </div>

                <div v-if="searchScope === 'completados' && selectedDate === getLocalDateString()" class="row justify-end q-mt-sm">
                  <q-btn flat round color="primary" icon="edit" size="sm" @click="openEditDialog(operation)" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="operations-column">
          <div class="column-header checkin-header">
            <q-icon name="login" color="green" size="20px" />
            <span class="column-title">Check-In Completados</span>
          </div>
          <div class="column-cards">
            <div v-for="operation in filteredByType('CHECK-IN', completedOperations)" :key="`done-in-${operation.groupKey}`" class="operation-card native-card">
              <div class="operation-card-inner q-pa-md">
                <div class="row items-start justify-between q-col-gutter-sm">
                  <div class="col">
                    <div class="text-caption text-grey-6">Casitas</div>
                    <div class="text-h6 text-weight-bold casitas-list">{{ operation.displayCasitas || operation.casitasLabel || 'Sin casita' }}</div>
                  </div>
                  <q-badge color="green" :label="operation.displayTipo || operation.tipo || 'CHECK-IN'" rounded />
                </div>
                <div class="q-mt-sm text-body2 text-grey-8">Nombre: {{ operation.linkedPuestoRow?.nombre || 'Sin nombre' }}</div>
                <div class="q-mt-sm">
                  <div class="text-caption text-grey-6">Detalle</div>
                  <div class="text-body2 text-grey-8">{{ operation.displayDetail || 'Sin detalle' }}</div>
                </div>
                <div class="q-mt-sm text-caption text-grey-6">Colaborador: {{ operation.linkedPuestoRow?.colaboradorIngreso || 'Sin colaborador' }}</div>
                <div class="text-caption text-grey-6">Hora ingreso: {{ operation.linkedPuestoRow?.horaIngreso || 'Sin hora' }}</div>
                <div class="text-caption text-grey-6">Oficial ingreso: {{ operation.linkedPuestoRow?.oficialIngreso || 'Sin oficial' }}</div>
                <div class="text-caption text-grey-6">Placa: {{ operation.linkedPuestoRow?.placa || 'Sin placa' }}</div>
                
                <div v-if="searchScope === 'completados' && selectedDate === getLocalDateString()" class="row justify-end q-mt-sm">
                  <q-btn flat round color="primary" icon="edit" size="sm" @click="openEditDialog(operation)" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="operations-column">
          <div class="column-header checkout-header">
            <q-icon name="logout" color="orange" size="20px" />
            <span class="column-title">Check-Out Completados</span>
          </div>
          <div class="column-cards">
            <div v-for="operation in filteredByType('CHECK-OUT', completedOperations)" :key="`done-out-${operation.groupKey}`" class="operation-card native-card">
              <div class="operation-card-inner q-pa-md">
                <div class="row items-start justify-between q-col-gutter-sm">
                  <div class="col">
                    <div class="text-caption text-grey-6">Casitas</div>
                    <div class="text-h6 text-weight-bold casitas-list">{{ operation.displayCasitas || operation.casitasLabel || 'Sin casita' }}</div>
                  </div>
                  <q-badge color="orange" :label="operation.displayTipo || operation.tipo || 'CHECK-OUT'" rounded />
                </div>
                <div class="q-mt-sm text-body2 text-grey-8">Nombre: {{ operation.linkedPuestoRow?.nombre || 'Sin nombre' }}</div>
                <div class="q-mt-sm">
                  <div class="text-caption text-grey-6">Detalle</div>
                  <div class="text-body2 text-grey-8">{{ operation.displayDetail || 'Sin detalle' }}</div>
                </div>
                <div class="q-mt-sm text-caption text-grey-6">Colaborador: {{ operation.linkedPuestoRow?.colaboradorIngreso || 'Sin colaborador' }}</div>
                <div class="text-caption text-grey-6">Hora salida: {{ operation.linkedPuestoRow?.horaSalida || 'Sin hora' }}</div>
                <div class="text-caption text-grey-6">Oficial salida: {{ operation.linkedPuestoRow?.oficialSalida || 'Sin oficial' }}</div>
                <div class="text-caption text-grey-6">Placa: {{ operation.linkedPuestoRow?.placa || 'Sin placa' }}</div>

                <div v-if="searchScope === 'completados' && selectedDate === getLocalDateString()" class="row justify-end q-mt-sm">
                  <q-btn flat round color="primary" icon="edit" size="sm" @click="openEditDialog(operation)" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="searchScope === 'completados' && completadosDateMode === 'todos' && filteredAllPuesto.length > 0" class="operations-grid">
        <div class="operations-column">
          <div class="column-header experiencia-header">
            <q-icon name="star" color="deep-purple" size="20px" />
            <span class="column-title">Tours ({{ filteredByType('EXPERIENCIA', filteredAllPuesto).length }})</span>
          </div>
          <div class="column-cards">
            <div v-for="row in filteredByType('EXPERIENCIA', filteredAllPuesto)" :key="`all-tour-${row.id}`" class="operation-card native-card">
              <div class="operation-card-inner q-pa-md">
                <div class="row items-start justify-between q-col-gutter-sm">
                  <div class="col">
                    <div class="text-caption text-grey-6">Casita</div>
                    <div class="text-h6 text-weight-bold casitas-list">{{ row.casita || 'Sin casita' }}</div>
                  </div>
                  <q-badge :color="getTypeColor(row.tipo)" :label="row.tipo || 'EXPERIENCIA'" rounded />
                </div>
                <div class="q-mt-sm text-body2 text-grey-8">Nombre: {{ row.nombre || 'Sin nombre' }}</div>
                <div class="q-mt-sm">
                  <div class="text-caption text-grey-6">Detalle</div>
                  <div class="text-body2 text-grey-8">{{ row.detalle || 'Sin detalle' }}</div>
                </div>
                <div class="q-mt-xs text-caption text-grey-6">Fecha: {{ row.fecha || 'Sin fecha' }}</div>
                <div class="q-mt-xs text-caption text-grey-6">Placa: {{ row.placa || 'Sin placa' }}</div>
                <div class="q-mt-sm">
                  <div class="text-caption text-grey-6 text-weight-bold" style="color: #d32f2f;">Salida</div>
                  <div class="text-body2 text-grey-8">Colaborador: {{ row.colaboradorIngreso || 'Sin colaborador' }}</div>
                  <div class="text-body2 text-grey-8">Hora salida: {{ row.horaSalida || 'Sin hora' }}</div>
                  <div class="text-body2 text-grey-8">Oficial salida: {{ row.oficialSalida || 'Sin oficial' }}</div>
                </div>
                <div class="q-mt-sm">
                  <div class="text-caption text-grey-6 text-weight-bold" style="color: #2e7d32;">Ingreso</div>
                  <div class="text-body2 text-grey-8">Hora ingreso: {{ row.horaIngreso || 'Sin hora' }}</div>
                  <div class="text-body2 text-grey-8">Oficial ingreso: {{ row.oficialIngreso || 'Sin oficial' }}</div>
                </div>
                <div class="q-mt-xs text-caption text-grey-6">Placa: {{ row.placa || 'Sin placa' }}</div>
                <div class="q-mt-xs text-caption text-grey-6">Fecha: {{ row.fecha || 'Sin fecha' }}</div>
                
                <div v-if="searchScope === 'completados' && selectedDate === getLocalDateString()" class="row justify-end q-mt-sm">
                  <q-btn flat round color="primary" icon="edit" size="sm" @click="openEditDialog(row)" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="operations-column">
          <div class="column-header checkin-header">
            <q-icon name="login" color="green" size="20px" />
            <span class="column-title">Check-In ({{ filteredByType('CHECK-IN', filteredAllPuesto).length }})</span>
          </div>
          <div class="column-cards">
            <div v-for="row in filteredByType('CHECK-IN', filteredAllPuesto)" :key="`all-in-${row.id}`" class="operation-card native-card">
              <div class="operation-card-inner q-pa-md">
                <div class="row items-start justify-between q-col-gutter-sm">
                  <div class="col">
                    <div class="text-caption text-grey-6">Casita</div>
                    <div class="text-h6 text-weight-bold casitas-list">{{ row.casita || 'Sin casita' }}</div>
                  </div>
                  <q-badge color="green" :label="row.tipo || 'CHECK-IN'" rounded />
                </div>
                <div class="q-mt-sm text-body2 text-grey-8">Nombre: {{ row.nombre || 'Sin nombre' }}</div>
                <div class="q-mt-sm">
                  <div class="text-caption text-grey-6">Detalle</div>
                  <div class="text-body2 text-grey-8">{{ row.detalle || 'Sin detalle' }}</div>
                </div>
                <div class="q-mt-xs text-caption text-grey-6">Fecha: {{ row.fecha || 'Sin fecha' }}</div>
                <div class="text-caption text-grey-6">Colaborador: {{ row.colaboradorIngreso || 'Sin colaborador' }}</div>
                <div class="text-caption text-grey-6">Hora ingreso: {{ row.horaIngreso || 'Sin hora' }}</div>
                <div class="text-caption text-grey-6">Oficial ingreso: {{ row.oficialIngreso || 'Sin oficial' }}</div>
                <div class="text-caption text-grey-6">Placa: {{ row.placa || 'Sin placa' }}</div>

                <div v-if="searchScope === 'completados' && selectedDate === getLocalDateString()" class="row justify-end q-mt-sm">
                  <q-btn flat round color="primary" icon="edit" size="sm" @click="openEditDialog(row)" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="operations-column">
          <div class="column-header checkout-header">
            <q-icon name="logout" color="orange" size="20px" />
            <span class="column-title">Check-Out ({{ filteredByType('CHECK-OUT', filteredAllPuesto).length }})</span>
          </div>
          <div class="column-cards">
            <div v-for="row in filteredByType('CHECK-OUT', filteredAllPuesto)" :key="`all-out-${row.id}`" class="operation-card native-card">
              <div class="operation-card-inner q-pa-md">
                <div class="row items-start justify-between q-col-gutter-sm">
                  <div class="col">
                    <div class="text-caption text-grey-6">Casita</div>
                    <div class="text-h6 text-weight-bold casitas-list">{{ row.casita || 'Sin casita' }}</div>
                  </div>
                  <q-badge color="orange" :label="row.tipo || 'CHECK-OUT'" rounded />
                </div>
                <div class="q-mt-sm text-body2 text-grey-8">Nombre: {{ row.nombre || 'Sin nombre' }}</div>
                <div class="q-mt-sm">
                  <div class="text-caption text-grey-6">Detalle</div>
                  <div class="text-body2 text-grey-8">{{ row.detalle || 'Sin detalle' }}</div>
                </div>
                <div class="q-mt-xs text-caption text-grey-6">Fecha: {{ row.fecha || 'Sin fecha' }}</div>
                <div class="text-caption text-grey-6">Colaborador: {{ row.colaboradorIngreso || 'Sin colaborador' }}</div>
                <div class="text-caption text-grey-6">Hora salida: {{ row.horaSalida || 'Sin hora' }}</div>
                <div class="text-caption text-grey-6">Oficial salida: {{ row.oficialSalida || 'Sin oficial' }}</div>
                <div class="text-caption text-grey-6">Placa: {{ row.placa || 'Sin placa' }}</div>

                <div v-if="searchScope === 'completados' && selectedDate === getLocalDateString()" class="row justify-end q-mt-sm">
                  <q-btn flat round color="primary" icon="edit" size="sm" @click="openEditDialog(row)" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <q-icon :name="searchTerm ? 'search_off' : 'view_agenda'" size="52px" color="grey-4" />
        <div class="text-body1 text-grey-5 q-mt-sm">{{ searchTerm ? 'Sin resultados' : (searchScope === 'completados' ? 'Sin operaciones completadas' : 'Sin operaciones del día') }}</div>
        <div class="text-caption text-grey-4">{{ searchTerm ? 'Prueba con otro término de búsqueda' : (searchScope === 'completados' ? (completadosDateMode === 'todos' ? 'No hay registros en Puesto_01' : 'No hay registros en Puesto_01 para esta fecha') : 'No hay registros en operaciones_memo para hoy') }}</div>
      </div>

      <q-page-sticky v-if="authStore.canAdd" position="bottom-right" :offset="[20, 20]" class="lt-md">
        <q-btn
          fab
          icon="add"
          class="puesto01-fab"
          @click="openManualMovementForm"
        />
      </q-page-sticky>

    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from '../supabase'
import { useAuthStore } from '../stores/auth'

export default defineComponent({
  name: 'Puesto01TablePage',
  setup () {
    const router = useRouter()
    const $q = useQuasar()
    const authStore = useAuthStore()

    const loading = ref(true)
    const saving = ref(false)
    const operations = ref([])
    const puestoRows = ref([])
    const searchTerm = ref('')
    const selectedDate = ref(getLocalDateString())
    const activeTab = ref('pendientes')
    const searchScope = ref('pendientes')
    const completadosDateMode = ref('fecha')
    const allPuestoRows = ref([])
    const loadingAll = ref(false)
    const showManualMovementForm = ref(false)
    const showCheckInDialog = ref(false)
    const showCheckOutDialog = ref(false)
    const selectedOperation = ref(null)
    const checkInForm = ref(createEmptyCheckInForm())
    const checkOutForm = ref(createEmptyCheckOutForm())
    const checkInDialogMode = ref('checkin')
    const checkOutDialogMode = ref('checkout')
    const movementFormRef = ref(null)
    const manualMovementTypes = [
      { label: 'EXPERIENCIA', value: 'EXPERIENCIA' },
      { label: 'CHECK-IN', value: 'CHECK-IN' },
      { label: 'CHECK-OUT', value: 'CHECK-OUT' },
      { label: 'Outside Guest', value: 'Outside Guest' },
      { label: 'Salida huesped', value: 'Salida huesped' }
    ]

    function createEmptyManualMovementForm () {
      return {
        tipo: '',
        casita: '',
        nombre: '',
        colaborador: '',
        placa: '',
        detalle: '',
        horaIngreso: '',
        oficialIngreso: authStore.user?.Usuario || '',
        horaSalida: '',
        oficialSalida: authStore.user?.Usuario || ''
      }
    }

    const manualMovementForm = ref(createEmptyManualMovementForm())

    function createEmptyCheckInForm () {
      return {
        nombre: '',
        colaborador: '',
        placa: '',
        detalle: '',
        horaIngreso: '',
        oficial: authStore.user?.Usuario || '',
        casita: '',
        tipo: 'CHECK-IN'
      }
    }

    function createEmptyCheckOutForm () {
      return {
        nombre: '',
        colaborador: '',
        placa: '',
        horaSalida: '',
        oficial: authStore.user?.Usuario || '',
        casita: '',
        detalle: '',
        tipo: 'CHECK-OUT'
      }
    }

    function getLocalDateString (date = new Date()) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    function getLocalFullDateTimeString (date = new Date()) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    }

    // New helper to convert "Sunday, April 12th" to "2026-04-12"
    // Using current year as base
    function parseTextDateToISO (text) {
      if (!text || typeof text !== 'string') return ''
      
      const months = {
        'January': '01', 'February': '02', 'March': '03', 'April': '04',
        'May': '05', 'June': '06', 'July': '07', 'August': '08',
        'September': '09', 'October': '10', 'November': '11', 'December': '12'
      }

      // Format: "Sunday, April 12th" -> Match "April" and "12"
      const match = text.match(/([A-Z][a-z]+),\s+([A-Z][a-z]+)\s+(\d+)/)
      if (match) {
        const monthName = match[2]
        const day = match[3].padStart(2, '0')
        const month = months[monthName]
        if (month) {
          const year = new Date().getFullYear() // Base year
          return `${year}-${month}-${day}`
        }
      }
      return ''
    }

    const normalizeDateOnly = (value) => {
      if (!value) return ''

      // If it matches the text format "Sunday, April 12th"
      if (typeof value === 'string' && value.includes(',')) {
        const mapped = parseTextDateToISO(value)
        if (mapped) return mapped
      }

      // Handle "YYYY-MM-DD HH:mm:ss" from Supabase which might be treated as UTC by new Date() 
      // if not careful. We want to treat it as LOCAL to the device.
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(value)) {
        // Just take the date part directly if it's already in the local date format
        return value.slice(0, 10)
      }

      // Standard ISO string "YYYY-MM-DDTHH:mm:ssZ"
      if (typeof value === 'string' && value.includes('T')) {
        const parsed = new Date(value)
        if (!Number.isNaN(parsed.getTime())) {
          return getLocalDateString(parsed)
        }
      }

      const parsed = new Date(value)
      if (Number.isNaN(parsed.getTime())) return ''
      return getLocalDateString(parsed)
    }

    const normalizeType = (value) => String(value || '').trim().toUpperCase()
    const normalizeSalidaLlegada = (value) => String(value || '').trim().toUpperCase()
    const normalizeTypeKey = (value) => normalizeType(value).replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
    const isOutsideGuestCasita = (value) => {
      const normalized = normalizeTypeKey(value)
      return normalized === 'OUTSIDE GUEST' || normalized === 'OUTSIDE GUESTS'
    }
    const isExperienceType = (type) => {
      const normalized = normalizeType(type)
      return normalized === 'EXPERIENCIA' || normalized === 'EXPERIENCIAS'
    }
    const isOutsideGuestType = (type) => isOutsideGuestCasita(type)
    const resolveCheckInType = (casita) => isOutsideGuestCasita(casita) ? 'Outside Guest' : 'CHECK-IN'
    const isSalidaHuespedType = (type) => normalizeTypeKey(type) === 'SALIDA HUESPED'
    const isTourType = (type) => isExperienceType(type) || isOutsideGuestType(type)
    const hasMemoOperationIds = (item) => Array.isArray(item?.operationIds) && item.operationIds.length > 0
    const isOutsideGuestRecord = (item) => {
      if (!item || typeof item !== 'object') return false
      if (isOutsideGuestType(item.tipo) || isOutsideGuestCasita(item.casita)) return true
      if (isOutsideGuestCasita(item.baseOperation?.casita) || isOutsideGuestType(item.baseOperation?.tipo)) return true
      if (isOutsideGuestCasita(item.linkedPuestoRow?.casita) || isOutsideGuestType(item.linkedPuestoRow?.tipo)) return true
      return Array.isArray(item.casitas) && item.casitas.some(isOutsideGuestCasita)
    }
    const isOutsideGuestMemoOperation = (item) => hasMemoOperationIds(item) && isOutsideGuestRecord(item)
    const isPlaceholderValue = (value) => {
      const normalized = String(value || '').trim().toUpperCase()
      return !normalized || normalized === 'X'
    }
    const hasRealValue = (value) => !isPlaceholderValue(value)
    const splitOperationMemoIds = (value) => String(value || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
    const hasOperationMemoMatch = (operationIds = [], rowMemoIds = '') => {
      if (!Array.isArray(operationIds) || operationIds.length === 0) return false
      const memoIds = splitOperationMemoIds(rowMemoIds)
      if (memoIds.length === 0) return false
      const operationSet = new Set(operationIds.map((id) => String(id).trim()).filter(Boolean))
      return memoIds.some((id) => operationSet.has(id))
    }
    const extractPuestoValue = (row, upperKey, lowerKey) => {
      if (!row || typeof row !== 'object') return ''
      return row[upperKey] ?? row[lowerKey] ?? ''
    }

    const pickPuesto = (row, ...keys) => {
      if (!row || typeof row !== 'object') return ''
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') return row[k]
      }
      return ''
    }

    const revealInlineForm = async () => {
      // No longer needed since we use a dialog
    }

    const closeAllInlineForms = () => {
      showManualMovementForm.value = false
      showCheckInDialog.value = false
      showCheckOutDialog.value = false
      selectedOperation.value = null
      isEditMode.value = false
      checkInDialogMode.value = 'checkin'
      checkOutDialogMode.value = 'checkout'
      checkInForm.value = createEmptyCheckInForm()
      checkOutForm.value = createEmptyCheckOutForm()
      manualMovementForm.value = createEmptyManualMovementForm()
    }

    const openManualMovementForm = async () => {
      closeAllInlineForms()
      showManualMovementForm.value = true
    }

    const openEditDialog = async (operation) => {
      closeAllInlineForms()

      const linkedPuestoId = operation?.linkedPuestoId || operation?.linkedPuestoRow?.id || operation?.id || null
      selectedOperation.value = {
        ...operation,
        linkedPuestoId
      }
      isEditMode.value = true

      let row = operation.linkedPuestoRow || operation
      if (linkedPuestoId) {
        try {
          const fetched = await fetchPuestoRowById(linkedPuestoId)
          if (fetched) row = fetched
        } catch (err) {
          console.warn('Unable to fetch full Puesto_01 row, falling back to provided operation', err)
        }
      }

      manualMovementForm.value = {
        tipo: pickPuesto(row, 'Tipo', 'tipo') || '',
        casita: pickPuesto(row, 'Casita', 'casita'),
        nombre: pickPuesto(row, 'Nombre', 'nombre'),
        colaborador: pickPuesto(row, 'colaboradorIngreso', 'colaborador', 'colaborador_ingreso'),
        placa: pickPuesto(row, 'Placa', 'placa'),
        detalle: pickPuesto(row, 'Detalle', 'detalle', 'experiencias'),
        horaIngreso: pickPuesto(row, 'Hora_ingreso', 'hora_ingreso', 'horaIngreso'),
        oficialIngreso: pickPuesto(row, 'Oficial_ingreso', 'oficial_ingreso', 'oficialIngreso') || authStore.user?.Usuario || '',
        horaSalida: pickPuesto(row, 'Hora_salida', 'hora_salida', 'horaSalida'),
        oficialSalida: pickPuesto(row, 'Oficial_salida', 'oficial_salida', 'oficialSalida') || authStore.user?.Usuario || ''
      }

      showManualMovementForm.value = true
    }

    const isCheckIn = (type) => normalizeType(type) === 'CHECK-IN'
    const isExperience = (type) => isExperienceType(type)

    const getDisplayColumnType = (item) => {
      const explicitCategory = item?.operationCategory
      if (explicitCategory) return explicitCategory

      if (isOutsideGuestRecord(item)) {
        return isOutsideGuestMemoOperation(item) ? 'CHECK-IN' : 'CHECK-OUT'
      }

      const typeKey = normalizeTypeKey(item?.tipo)
      if (typeKey === 'CHECK IN') return 'CHECK-IN'
      if (typeKey === 'CHECK OUT') return 'CHECK-OUT'
      if (isExperienceType(item?.tipo) || typeKey === 'SALIDA HUESPED') return 'EXPERIENCIA'
      return normalizeType(item?.tipo)
    }

    const buildManualRowDetail = (row) => {
      const parts = []
      if (row.detalle) parts.push(row.detalle)
      if (hasRealValue(row.horaIngreso)) parts.push(`Hora ingreso: ${row.horaIngreso}`)
      if (hasRealValue(row.horaSalida)) parts.push(`Hora salida: ${row.horaSalida}`)
      return parts.join(' | ') || 'Sin detalle'
    }

    const getTypeColor = (type) => {
      const normalized = normalizeType(type)
      const typeKey = normalizeTypeKey(type)
      if (normalized === 'CHECK-IN') return 'green'
      if (normalized === 'CHECK-OUT' || typeKey === 'SALIDA HUESPED') return 'orange'
      if (isOutsideGuestType(type)) return 'blue-grey'
      if (isTourType(normalized)) return 'deep-purple'
      return 'grey'
    }

    const formatDateTime = (value) => {
      if (!value) return 'Sin fecha'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return String(value)
      return date.toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const filteredOperations = computed(() => {
      const term = searchTerm.value.trim().toLowerCase()
      if (!term) return operations.value

      return operations.value.filter((operation) => {
        return [operation.casita, operation.tipo, operation.experiencias, operation.salida_llegada]
          .some((value) => String(value || '').toLowerCase().includes(term))
      })
    })

    const groupedOperations = computed(() => {
      const groups = new Map()

      filteredOperations.value.forEach((operation) => {
        const normalizedType = normalizeType(operation.tipo)
        const normalizedSalidaLlegada = normalizeSalidaLlegada(operation.salida_llegada)
        const groupKey = `${normalizedType}::${normalizedSalidaLlegada}`

        if (!groups.has(groupKey)) {
          groups.set(groupKey, {
            groupKey,
            tipo: operation.tipo || 'Sin tipo',
            salida_llegada: operation.salida_llegada || '',
            fecha_update: operation.fecha_update,
            experiencias: operation.experiencias || '',
            casitas: [],
            operationIds: [],
            baseOperation: operation
          })
        }

        const currentGroup = groups.get(groupKey)
        const casita = String(operation.casita || '').trim()
        if (casita && !currentGroup.casitas.includes(casita)) {
          currentGroup.casitas.push(casita)
        }

        const operationId = String(operation.id || '').trim()
        if (operationId && !currentGroup.operationIds.includes(operationId)) {
          currentGroup.operationIds.push(operationId)
        }

        if (!currentGroup.experiencias && operation.experiencias) {
          currentGroup.experiencias = operation.experiencias
        }

        const existingDate = new Date(currentGroup.fecha_update)
        const incomingDate = new Date(operation.fecha_update)
        if (!Number.isNaN(incomingDate.getTime()) && (Number.isNaN(existingDate.getTime()) || incomingDate > existingDate)) {
          currentGroup.fecha_update = operation.fecha_update
          currentGroup.baseOperation = operation
        }
      })

      return Array.from(groups.values())
        .map((group) => {
          const linkedPuesto = puestoRows.value.find((row) => hasOperationMemoMatch(group.operationIds, row.idOperacionMemo))
          const normalizedType = normalizeType(group.tipo)
          const isOutsideMemoGroup = isOutsideGuestMemoOperation(group)

          const baseCasitas = group.casitas.length > 0 ? group.casitas.join(', ') : 'Sin casita'
          const displayCasitas = linkedPuesto?.casita || baseCasitas
          const displayTipo = linkedPuesto?.tipo || (isOutsideMemoGroup ? 'Outside Guest' : group.tipo)
          const displaySummary = linkedPuesto
            ? `Nombre: ${linkedPuesto.nombre || 'Sin nombre'}`
            : (group.salida_llegada || 'Sin dato')
          const displayDetail = linkedPuesto
            ? (linkedPuesto.detalle || `Hora ingreso: ${linkedPuesto.horaIngreso || 'Sin hora'} | Hora salida: ${linkedPuesto.horaSalida || 'Sin hora'} | Oficial ingreso: ${linkedPuesto.oficialIngreso || 'Sin oficial'} | Oficial salida: ${linkedPuesto.oficialSalida || 'Sin oficial'}`)
            : (group.experiencias || 'Sin detalle')
          const isHiddenByPuesto = Boolean(linkedPuesto) && (normalizedType === 'CHECK-IN' || normalizedType === 'CHECK-OUT' || isOutsideMemoGroup)
          const hasTourSalida = Boolean(linkedPuesto) && hasRealValue(linkedPuesto.horaSalida)
          const hasTourIngreso = Boolean(linkedPuesto) && hasRealValue(linkedPuesto.horaIngreso)

          return {
            ...group,
            idOperacionMemo: group.operationIds.join(','),
            casitasLabel: baseCasitas,
            linkedPuestoId: linkedPuesto?.id || null,
            linkedPuestoRow: linkedPuesto || null,
            isHiddenByPuesto,
            hasTourSalida,
            hasTourIngreso,
            displayCasitas,
            displayTipo,
            displaySummary,
            displayDetail
          }
        })
        .filter(Boolean)
    })

    const manualPuestoOperations = computed(() => {
      return puestoRows.value
        .filter((row) => splitOperationMemoIds(row.idOperacionMemo).length === 0)
        .map((row) => {
          const displayColumnType = getDisplayColumnType(row)
          const displayCasitaLabel = isOutsideGuestType(row.tipo)
            ? (row.casita || 'Outside Guest')
            : (row.casita || 'Sin casita')
          const manualPendingMode = isOutsideGuestType(row.tipo)
            ? (!hasRealValue(row.horaSalida) ? 'outside-guest-out' : '')
            : (displayColumnType === 'EXPERIENCIA' && !hasRealValue(row.horaIngreso)
                ? (isSalidaHuespedType(row.tipo) ? 'guest-exit-in' : 'tour-in')
                : '')

          return {
            groupKey: `manual-${row.id}`,
            tipo: row.tipo || 'Sin tipo',
            displayTipo: row.tipo || 'Sin tipo',
            operationCategory: displayColumnType,
            salida_llegada: row.detalle || '',
            experiencias: row.detalle || '',
            casitas: row.casita ? [row.casita] : [],
            operationIds: [],
            idOperacionMemo: row.idOperacionMemo || '',
            fecha_update: row.fecha,
            linkedPuestoId: row.id,
            linkedPuestoRow: row,
            isManualPuesto: true,
            manualPendingMode,
            hasTourSalida: hasRealValue(row.horaSalida),
            hasTourIngreso: hasRealValue(row.horaIngreso),
            displayCasitas: displayCasitaLabel,
            casitasLabel: displayCasitaLabel,
            displaySummary: `Nombre: ${row.nombre || 'Sin nombre'}`,
            displayDetail: buildManualRowDetail(row),
            isHiddenByPuesto: false
          }
        })
    })

    const combinedOperations = computed(() => {
      return [...groupedOperations.value, ...manualPuestoOperations.value]
    })

    const pendingOperations = computed(() => {
      return combinedOperations.value.filter((operation) => {
        if (operation.isManualPuesto) {
          // Un Outside Guest está pendiente solo si YA entró pero AÚN NO ha salido
          if (isOutsideGuestType(operation.tipo)) {
            return hasRealValue(operation.linkedPuestoRow?.horaIngreso) && !hasRealValue(operation.linkedPuestoRow?.horaSalida)
          }
          // Un Tour/Experiencia está pendiente solo si AÚN NO ha re-ingresado
          if (isTourType(operation.tipo) || isSalidaHuespedType(operation.tipo)) {
            return !hasRealValue(operation.linkedPuestoRow?.horaIngreso)
          }
          return false
        }

        if (operation.isHiddenByPuesto) return false
        if (isTourType(operation.tipo) && operation.hasTourIngreso) return false
        return true
      })
    })

    const completedOperations = computed(() => {
      return combinedOperations.value.filter((operation) => {
        if (operation.isManualPuesto) {
          // Un Outside Guest está completado si YA entró y YA salió
          if (isOutsideGuestType(operation.tipo)) {
            return hasRealValue(operation.linkedPuestoRow?.horaIngreso) && hasRealValue(operation.linkedPuestoRow?.horaSalida)
          }
          // Un Tour/Experiencia está completado si YA re-ingresó
          if (isTourType(operation.tipo) || isSalidaHuespedType(operation.tipo)) {
            return hasRealValue(operation.linkedPuestoRow?.horaIngreso)
          }
          return true
        }

        if (operation.isHiddenByPuesto) return true
        if (isTourType(operation.tipo) && operation.hasTourIngreso) return true
        return false
      })
    })

    const activeOperationsCount = computed(() => {
      return activeTab.value === 'completados'
        ? completedOperations.value.length
        : pendingOperations.value.length
    })

    const currentBoardItems = computed(() => {
      if (searchScope.value === 'pendientes') return pendingOperations.value
      if (completadosDateMode.value === 'todos') return filteredAllPuesto.value
      return completedOperations.value
    })

    const scopeLabel = computed(() => {
      if (searchScope.value === 'pendientes') return 'Pendientes activos'
      if (completadosDateMode.value === 'todos') return 'Histórico completo'
      return `Completados ${selectedDate.value || ''}`.trim()
    })

    const heroStats = computed(() => ([
      {
        label: 'Pendientes',
        value: pendingOperations.value.length,
        meta: 'Cards pendientes'
      },
      {
        label: 'Experiencias',
        value: filteredByType('EXPERIENCIA', currentBoardItems.value).length,
        meta: 'Tours visibles'
      },
      {
        label: 'Check-In',
        value: filteredByType('CHECK-IN', currentBoardItems.value).length,
        meta: 'Entradas visibles'
      },
      {
        label: 'Check-Out',
        value: filteredByType('CHECK-OUT', currentBoardItems.value).length,
        meta: 'Salidas visibles'
      }
    ]))

    const filteredByType = (type, source = pendingOperations.value) => {
      const list = Array.isArray(source)
        ? source
        : (source?.value || [])

      const targetColumn = getDisplayColumnType({ tipo: type })
      return list.filter((operation) => getDisplayColumnType(operation) === targetColumn)
    }

    const filteredAllPuesto = computed(() => {
      const term = searchTerm.value.trim().toLowerCase()
      const rows = allPuestoRows.value
      if (!term) return rows
      return rows.filter((row) =>
        [row.nombre, row.casita, row.tipo, row.placa, row.colaboradorIngreso, row.fecha]
          .some((v) => String(v || '').toLowerCase().includes(term))
      )
    })

    const canSubmitCheckIn = computed(() => {
      const form = checkInForm.value
      const requiresCasita = !isOutsideGuestType(form.tipo)
      return Boolean(
        form.nombre.trim() &&
        form.horaIngreso.trim() &&
        form.oficial.trim() &&
        (!requiresCasita || form.casita.trim()) &&
        form.tipo.trim()
      )
    })

    const canSubmitCheckOut = computed(() => {
      const form = checkOutForm.value
      const isOutsideGuest = isOutsideGuestType(form.tipo)
      return Boolean(
        form.nombre.trim() &&
        form.horaSalida.trim() &&
        form.oficial.trim() &&
        (isOutsideGuest || form.casita.trim()) &&
        form.tipo.trim()
      )
    })

    const showMovementFormWrapper = computed(() => {
      return showManualMovementForm.value || showCheckInDialog.value || showCheckOutDialog.value
    })

    const manualTypeKey = computed(() => normalizeTypeKey(manualMovementForm.value.tipo))
    const manualRequiresColaborador = computed(() => {
      return ['CHECK IN', 'CHECK OUT', 'EXPERIENCIA', 'SALIDA HUESPED'].includes(manualTypeKey.value)
    })
    const manualRequiresDetalle = computed(() => {
      return ['EXPERIENCIA', 'OUTSIDE GUEST', 'SALIDA HUESPED'].includes(manualTypeKey.value)
    })
    const manualRequiresHoraIngreso = computed(() => {
      return ['CHECK IN', 'OUTSIDE GUEST'].includes(manualTypeKey.value)
    })
    const manualRequiresOficialIngreso = computed(() => manualRequiresHoraIngreso.value)
    const manualRequiresHoraSalida = computed(() => {
      return ['CHECK OUT', 'EXPERIENCIA', 'SALIDA HUESPED'].includes(manualTypeKey.value)
    })
    const manualRequiresOficialSalida = computed(() => manualRequiresHoraSalida.value)

    const canSubmitManualMovement = computed(() => {
      const form = manualMovementForm.value

      if (isEditMode.value) {
        return Boolean(
          form.tipo &&
          form.nombre.trim() &&
          (isOutsideGuestType(form.tipo) || form.casita.trim())
        )
      }

      if (!form.tipo || !form.nombre.trim()) return false
      if (form.tipo !== 'Outside Guest' && !form.casita.trim()) return false

      if (manualRequiresHoraIngreso.value && form.tipo !== 'EXPERIENCIA' && (!form.horaIngreso.trim() || !form.oficialIngreso.trim())) return false
      if (manualRequiresHoraSalida.value && (!form.horaSalida.trim() || !form.oficialSalida.trim())) return false

      return true
    })

    const isEditMode = ref(false)

    const checkOutDialogTitle = computed(() => {
      if (isEditMode.value) return 'Editar movimiento'
      if (checkOutDialogMode.value === 'tour') return 'Registrar salida tour'
      if (checkOutDialogMode.value === 'outside-guest-out') return 'Registrar salida'
      return 'Registrar Check out'
    })

    const checkOutSaveButtonLabel = computed(() => {
      if (isEditMode.value) return 'Actualizar'
      if (checkOutDialogMode.value === 'tour') return 'Guardar salida tour'
      if (checkOutDialogMode.value === 'outside-guest-out') return 'Guardar salida'
      return 'Guardar check out'
    })

    const checkInDialogTitle = computed(() => {
      if (isEditMode.value) return 'Editar movimiento'
      if (checkInDialogMode.value === 'tour-in') return 'Registrar ingreso tour'
      if (checkInDialogMode.value === 'guest-exit-in') return 'Registrar ingreso huesped'
      if (checkInDialogMode.value === 'outside-guest-in') return 'Registrar ingreso outside'
      return 'Registrar Check in'
    })

    const checkInSaveButtonLabel = computed(() => {
      if (isEditMode.value) return 'Actualizar'
      if (checkInDialogMode.value === 'tour-in') return 'Guardar ingreso tour'
      if (checkInDialogMode.value === 'guest-exit-in') return 'Guardar ingreso huesped'
      if (checkInDialogMode.value === 'outside-guest-in') return 'Guardar ingreso outside'
      return 'Guardar check in'
    })

    const showCheckOutDetailField = computed(() => {
      return checkOutDialogMode.value === 'tour' || checkOutDialogMode.value === 'outside-guest-out'
    })

    const activeInlineFormTitle = computed(() => {
      if (showManualMovementForm.value) return isEditMode.value ? 'Editar movimiento' : 'Ingresar movimiento'
      if (showCheckInDialog.value) return checkInDialogTitle.value
      if (showCheckOutDialog.value) return checkOutDialogTitle.value
      return 'Formulario'
    })

    const activeInlineFormCaption = computed(() => {
      if (showManualMovementForm.value) {
        return isEditMode.value
          ? 'Edita todos los campos disponibles de Puesto_01'
          : 'Registra un movimiento directamente en Puesto_01'
      }
      return `Casita ${selectedOperation.value?.casita || '-'}`
    })

    const fetchPuestoRows = async (dateValue) => {
      let data
      let error

      const upperQuery = await supabase
        .from('Puesto_01')
        .select('id, id_operacion_memo, Nombre, Casita, Tipo, Placa, Detalle, colaborador_ingreso, Hora_ingreso, Oficial_ingreso, Hora_salida, Oficial_salida, Fecha, fecha_update')
        .eq('Fecha', dateValue)
        .order('fecha_update', { ascending: false })

      data = upperQuery.data
      error = upperQuery.error

      if (error) {
        const lowerQuery = await supabase
          .from('puesto_01')
          .select('id, id_operacion_memo, nombre, casita, tipo, placa, detalle, colaborador_ingreso, hora_ingreso, oficial_ingreso, hora_salida, oficial_salida, fecha, fecha_update')
          .eq('fecha', dateValue)
          .order('fecha_update', { ascending: false })

        data = lowerQuery.data
        error = lowerQuery.error
      }

      if (error) throw error

      puestoRows.value = (data || []).map((row) => ({
        id: row.id,
        idOperacionMemo: row.id_operacion_memo || '',
        nombre: extractPuestoValue(row, 'Nombre', 'nombre'),
        casita: extractPuestoValue(row, 'Casita', 'casita'),
        tipo: extractPuestoValue(row, 'Tipo', 'tipo'),
        placa: extractPuestoValue(row, 'Placa', 'placa'),
        detalle: extractPuestoValue(row, 'Detalle', 'detalle'),
        colaboradorIngreso: row.colaborador_ingreso || '',
        horaIngreso: row.Hora_ingreso || row.hora_ingreso || '',
        oficialIngreso: row.Oficial_ingreso || row.oficial_ingreso || '',
        horaSalida: row.Hora_salida || row.hora_salida || '',
        oficialSalida: row.Oficial_salida || row.oficial_salida || '',
        fechaUpdate: row.fecha_update || ''
      }))
    }

    const fetchPuestoRowById = async (id) => {
      if (!id) return null
      try {
        let { data, error } = await supabase
          .from('Puesto_01')
          .select('id, id_operacion_memo, Nombre, Casita, Tipo, Placa, Detalle, colaborador_ingreso, Hora_ingreso, Oficial_ingreso, Hora_salida, Oficial_salida, Fecha, fecha_update')
          .eq('id', id)
          .limit(1)

        if (error || !data || data.length === 0) {
          const lower = await supabase
            .from('puesto_01')
            .select('id, id_operacion_memo, nombre, casita, tipo, placa, detalle, colaborador_ingreso, hora_ingreso, oficial_ingreso, hora_salida, oficial_salida, fecha, fecha_update')
            .eq('id', id)
            .limit(1)
          data = lower.data
          error = lower.error
        }

        if (error || !data || data.length === 0) return null

        const row = data[0]
        return {
          id: row.id,
          idOperacionMemo: row.id_operacion_memo || '',
          nombre: extractPuestoValue(row, 'Nombre', 'nombre'),
          casita: extractPuestoValue(row, 'Casita', 'casita'),
          tipo: extractPuestoValue(row, 'Tipo', 'tipo'),
          placa: extractPuestoValue(row, 'Placa', 'placa'),
          detalle: extractPuestoValue(row, 'Detalle', 'detalle'),
          colaboradorIngreso: row.colaborador_ingreso || '',
          horaIngreso: row.Hora_ingreso || row.hora_ingreso || '',
          oficialIngreso: row.Oficial_ingreso || row.oficial_ingreso || '',
          horaSalida: row.Hora_salida || row.hora_salida || '',
          oficialSalida: row.Oficial_salida || row.oficial_salida || '',
          fechaUpdate: row.fecha_update || ''
        }
      } catch (err) {
        console.error('Error fetching Puesto_01 row by id:', err)
        return null
      }
    }

    const fetchAllPuestoRows = async () => {
      loadingAll.value = true
      try {
        let { data, error } = await supabase
          .from('Puesto_01')
          .select('id, id_operacion_memo, Nombre, Casita, Tipo, Placa, Detalle, colaborador_ingreso, Hora_ingreso, Oficial_ingreso, Hora_salida, Oficial_salida, Fecha, fecha_update')
          .order('fecha_update', { ascending: false })
          .limit(2000)

        if (error) {
          const lower = await supabase
            .from('puesto_01')
            .select('id, id_operacion_memo, nombre, casita, tipo, placa, detalle, colaborador_ingreso, hora_ingreso, oficial_ingreso, hora_salida, oficial_salida, fecha, fecha_update')
            .order('fecha_update', { ascending: false })
            .limit(2000)
          data = lower.data
          error = lower.error
        }

        if (error) throw error

        allPuestoRows.value = (data || []).map((row) => ({
          id: row.id,
          idOperacionMemo: row.id_operacion_memo || '',
          nombre: extractPuestoValue(row, 'Nombre', 'nombre'),
          casita: extractPuestoValue(row, 'Casita', 'casita'),
          tipo: extractPuestoValue(row, 'Tipo', 'tipo'),
          placa: extractPuestoValue(row, 'Placa', 'placa'),
          detalle: extractPuestoValue(row, 'Detalle', 'detalle'),
          colaboradorIngreso: row.colaborador_ingreso || '',
          horaIngreso: row.Hora_ingreso || row.hora_ingreso || '',
          oficialIngreso: row.Oficial_ingreso || row.oficial_ingreso || '',
          horaSalida: row.Hora_salida || row.hora_salida || '',
          oficialSalida: row.Oficial_salida || row.oficial_salida || '',
          fecha: extractPuestoValue(row, 'Fecha', 'fecha'),
          fechaUpdate: row.fecha_update || ''
        }))
      } catch (err) {
        console.error('Error fetching all Puesto_01 rows:', err)
        $q.notify({ type: 'negative', message: 'No se pudieron cargar todos los registros' })
      } finally {
        loadingAll.value = false
      }
    }

    const fetchOperations = async () => {
      loading.value = true
      try {
        const targetDate = selectedDate.value || getLocalDateString()
        let { data, error } = await supabase
          .from('operaciones_memo')
          .select('id, casita, tipo, experiencias, salida_llegada, fecha_update, fecha')
          .order('fecha_update', { ascending: false })
          .limit(1000)

        if (error) {
          const fallback = await supabase
            .from('operaciones_memo')
            .select('id, casita, tipo, experiencias, "salida llegada", fecha_update, fecha')
            .order('fecha_update', { ascending: false })
            .limit(1000)

          if (!fallback.error) {
            data = (fallback.data || []).map((item) => ({
              ...item,
              salida_llegada: item.salida_llegada || item['salida llegada'] || ''
            }))
            error = null
          }
        }

        if (error) throw error

        // Use 'fecha' field if available (format "Sunday, April 12th"), 
        // fall back to 'fecha_update' if needed
        operations.value = (data || []).filter((item) => {
          const textDateISO = parseTextDateToISO(item.fecha)
          const dateToCompare = textDateISO || normalizeDateOnly(item.fecha_update)
          return dateToCompare === targetDate
        })
        await fetchPuestoRows(targetDate)
      } catch (err) {
        console.error('Error fetching operaciones_memo:', err)
        $q.notify({
          type: 'negative',
          message: 'No se pudieron cargar las operaciones del día'
        })
      } finally {
        loading.value = false
      }
    }

    const openCheckInDialog = (operation) => {
      closeAllInlineForms()
      selectedOperation.value = operation
      const casitaValue = operation.casita || ''
      const resolvedTipo = resolveCheckInType(casitaValue)
      checkInDialogMode.value = resolvedTipo === 'Outside Guest' ? 'outside-guest-in' : 'checkin'
      checkInForm.value = {
        ...createEmptyCheckInForm(),
        nombre: operation.linkedPuestoId ? extractPuestoValue(operation.linkedPuestoRow || {}, 'Nombre', 'nombre') : '',
        colaborador: resolvedTipo === 'Outside Guest' ? '' : (operation.linkedPuestoRow?.colaboradorIngreso || ''),
        placa: operation.linkedPuestoId ? extractPuestoValue(operation.linkedPuestoRow || {}, 'Placa', 'placa') : '',
        detalle: resolvedTipo === 'Outside Guest' ? (operation.experiencias || operation.displayDetail || '') : (operation.linkedPuestoRow?.detalle || ''),
        horaIngreso: operation.linkedPuestoRow?.horaIngreso || '',
        oficial: operation.linkedPuestoRow?.oficialIngreso || authStore.user?.Usuario || '',
        casita: casitaValue,
        tipo: resolvedTipo
      }
      showCheckInDialog.value = true
      revealInlineForm()
    }

    const openTourInDialog = (operation) => {
      closeAllInlineForms()
      selectedOperation.value = operation
      checkInDialogMode.value = 'tour-in'
      checkInForm.value = {
        ...createEmptyCheckInForm(),
        nombre: operation.linkedPuestoRow?.nombre || '',
        colaborador: operation.linkedPuestoRow?.colaboradorIngreso || '',
        placa: operation.linkedPuestoRow?.placa || '',
        horaIngreso: '',
        oficial: authStore.user?.Usuario || '',
        casita: operation.casita || '',
        tipo: operation.tipo || 'EXPERIENCIA'
      }
      showCheckInDialog.value = true
      revealInlineForm()
    }

    const openGuestExitInDialog = (operation) => {
      closeAllInlineForms()
      selectedOperation.value = operation
      checkInDialogMode.value = 'guest-exit-in'
      checkInForm.value = {
        ...createEmptyCheckInForm(),
        nombre: operation.linkedPuestoRow?.nombre || '',
        colaborador: operation.linkedPuestoRow?.colaboradorIngreso || '',
        placa: operation.linkedPuestoRow?.placa || '',
        horaIngreso: operation.linkedPuestoRow?.horaIngreso || '',
        oficial: operation.linkedPuestoRow?.oficialIngreso || authStore.user?.Usuario || '',
        casita: operation.linkedPuestoRow?.casita || operation.casita || '',
        tipo: operation.tipo || 'Salida huesped'
      }
      showCheckInDialog.value = true
      revealInlineForm()
    }

    const openCheckOutDialog = (operation, mode = 'checkout') => {
      closeAllInlineForms()
      selectedOperation.value = operation
      checkOutDialogMode.value = mode
      checkOutForm.value = {
        ...createEmptyCheckOutForm(),
        casita: operation.linkedPuestoRow?.casita || operation.casita || '',
        tipo: operation.tipo || (mode === 'tour' ? 'EXPERIENCIA' : 'CHECK-OUT'),
        nombre: operation.linkedPuestoRow?.nombre || '',
        colaborador: operation.linkedPuestoRow?.colaboradorIngreso || '',
        placa: operation.linkedPuestoRow?.placa || '',
        detalle: operation.experiencias || ''
      }
      showCheckOutDialog.value = true
      revealInlineForm()
    }

    const openGroupCheckIn = (group) => {
      if (!group) return
      const casitaConcat = Array.isArray(group.casitas) && group.casitas.length > 0
        ? group.casitas.join(',')
        : (group.baseOperation?.casita || '')
      const resolvedTipo = resolveCheckInType(casitaConcat)
      const op = {
        ...group.baseOperation,
        casita: casitaConcat,
        tipo: resolvedTipo,
        id_operacion_memo: group.idOperacionMemo || group.baseOperation?.id || '',
        linkedPuestoId: group.linkedPuestoId || null,
        linkedPuestoRow: group.linkedPuestoId
          ? puestoRows.value.find((row) => row.id === group.linkedPuestoId) || null
          : null
      }
      openCheckInDialog(op)
    }

    const openGroupCheckOut = (group) => {
      if (!group) return
      const casitaConcat = Array.isArray(group.casitas) && group.casitas.length > 0
        ? group.casitas.join(',')
        : (group.baseOperation?.casita || '')
      const op = {
        ...group.baseOperation,
        casita: casitaConcat,
        id_operacion_memo: group.idOperacionMemo || group.baseOperation?.id || ''
      }
      openCheckOutDialog(op, 'checkout')
    }

    const openGroupTourIn = (group) => {
      if (!group) return
      const casitaConcat = Array.isArray(group.casitas) && group.casitas.length > 0
        ? group.casitas.join(',')
        : (group.baseOperation?.casita || '')
      const op = {
        ...group.baseOperation,
        casita: casitaConcat,
        id_operacion_memo: group.idOperacionMemo || group.baseOperation?.id || '',
        linkedPuestoId: group.linkedPuestoId || null,
        linkedPuestoRow: group.linkedPuestoId
          ? puestoRows.value.find((row) => row.id === group.linkedPuestoId) || null
          : null
      }
      openTourInDialog(op)
    }

    const openGroupTourOut = (group) => {
      if (!group) return
      const casitaConcat = Array.isArray(group.casitas) && group.casitas.length > 0
        ? group.casitas.join(',')
        : (group.baseOperation?.casita || '')
      const op = {
        ...group.baseOperation,
        casita: casitaConcat,
        id_operacion_memo: group.idOperacionMemo || group.baseOperation?.id || '',
        linkedPuestoId: group.linkedPuestoId || null,
        linkedPuestoRow: group.linkedPuestoId
          ? puestoRows.value.find((row) => row.id === group.linkedPuestoId) || null
          : null
      }
      openCheckOutDialog(op, 'tour')
      // Pre-fill official for tour out
      checkOutForm.value.oficial = authStore.user?.Usuario || ''
    }

    const openManualOutsideGuestOut = (group) => {
      if (!group?.linkedPuestoRow) return
      openCheckOutDialog({
        ...group,
        casita: group.linkedPuestoRow.casita,
        experiencias: group.linkedPuestoRow.detalle || ''
      }, 'outside-guest-out')
    }

    const getTourButtonLabel = (operation) => {
      if (operation?.manualPendingMode === 'guest-exit-in') return 'Registrar ingreso huesped'
      return operation?.hasTourSalida ? 'Registrar ingreso tour' : 'Registrar salida tour'
    }

    const handleTourAction = (operation) => {
      if (operation?.manualPendingMode === 'guest-exit-in') {
        openGuestExitInDialog(operation)
        return
      }
      if (operation?.hasTourSalida) {
        openGroupTourIn(operation)
        return
      }
      openGroupTourOut(operation)
    }

    const getCheckOutButtonLabel = (operation) => {
      if (operation?.manualPendingMode === 'outside-guest-out') return 'Registrar salida'
      return 'Registrar Check out'
    }

    const getCheckInButtonLabel = (operation) => {
      if (isOutsideGuestMemoOperation(operation)) return 'Registrar ingreso outside'
      return 'Registrar Check in'
    }

    const handleCheckInAction = (operation) => {
      openGroupCheckIn(operation)
    }

    const handleCheckOutAction = (operation) => {
      if (operation?.manualPendingMode === 'outside-guest-out') {
        openManualOutsideGuestOut(operation)
        return
      }
      openGroupCheckOut(operation)
    }

    const closeCheckInDialog = () => {
      closeAllInlineForms()
    }

    const closeCheckOutDialog = () => {
      closeAllInlineForms()
    }

    const buildInsertPayload = () => {
      const targetDate = selectedDate.value || getLocalDateString()
      const form = checkInForm.value
      const isOutsideGuest = isOutsideGuestType(form.tipo)

      return {
        Nombre: form.nombre.trim(),
        Casita: isOutsideGuest ? '' : form.casita.trim(),
        Tipo: form.tipo.trim(),
        Placa: form.placa.trim(),
        colaborador_ingreso: form.colaborador.trim(),
        Hora_ingreso: form.horaIngreso.trim(),
        Oficial_ingreso: form.oficial.trim(),
        Hora_salida: isOutsideGuest ? '' : 'X',
        Detalle: form.detalle ? form.detalle.trim() : '',
        id_operacion_memo: isOutsideGuest ? '' : (selectedOperation.value?.id_operacion_memo || selectedOperation.value?.id || ''),
        Fecha: targetDate,
        fecha_update: getLocalFullDateTimeString()
      }
    }

    const buildLowercaseInsertPayload = () => {
      const form = checkInForm.value
      const targetDate = selectedDate.value || getLocalDateString()
      const isOutsideGuest = isOutsideGuestType(form.tipo)

      return {
        nombre: form.nombre.trim(),
        casita: isOutsideGuest ? '' : form.casita.trim(),
        tipo: form.tipo.trim(),
        placa: form.placa.trim(),
        colaborador_ingreso: form.colaborador.trim(),
        hora_ingreso: form.horaIngreso.trim(),
        oficial_ingreso: form.oficial.trim(),
        hora_salida: isOutsideGuest ? '' : 'X',
        detalle: form.detalle ? form.detalle.trim() : '',
        id_operacion_memo: isOutsideGuest ? '' : (selectedOperation.value?.id_operacion_memo || selectedOperation.value?.id || ''),
        fecha: targetDate,
        fecha_update: getLocalFullDateTimeString()
      }
    }

    const buildCheckInUpdatePayload = () => {
      const form = checkInForm.value
      const isOutsideGuest = isOutsideGuestType(form.tipo)

      const payload = {
        Tipo: isOutsideGuest ? 'Outside Guest' : form.tipo.trim(),
        Hora_ingreso: form.horaIngreso.trim(),
        Oficial_ingreso: form.oficial.trim(),
        fecha_update: getLocalFullDateTimeString()
      }
 
      if (isEditMode.value) {
        payload.Nombre = form.nombre.trim()
        payload.Casita = isOutsideGuest ? '' : form.casita.trim()
        payload.Placa = form.placa.trim()
        payload.colaborador_ingreso = form.colaborador.trim()
      }
 
      if (isEditMode.value && isOutsideGuest) {
        payload.Detalle = form.detalle ? form.detalle.trim() : ''
      }
 
      return payload
    }
 
    const buildCheckInLowercaseUpdatePayload = () => {
      const form = checkInForm.value
      const isOutsideGuest = isOutsideGuestType(form.tipo)
 
      const payload = {
        tipo: isOutsideGuest ? 'Outside Guest' : form.tipo.trim(),
        hora_ingreso: form.horaIngreso.trim(),
        oficial_ingreso: form.oficial.trim(),
        fecha_update: getLocalFullDateTimeString()
      }
 
      if (isEditMode.value) {
        payload.nombre = form.nombre.trim()
        payload.casita = isOutsideGuest ? '' : form.casita.trim()
        payload.placa = form.placa.trim()
        payload.colaborador_ingreso = form.colaborador.trim()
      }
 
      if (isEditMode.value && isOutsideGuest) {
        payload.detalle = form.detalle ? form.detalle.trim() : ''
      }
 
      return payload
    }
 
    const buildCheckOutInsertPayload = () => {
      const targetDate = selectedDate.value || getLocalDateString()
      const form = checkOutForm.value

      return {
        Nombre: form.nombre.trim(),
        Casita: form.casita.trim(),
        Tipo: form.tipo.trim(),
        Placa: form.placa.trim(),
        colaborador_ingreso: form.colaborador.trim(),
        Hora_ingreso: 'X',
        Oficial_ingreso: 'X',
        Hora_salida: form.horaSalida.trim(),
        Oficial_salida: form.oficial.trim(),
        Detalle: form.detalle ? form.detalle.trim() : '',
        id_operacion_memo: selectedOperation.value?.id_operacion_memo || selectedOperation.value?.id || '',
        Fecha: targetDate,
        fecha_update: getLocalFullDateTimeString()
      }
    }

    const buildCheckOutUpdatePayload = () => {
      const form = checkOutForm.value

      const payload = {
        Hora_salida: form.horaSalida.trim(),
        Oficial_salida: form.oficial.trim(),
        fecha_update: getLocalFullDateTimeString()
      }

      if (isEditMode.value) {
        payload.Nombre = form.nombre.trim()
        payload.Casita = form.casita.trim()
        payload.Placa = form.placa.trim()
        payload.colaborador_ingreso = form.colaborador.trim()
      }

      const isTourOrOutside = checkOutDialogMode.value === 'tour' || checkOutDialogMode.value === 'outside-guest-out'
      if ((isTourOrOutside || isEditMode.value) && form.detalle) {
        payload.Detalle = form.detalle.trim()
      }

      return payload
    }

    const buildCheckOutLowercaseInsertPayload = () => {
      const form = checkOutForm.value
      const targetDate = selectedDate.value || getLocalDateString()

      return {
        nombre: form.nombre.trim(),
        casita: form.casita.trim(),
        tipo: form.tipo.trim(),
        placa: form.placa.trim(),
        colaborador_ingreso: form.colaborador.trim(),
        hora_ingreso: 'X',
        oficial_ingreso: 'X',
        hora_salida: form.horaSalida.trim(),
        oficial_salida: form.oficial.trim(),
        detalle: form.detalle ? form.detalle.trim() : '',
        id_operacion_memo: selectedOperation.value?.id_operacion_memo || selectedOperation.value?.id || '',
        fecha: targetDate,
        fecha_update: getLocalFullDateTimeString()
      }
    }

    const buildCheckOutLowercaseUpdatePayload = () => {
      const form = checkOutForm.value

      const payload = {
        hora_salida: form.horaSalida.trim(),
        oficial_salida: form.oficial.trim(),
        fecha_update: getLocalFullDateTimeString()
      }

      if (isEditMode.value) {
        payload.nombre = form.nombre.trim()
        payload.casita = form.casita.trim()
        payload.placa = form.placa.trim()
        payload.colaborador_ingreso = form.colaborador.trim()
      }

      const isTourOrOutside = checkOutDialogMode.value === 'tour' || checkOutDialogMode.value === 'outside-guest-out'
      if ((isTourOrOutside || isEditMode.value) && form.detalle) {
        payload.detalle = form.detalle.trim()
      }

      return payload
    }

    const buildManualInsertPayload = () => {
      const form = manualMovementForm.value
      const targetDate = selectedDate.value || getLocalDateString()
      const typeKey = manualTypeKey.value

      const payload = {
        Nombre: form.nombre.trim(),
        Casita: typeKey === 'OUTSIDE GUEST' ? '' : form.casita.trim(),
        Tipo: form.tipo.trim(),
        Placa: form.placa.trim(),
        colaborador_ingreso: form.colaborador.trim(),
        Oficial_ingreso: '',
        Hora_ingreso: 'X',
        Hora_salida: 'X',
        Oficial_salida: '',
        Detalle: form.detalle.trim(),
        id_operacion_memo: '',
        Fecha: targetDate,
        fecha_update: getLocalFullDateTimeString()
      }

      if ((typeKey === 'CHECK IN' || typeKey === 'OUTSIDE GUEST') && typeKey !== 'EXPERIENCIA') {
        payload.Hora_ingreso = form.horaIngreso.trim()
        payload.Oficial_ingreso = form.oficialIngreso.trim()
      }

      if (['CHECK OUT', 'EXPERIENCIA', 'SALIDA HUESPED'].includes(typeKey)) {
        payload.Hora_salida = form.horaSalida.trim()
        payload.Oficial_salida = form.oficialSalida.trim()
      }

      return payload
    }

    const buildManualLowercaseInsertPayload = () => {
      const payload = buildManualInsertPayload()
      return {
        nombre: payload.Nombre,
        casita: payload.Casita,
        tipo: payload.Tipo,
        placa: payload.Placa,
        colaborador_ingreso: payload.colaborador_ingreso,
        oficial_ingreso: payload.Oficial_ingreso,
        hora_ingreso: payload.Hora_ingreso,
        hora_salida: payload.Hora_salida,
        oficial_salida: payload.Oficial_salida,
        detalle: payload.Detalle,
        id_operacion_memo: payload.id_operacion_memo,
        fecha: payload.Fecha,
        fecha_update: payload.fecha_update
      }
    }

    const buildManualUpdatePayload = () => {
      const form = manualMovementForm.value
      const isOutsideGuest = isOutsideGuestType(form.tipo)

      return {
        Nombre: form.nombre.trim(),
        Casita: isOutsideGuest ? '' : form.casita.trim(),
        Tipo: form.tipo.trim(),
        Placa: form.placa.trim(),
        colaborador_ingreso: form.colaborador.trim(),
        Hora_ingreso: form.horaIngreso.trim(),
        Oficial_ingreso: form.oficialIngreso.trim(),
        Hora_salida: form.horaSalida.trim(),
        Oficial_salida: form.oficialSalida.trim(),
        Detalle: form.detalle.trim(),
        fecha_update: getLocalFullDateTimeString()
      }
    }

    const buildManualLowercaseUpdatePayload = () => {
      const payload = buildManualUpdatePayload()
      return {
        nombre: payload.Nombre,
        casita: payload.Casita,
        tipo: payload.Tipo,
        placa: payload.Placa,
        colaborador_ingreso: payload.colaborador_ingreso,
        hora_ingreso: payload.Hora_ingreso,
        oficial_ingreso: payload.Oficial_ingreso,
        hora_salida: payload.Hora_salida,
        oficial_salida: payload.Oficial_salida,
        detalle: payload.Detalle,
        fecha_update: payload.fecha_update
      }
    }

    const saveManualMovement = async () => {
      if (!canSubmitManualMovement.value) return

      saving.value = true
      try {
        let result

        if (isEditMode.value) {
          const targetId = selectedOperation.value?.linkedPuestoId || selectedOperation.value?.linkedPuestoRow?.id || selectedOperation.value?.id

          if (!targetId) {
            throw new Error('No se encontró el id del registro para editar')
          }

          result = await supabase
            .from('Puesto_01')
            .update(buildManualUpdatePayload())
            .eq('id', targetId)

          if (result.error) {
            result = await supabase
              .from('puesto_01')
              .update(buildManualLowercaseUpdatePayload())
              .eq('id', targetId)
          }
        } else {
          result = await supabase.from('Puesto_01').insert(buildManualInsertPayload())
          if (result.error) {
            result = await supabase.from('puesto_01').insert(buildManualLowercaseInsertPayload())
          }
        }

        if (result.error) throw result.error

        $q.notify({
          type: 'positive',
          message: isEditMode.value ? 'Registro actualizado en Puesto_01' : 'Movimiento registrado en Puesto_01'
        })

        await fetchOperations()
        if (completadosDateMode.value === 'todos') {
          await fetchAllPuestoRows()
        }
        closeAllInlineForms()
      } catch (err) {
        console.error('Error saving manual movement in Puesto_01:', err)
        $q.notify({
          type: 'negative',
          message: isEditMode.value ? 'No se pudo actualizar el registro en Puesto_01' : 'No se pudo guardar el movimiento en Puesto_01'
        })
      } finally {
        saving.value = false
      }
    }

    const saveCheckIn = async () => {
      if (!canSubmitCheckIn.value) return

      saving.value = true
      try {
        const isGuestExitIn = checkInDialogMode.value === 'guest-exit-in'
        const shouldUpdateTourRow = (checkInDialogMode.value === 'tour-in' || isGuestExitIn || isEditMode.value) && Boolean(selectedOperation.value?.linkedPuestoId)
        let result

        if (shouldUpdateTourRow) {
          result = await supabase
            .from('Puesto_01')
            .update(buildCheckInUpdatePayload())
            .eq('id', selectedOperation.value.linkedPuestoId)

          if (result.error) {
            result = await supabase
              .from('puesto_01')
              .update(buildCheckInLowercaseUpdatePayload())
              .eq('id', selectedOperation.value.linkedPuestoId)
          }
        } else {
          result = await supabase.from('Puesto_01').insert(buildInsertPayload())
          if (result.error) {
            result = await supabase.from('puesto_01').insert(buildLowercaseInsertPayload())
          }
        }

        if (result.error) throw result.error

        $q.notify({
          type: 'positive',
          message: isEditMode.value
            ? 'Registro actualizado en Puesto_01'
            : shouldUpdateTourRow
              ? (isGuestExitIn ? 'Ingreso huesped actualizado en Puesto_01' : 'Ingreso tour actualizado en Puesto_01')
              : checkInDialogMode.value === 'outside-guest-in'
                ? 'Ingreso outside registrado en Puesto_01'
                : 'Check in registrado en Puesto_01'
        })

        await fetchOperations()
        closeAllInlineForms()
      } catch (err) {
        console.error('Error saving CHECK-IN in Puesto_01:', err)
        $q.notify({
          type: 'negative',
          message: isEditMode.value
            ? 'No se pudo actualizar el registro'
            : checkInDialogMode.value === 'guest-exit-in'
              ? 'No se pudo guardar el ingreso huesped en Puesto_01'
              : checkInDialogMode.value === 'outside-guest-in'
                ? 'No se pudo guardar el ingreso outside en Puesto_01'
              : 'No se pudo guardar el check in en Puesto_01'
        })
      } finally {
        saving.value = false
      }
    }

    const saveCheckOut = async () => {
      if (!canSubmitCheckOut.value) return

      saving.value = true
      try {
        const isTourOrOutside = checkOutDialogMode.value === 'tour' || checkOutDialogMode.value === 'outside-guest-out'
        const shouldUpdateTourOutRow = (isTourOrOutside || isEditMode.value) && Boolean(selectedOperation.value?.linkedPuestoId)
        let result

        if (shouldUpdateTourOutRow) {
          result = await supabase
            .from('Puesto_01')
            .update(buildCheckOutUpdatePayload())
            .eq('id', selectedOperation.value.linkedPuestoId)

          if (result.error) {
            result = await supabase
              .from('puesto_01')
              .update(buildCheckOutLowercaseUpdatePayload())
              .eq('id', selectedOperation.value.linkedPuestoId)
          }
        } else {
          result = await supabase.from('Puesto_01').insert(buildCheckOutInsertPayload())
          if (result.error) {
            result = await supabase.from('puesto_01').insert(buildCheckOutLowercaseInsertPayload())
          }
        }

        if (result.error) throw result.error

        $q.notify({
          type: 'positive',
          message: isEditMode.value
            ? 'Registro actualizado en Puesto_01'
            : checkOutDialogMode.value === 'tour'
              ? 'Salida tour registrada en Puesto_01'
              : checkOutDialogMode.value === 'outside-guest-out'
                ? 'Salida registrada en Puesto_01'
              : 'Check out registrado en Puesto_01'
        })

        await fetchOperations()
        closeAllInlineForms()
      } catch (err) {
        console.error('Error saving CHECK-OUT in Puesto_01:', err)
        $q.notify({
          type: 'negative',
          message: isEditMode.value
            ? 'No se pudo actualizar el registro'
            : checkOutDialogMode.value === 'tour'
              ? 'No se pudo guardar la salida tour en Puesto_01'
              : checkOutDialogMode.value === 'outside-guest-out'
                ? 'No se pudo guardar la salida en Puesto_01'
              : 'No se pudo guardar el check out en Puesto_01'
        })
      } finally {
        saving.value = false
      }
    }

    watch(selectedDate, () => {
      fetchOperations()
    })

    watch(searchScope, (val) => {
      activeTab.value = val === 'completados' ? 'completados' : 'pendientes'
      if (val === 'completados' && completadosDateMode.value === 'todos' && allPuestoRows.value.length === 0) {
        fetchAllPuestoRows()
      }
    })

    watch(completadosDateMode, (val) => {
      if (val === 'todos' && allPuestoRows.value.length === 0) {
        fetchAllPuestoRows()
      }
    })

    onMounted(() => {
      fetchOperations()

      // Escucha de cambios en tiempo real para Puesto_01
      supabase
        .channel('puesto-01-local-updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'Puesto_01' },
          () => {
            fetchOperations()
            if (completadosDateMode.value === 'todos') {
              fetchAllPuestoRows()
            }
          }
        )
        .subscribe()

      // Escucha de cambios en tiempo real para operaciones_memo
      supabase
        .channel('operaciones-memo-local-updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'operaciones_memo' },
          () => fetchOperations()
        )
        .subscribe()
    })

    return {
      authStore,
      $q,
      router,
      loading,
      saving,
      selectedDate,
      activeTab,
      searchScope,
      completadosDateMode,
      scopeLabel,
      heroStats,
      filteredAllPuesto,
      loadingAll,
      activeOperationsCount,
      searchTerm,
      filteredOperations,
      groupedOperations,
      pendingOperations,
      completedOperations,
      filteredByType,
      getTypeColor,
      isCheckIn,
      isExperience,
      formatDateTime,
      showCheckInDialog,
      showCheckOutDialog,
      showManualMovementForm,
      showMovementFormWrapper,
      movementFormRef,
      selectedOperation,
      checkInForm,
      checkOutForm,
      manualMovementForm,
      manualMovementTypes,
      canSubmitCheckIn,
      canSubmitCheckOut,
      canSubmitManualMovement,
      isEditMode,
      manualRequiresColaborador,
      manualRequiresDetalle,
      manualRequiresHoraIngreso,
      manualRequiresOficialIngreso,
      manualRequiresHoraSalida,
      manualRequiresOficialSalida,
      checkInDialogTitle,
      checkInSaveButtonLabel,
      checkOutDialogTitle,
      checkOutSaveButtonLabel,
      showCheckOutDetailField,
      activeInlineFormTitle,
      activeInlineFormCaption,
      openCheckInDialog,
      openGroupCheckIn,
      openGroupCheckOut,
      openGroupTourIn,
      openGroupTourOut,
      openManualMovementForm,
      getCheckInButtonLabel,
      getTourButtonLabel,
      handleCheckInAction,
      getCheckOutButtonLabel,
      handleTourAction,
      handleCheckOutAction,
      isTourType,
      isOutsideGuestType,
      closeCheckInDialog,
      closeCheckOutDialog,
      closeAllInlineForms,
      saveCheckIn,
      saveCheckOut,
      saveManualMovement,
      getLocalDateString,
      openEditDialog
    }
  }
})
</script>

<style scoped>
.puesto01-page {
  background:
    radial-gradient(circle at top left, rgba(0, 0, 0, 0.08), transparent 30%),
    linear-gradient(180deg, #f1f0eb 0%, #ffffff 24%, #f6f5f1 100%);
  color: var(--uber-black);
  font-family: var(--uber-font-body);
  min-height: 100vh;
}

.puesto01-shell {
  max-width: 1440px;
  margin: 0 auto;
}

.puesto01-hero {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0)),
    #0b0b0b;
  color: var(--uber-white);
  border-radius: 28px;
  padding: 16px 18px;
  box-shadow: var(--uber-shadow-medium);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.puesto01-hero__topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.puesto01-back-btn {
  background: rgba(255, 255, 255, 0.1);
  color: var(--uber-white);
}

.puesto01-hero__eyebrow,
.puesto01-hero__kicker,
.puesto01-command-card__eyebrow,
.puesto01-stat-card__label,
.puesto01-panel-tag {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 10px;
  font-weight: 700;
}

.puesto01-hero__eyebrow,
.puesto01-hero__kicker {
  color: rgba(255, 255, 255, 0.62);
}

.puesto01-hero__count {
  margin-left: auto;
  min-width: 48px;
  padding: 6px 12px;
  border-radius: var(--uber-radius-pill);
  background: var(--uber-white);
  color: var(--uber-black);
  font-family: var(--uber-font-display);
  font-size: 16px;
  font-weight: 700;
  text-align: center;
}

.puesto01-hero__content {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.95fr);
  gap: 18px;
}

.puesto01-hero__title,
.puesto01-command-card__title,
.column-title {
  font-family: var(--uber-font-display);
}

.puesto01-hero__title {
  margin: 8px 0 0;
  font-size: clamp(1.95rem, 3.2vw, 3.1rem);
  line-height: 0.96;
}

.puesto01-hero__description {
  max-width: 52ch;
  margin: 12px 0 0;
  color: rgba(255, 255, 255, 0.68);
  font-size: 0.94rem;
  line-height: 1.65;
}

.puesto01-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.puesto01-primary-btn,
.puesto01-fab {
  background: var(--uber-white) !important;
  color: var(--uber-black) !important;
  font-weight: 700;
}

.puesto01-secondary-btn {
  background: rgba(255, 255, 255, 0.08);
  color: var(--uber-white);
  font-weight: 700;
}

.puesto01-hero__stats {
  display: grid;
  gap: 10px;
}

.puesto01-stat-card {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 14px;
}

.puesto01-stat-card__label {
  color: rgba(255, 255, 255, 0.58);
}

.puesto01-stat-card__value {
  margin-top: 8px;
  font-family: var(--uber-font-display);
  font-size: clamp(1.7rem, 3vw, 2.35rem);
  font-weight: 700;
  line-height: 1;
}

.puesto01-stat-card__meta {
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 12px;
}

.puesto01-command-card {
  background: var(--uber-surface);
  border: 1px solid rgba(15, 15, 15, 0.08);
  border-radius: 28px;
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(14px);
  padding: 22px;
}

.puesto01-command-card__header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 12px;
}

.puesto01-command-card__eyebrow {
  color: #717171;
  margin-bottom: 8px;
}

.puesto01-command-card__title {
  font-size: 1.35rem;
  line-height: 1.08;
}

.puesto01-panel-tag {
  flex-shrink: 0;
  padding: 10px 16px;
  border-radius: var(--uber-radius-pill);
  background: var(--uber-black);
  color: var(--uber-white);
}

.puesto01-toggle-group {
  width: 100%;
}

.puesto01-toggle-group :deep(.q-btn-group) {
  width: 100%;
  gap: 8px;
  flex-wrap: wrap;
}

.puesto01-toggle-group :deep(.q-btn) {
  flex: 1 1 auto;
  min-height: 44px;
  border-radius: var(--uber-radius-pill) !important;
  background: var(--uber-chip-gray);
  color: #111111;
  font-weight: 700;
  border: 1px solid #dedede;
}

.puesto01-toggle-group :deep(.q-btn--active) {
  background: var(--uber-black) !important;
  color: var(--uber-white) !important;
  border-color: var(--uber-black) !important;
}

.puesto01-date-input :deep(.q-field__control),
.puesto01-search-input :deep(.q-field__control),
.movement-form-card :deep(.q-field__control) {
  border-radius: 18px;
  min-height: 54px;
  background: var(--uber-white);
}

.movement-form-card {
  border-radius: 24px;
  border: 1px solid rgba(15, 15, 15, 0.08);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.12);
  background: var(--uber-white);
}

.operations-grid {
  display: grid;
  grid-template-columns: 1.45fr 1fr 1fr;
  gap: 24px;
}

.operations-column {
  display: flex;
  flex-direction: column;
  min-height: 400px;
  background: rgba(255, 255, 255, 0.52);
  border-radius: 28px;
  padding: 16px;
  border: 1px solid rgba(15, 15, 15, 0.06);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
}

.column-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 18px;
  margin-bottom: 16px;
  background: var(--uber-black);
  color: var(--uber-white);
}

.column-title {
  font-size: 1.15rem;
  line-height: 1;
}

.column-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  padding: 4px;
}

.operation-card {
  background: var(--uber-white);
  border-radius: 22px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.07);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  border: 1px solid rgba(15, 15, 15, 0.08);
}

.operation-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.1);
}

.casitas-list {
  line-height: 1.12;
  white-space: normal;
  word-break: break-word;
  color: var(--uber-black);
  font-size: 1.2rem;
  letter-spacing: -0.03em;
}

:deep(.q-badge) {
  padding: 6px 10px;
  font-weight: 700;
  font-size: 12px;
  border-radius: 12px;
}

.experience-block {
  padding: 16px;
  border-radius: 18px;
  background: rgba(242, 242, 239, 0.9);
  border: 1px solid rgba(15, 15, 15, 0.06);
}

.experience-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.info-section-exit,
.info-section-entry {
  border-radius: 14px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.7);
}

.empty-state {
  text-align: center;
  padding: 72px 16px;
}

.puesto01-fab {
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.2);
}

@media (min-width: 1025px) {
  .column-cards {
    overflow-y: auto;
    max-height: 70vh;
    padding-right: 8px;
  }

  .column-cards::-webkit-scrollbar {
    width: 6px;
  }

  .column-cards::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.18);
    border-radius: 10px;
  }
}

@media (max-width: 1023px) {
  .puesto01-hero__content,
  .operations-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .experience-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 599px) {
  .puesto01-hero,
  .puesto01-command-card,
  .movement-form-card,
  .operations-column,
  .operation-card {
    border-radius: 24px;
  }

  .puesto01-hero {
    padding: 12px 14px;
  }

  .puesto01-hero__topbar {
    margin-bottom: 12px;
  }

  .puesto01-hero__title {
    font-size: 2rem;
  }

  .puesto01-hero__description {
    margin-top: 10px;
    font-size: 0.88rem;
  }

  .puesto01-hero__stats {
    display: flex;
    overflow-x: auto;
    gap: 8px;
    padding-bottom: 4px;
    scrollbar-width: none;
  }

  .puesto01-hero__stats::-webkit-scrollbar {
    display: none;
  }

  .puesto01-stat-card {
    min-width: 148px;
    padding: 12px;
  }

  .puesto01-command-card__header {
    flex-direction: column;
  }
}
</style>

<template>
  <q-page class="qn-page">
    <transition name="qn-sticky">
      <div v-if="stickyShow && (enVivo || proximo)" class="qn-sticky" :style="{ top: headerH + 'px' }" @click="scrollTop">
        <template v-if="enVivo">
          <span class="qn-live-dot"></span>
          <img v-if="enVivo.equipo_local_logo" :src="enVivo.equipo_local_logo" class="qn-sticky-flag" alt="" />
          <span class="qn-sticky-team ellipsis">{{ enVivo.equipo_local }}</span>
          <b class="qn-sticky-score">{{ enVivo.goles_local ?? 0 }} - {{ enVivo.goles_visita ?? 0 }}</b>
          <span class="qn-sticky-team ellipsis qn-sticky-team-r">{{ enVivo.equipo_visita }}</span>
          <img v-if="enVivo.equipo_visita_logo" :src="enVivo.equipo_visita_logo" class="qn-sticky-flag" alt="" />
          <span class="qn-sticky-min">{{ estadoTexto(enVivo) }}</span>
        </template>
        <template v-else-if="proximo">
          <q-icon name="schedule" size="16px" class="q-mr-xs" />
          <span class="qn-sticky-team ellipsis">{{ proximo.m.equipo_local }}</span>
          <span class="qn-sticky-vs">vs</span>
          <span class="qn-sticky-team ellipsis qn-sticky-team-r">{{ proximo.m.equipo_visita }}</span>
          <span class="qn-sticky-count">{{ cuenta }}</span>
        </template>
      </div>
    </transition>

    <q-pull-to-refresh @refresh="onRefresh" color="green-8" bg-color="white">
    <div class="qn-banner">
      <img
        src="/images/quiniela-mundial-2026-hero.jpg"
        alt="Quiniela Mundial 2026 - Altagracia"
        class="qn-banner-image"
        width="1672"
        height="941"
        loading="eager"
        decoding="async"
        fetchpriority="high"
      />
      <div class="qn-banner-place" aria-label="Quiniela de Altagracia">
        <q-icon name="location_on" size="16px" aria-hidden="true" />
        <span>Altagracia</span>
      </div>
    </div>

    <div class="qn-wrap">
      <div class="qn-identity">
        <template v-if="identity">
          <div class="row items-center no-wrap">
            <q-avatar size="34px" color="amber-8" text-color="white" class="q-mr-sm">
              {{ inicial }}
            </q-avatar>
            <div>
              <div class="text-caption text-grey-7" style="line-height:1">Jugando como</div>
              <div class="text-weight-bold">{{ identity.nombre }}</div>
            </div>
          </div>
          <div class="row items-center no-wrap">
            <q-btn v-if="pushAvail" flat round dense :color="pushOn ? 'amber-8' : 'grey-6'"
              :icon="pushOn ? 'notifications_active' : 'notifications_none'"
              :loading="pushBusy" class="q-mr-xs" @click="togglePush">
              <q-tooltip>{{ pushOn ? 'Notificaciones activadas' : 'Activar notificaciones' }}</q-tooltip>
            </q-btn>
            <q-btn flat dense no-caps size="sm" color="grey-7" icon="logout" label="Salir" @click="salir" />
          </div>
        </template>
        <template v-else>
          <div class="text-grey-8">Únete para pronosticar</div>
          <div class="row items-center no-wrap">
            <q-btn v-if="pushAvail" flat round dense color="grey-6"
              icon="notifications_none"
              :loading="pushBusy" class="q-mr-xs" @click="togglePush">
              <q-tooltip>Activar notificaciones</q-tooltip>
            </q-btn>
            <q-btn unelevated no-caps rounded color="green-8" icon="how_to_reg" label="Unirme" class="qn-btn-cta" @click="showJoin = true" />
          </div>
        </template>
      </div>

      <transition name="qn-hint">
        <div v-if="pushAvail && identity && !pushOn && !pushHintDismissed" class="qn-push-hint">
          <q-icon name="notifications_none" size="22px" color="green-8" class="qn-push-hint-icon" />
          <div class="qn-push-hint-text">
            <div class="text-weight-bold" style="font-size:13px">Activa las notificaciones</div>
            <div style="font-size:12px;color:#555">Entérate cuando inicia un partido y si ganaste puntos</div>
          </div>
          <q-btn unelevated no-caps rounded size="sm" color="green-8" label="Activar" :loading="pushBusy" @click="togglePush" class="q-ml-xs" style="flex-shrink:0" />
          <q-btn flat round dense icon="close" size="xs" color="grey-5" @click="dismissPushHint" style="flex-shrink:0" />
        </div>
      </transition>

      <div v-if="proximo || enVivo" class="qn-next">
        <div class="qn-next-body">
          <template v-if="enVivo">
            <div class="qn-next-tag"><span class="qn-live-dot"></span> En vivo</div>
            <div class="qn-next-timer">{{ enVivo.goles_local ?? 0 }} <span class="qn-next-vs">-</span> {{ enVivo.goles_visita ?? 0 }}</div>
            <div class="qn-next-match">
              <img v-if="enVivo.equipo_local_logo" :src="enVivo.equipo_local_logo" class="qn-next-flag" alt="" />
              {{ enVivo.equipo_local }} <span class="qn-next-vs">vs</span> {{ enVivo.equipo_visita }}
              <img v-if="enVivo.equipo_visita_logo" :src="enVivo.equipo_visita_logo" class="qn-next-flag" alt="" />
            </div>
            <div class="qn-next-sub">{{ estadoTexto(enVivo) }} · {{ enVivo.ronda }}</div>
          </template>
          <template v-else-if="proximo">
            <div class="qn-next-tag"><q-icon name="schedule" size="14px" class="q-mr-xs" />Próximo partido en</div>
            <div class="qn-next-timer">{{ cuenta }}</div>
            <div class="qn-next-match">
              <img v-if="proximo.m.equipo_local_logo" :src="proximo.m.equipo_local_logo" class="qn-next-flag" alt="" />
              {{ proximo.m.equipo_local }} <span class="qn-next-vs">vs</span> {{ proximo.m.equipo_visita }}
              <img v-if="proximo.m.equipo_visita_logo" :src="proximo.m.equipo_visita_logo" class="qn-next-flag" alt="" />
            </div>
            <div class="qn-next-sub">{{ hora(proximo.m) }} CR · {{ proximo.m.ronda }}</div>
          </template>
        </div>
      </div>

      <div ref="sentinel" class="qn-sentinel" aria-hidden="true"></div>

      <q-expansion-item dense class="qn-rules" icon="help_outline" label="Cómo se puntúa">
        <div class="qn-rules-body">
          <div class="qn-rules-tag">Fase de grupos</div>
          <div class="row no-wrap items-start q-mb-xs"><q-icon name="check_circle" color="green-7" size="18px" class="q-mr-sm" /><span>Si pegas el marcador exacto, ganas <b class="q-ml-xs">{{ cfg.pts_exacto }} pts</b>. Ejemplo: pusiste 2-1 y quedó 2-1.</span></div>
          <div class="row no-wrap items-start q-mb-sm"><q-icon name="check_circle" color="blue-7" size="18px" class="q-mr-sm" /><span>Si no pegas el marcador, pero sí quién ganó o si empató, ganas <b class="q-ml-xs">{{ cfg.pts_resultado }} pt</b>. Ejemplo: pusiste 2-1 y quedó 1-0.</span></div>
          <div class="qn-rules-tag">Eliminatorias</div>
          <div class="row no-wrap items-start q-mb-xs"><q-icon name="check_circle" color="green-7" size="18px" class="q-mr-sm" /><span>Si pegas el marcador exacto antes de penales, ganas <b class="q-ml-xs">{{ cfg.pts_ko_exacto }} pts</b>. También vale si pusiste empate.</span></div>
          <div class="row no-wrap items-start q-mb-sm qn-rules-note"><span class="qn-rules-note-dot">!</span><span>Si hay penales, no se cuenta la tanda. Ejemplo: quedó 1-1 y luego hubo penales; el marcador que vale es 1-1.</span></div>
          <div class="row no-wrap items-start q-mb-xs"><q-icon name="check_circle" color="blue-7" size="18px" class="q-mr-sm" /><span>Si no pegas el marcador, pero tu marcador daba ganador al equipo que pasó, ganas <b class="q-ml-xs">{{ cfg.pts_ko_resultado }} pts</b>. Vale aunque pase por penales.</span></div>
          <div class="row no-wrap items-start q-mb-xs"><q-icon name="add_circle" color="amber-8" size="18px" class="q-mr-sm" /><span>Bonus <b>+{{ cfg.pts_ko_bonus }} pt</b>: eliges si termina en 90 minutos o si llega a tiempo extra/penales. Si aciertas eso, sumas 1 punto más.</span></div>
          <div class="row no-wrap items-start q-mb-sm qn-rules-note"><span class="qn-rules-note-dot">+</span><span>Máximo en eliminatorias: {{ cfg.pts_ko_exacto + cfg.pts_ko_bonus }} pts si pegas marcador y bonus, o {{ cfg.pts_ko_resultado + cfg.pts_ko_bonus }} pts si pegas quién pasa y bonus.</span></div>
          <div class="row no-wrap items-start text-grey-7"><q-icon name="schedule" size="16px" class="q-mr-sm" /><span>Todo se responde antes del partido. Se bloquea {{ cfg.bloquea_minutos_antes }} minutos antes de que empiece.</span></div>
        </div>
      </q-expansion-item>

      <div v-if="campeonVisible" class="qn-champ">
        <div class="qn-champ-head">
          <q-icon name="emoji_events" size="20px" />
          <span>Tu campeón del Mundial</span>
          <q-badge color="amber-8" class="q-ml-auto">+{{ cfg.pts_campeon }} pts</q-badge>
        </div>

        <template v-if="!campeonCerrado && esDanielVCampeon">
            <q-select
              v-model="campeonSel"
              :options="campeonOptions"
              use-input
              input-debounce="0"
              @filter="filterCampeon"
              outlined
              dense
              emit-value
              map-options
              clearable
              behavior="menu"
              label="Elige al campeón"
              class="qn-champ-select">
              <template v-slot:prepend><q-icon name="search" /></template>
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <img v-if="scope.opt.logo" :src="scope.opt.logo" class="qn-champ-flag" alt="" />
                    <q-icon v-else name="shield" size="22px" color="grey-5" />
                  </q-item-section>
                  <q-item-section>{{ scope.opt.label }}</q-item-section>
                </q-item>
              </template>
              <template v-slot:no-option>
                <q-item><q-item-section class="text-grey-6">Sin resultados</q-item-section></q-item>
              </template>
            </q-select>
            <div class="qn-champ-actions">
              <q-btn unelevated no-caps rounded color="green-8" icon="save" label="Guardar campeón" class="qn-btn-cta"
                :loading="savingCampeon" :disable="!campeonSel" @click="guardarCampeon" />
            </div>
            <div v-if="miCampeon" class="qn-champ-hint">
              <q-icon name="emoji_events" size="14px" /> Tu campeón: <b>{{ miCampeon.equipo }}</b>
            </div>
            <div class="qn-champ-deadline">
              <q-icon name="schedule" size="14px" /> Puedes cambiarlo hasta el {{ campeonCierraLabel }}
            </div>
        </template>

        <template v-else>
          <div v-if="miCampeon" class="qn-champ-locked">
            <img v-if="miCampeon.logo" :src="miCampeon.logo" class="qn-champ-flag-lg" alt="" />
            <q-icon v-else name="shield" size="40px" color="grey-5" />
            <div class="qn-champ-locked-info">
              <div class="qn-champ-team">{{ miCampeon.equipo }}</div>
              <div class="qn-champ-sub">
                <q-badge v-if="miCampeon.champ_equipo" :color="miCampeon.acerto ? 'green-7' : 'grey-6'">
                  {{ miCampeon.acerto ? '¡Acertaste! +' + miCampeon.puntos + ' pts' : 'No acertaste' }}
                </q-badge>
                <span v-else><q-icon name="lock" size="13px" class="q-mr-xs" />Bloqueado · {{ cfg.pts_campeon }} puntos en juego</span>
              </div>
            </div>
          </div>
          <div v-else class="qn-champ-locked text-grey-6">
            <q-icon name="lock" size="18px" class="q-mr-xs" /> Ya cerró la elección de campeón.
          </div>
        </template>
      </div>

      <q-tabs v-model="tab" class="qn-tabs" :style="{ top: (headerH + (stickyShow && (enVivo || proximo) ? 41 : 0)) + 'px' }" active-color="green-9" indicator-color="green-9" align="justify" no-caps dense>
        <q-tab name="partidos" icon="sports_soccer" label="Partidos" />
        <q-tab name="posiciones" icon="table_chart" label="Posiciones" />
        <q-tab v-if="hayEliminatorias" name="llaves" icon="account_tree" label="Llaves" />
        <q-tab name="ranking" icon="leaderboard" label="Ranking" />
      </q-tabs>

      <q-tab-panels v-model="tab" animated class="qn-panels">
        <q-tab-panel name="partidos" class="q-pa-none">
          <div class="qn-filtros q-mb-md">
            <q-chip v-for="f in filtros" :key="f.value" clickable
              class="qn-filtro" :class="{ 'qn-filtro-on': filtro === f.value }"
              @click="filtro = f.value">{{ f.label }}</q-chip>
          </div>

          <div v-if="(filtro === 'fin' || filtro === 'todos') && !loading" class="qn-date-wrap">
            <div class="qn-date-toggle row items-center q-mb-sm">
              <q-chip clickable :selected="fechaActiva"
                :color="fechaActiva ? 'amber-8' : 'grey-3'"
                :text-color="fechaActiva ? 'white' : 'grey-8'"
                icon="event" @click="toggleFecha">Por fecha</q-chip>
              <span v-if="fechaActiva" class="qn-date-label">{{ fechaLabel }}</span>
              <q-btn v-if="fechaActiva && !calAbierto" flat dense no-caps size="sm" color="grey-7" icon="close" label="Quitar" @click="limpiarFecha" class="q-ml-auto" />
            </div>
            <transition name="qn-calendar">
              <div v-if="calAbierto" class="qn-calendar-shell" aria-label="Seleccionar fecha de los partidos">
                <q-date
                  v-model="fechaCalendario"
                  @update:model-value="alElegirFecha"
                  mask="YYYY-MM-DD"
                  color="green-8"
                  text-color="white"
                  :locale="calendarLocale"
                  :first-day-of-week="1"
                  today-btn
                  flat
                  class="qn-calendar-picker"
                />
                <div class="qn-calendar-actions">
                  <div class="qn-calendar-hint">
                    <q-icon name="event" size="18px" />
                    Toca un día para filtrar
                  </div>
                  <q-btn flat no-caps color="grey-7" icon="close" label="Quitar filtro" @click="limpiarFecha" />
                </div>
              </div>
            </transition>
          </div>

          <div v-if="loading" class="qn-sk-list">
            <div v-for="n in 4" :key="n" class="qn-card qn-sk-card">
              <div class="row items-center justify-between q-mb-md">
                <q-skeleton type="text" width="38%" animation="wave" />
                <q-skeleton type="QChip" width="64px" height="20px" animation="wave" />
              </div>
              <div class="row items-start justify-between no-wrap">
                <div class="column items-center qn-sk-team">
                  <q-skeleton type="QAvatar" size="46px" animation="wave" />
                  <q-skeleton type="text" width="70%" class="q-mt-sm" animation="wave" />
                </div>
                <q-skeleton type="text" width="34px" height="26px" class="q-mt-md" animation="wave" />
                <div class="column items-center qn-sk-team">
                  <q-skeleton type="QAvatar" size="46px" animation="wave" />
                  <q-skeleton type="text" width="70%" class="q-mt-sm" animation="wave" />
                </div>
              </div>
              <q-skeleton type="QInput" height="38px" class="q-mt-md" animation="wave" />
            </div>
          </div>

          <div v-else-if="grupos.length === 0" class="flex flex-center column q-my-xl text-grey-6">
            <q-icon name="sports_soccer" size="56px" color="grey-4" />
            <div class="q-mt-md">No hay partidos para mostrar</div>
            <div class="text-caption">Los datos se sincronizan automáticamente.</div>
          </div>

          <div v-for="g in grupos" :key="g.key" class="q-mb-lg">
            <div class="qn-fecha">{{ g.label }}</div>

            <div v-for="m in g.items" :key="m.id" class="qn-card" :class="'qn-' + tipo(m)">
              <div class="qn-card-top">
                <div class="qn-ronda">{{ m.ronda || 'Mundial' }}</div>
                <div class="qn-estado" :class="'qn-estado-' + tipo(m)">
                  <q-icon v-if="tipo(m) === 'live'" name="fiber_manual_record" size="10px" class="qn-blink q-mr-xs" />
                  {{ estadoTexto(m) }}
                </div>
              </div>

              <div class="qn-match">
                <div class="qn-team">
                  <img v-if="m.equipo_local_logo" :src="m.equipo_local_logo" class="qn-logo" alt="" />
                  <q-icon v-else name="shield" size="34px" color="grey-5" />
                  <div class="qn-team-name">{{ m.equipo_local || '—' }}</div>
                </div>

                <div class="qn-center">
                  <div v-if="tipo(m) !== 'prox' && m.goles_local != null" class="qn-score">
                    {{ m.goles_local }} <span class="qn-dash">-</span> {{ m.goles_visita }}
                  </div>
                  <div v-else class="qn-vs">VS</div>
                </div>

                <div class="qn-team">
                  <img v-if="m.equipo_visita_logo" :src="m.equipo_visita_logo" class="qn-logo" alt="" />
                  <q-icon v-else name="shield" size="34px" color="grey-5" />
                  <div class="qn-team-name">{{ m.equipo_visita || '—' }}</div>
                </div>
              </div>

              <div v-if="tipo(m) !== 'prox' && m.estado_corto === 'PEN' && m.pen_local != null" class="qn-penales">
                <q-icon name="sports_soccer" size="13px" class="q-mr-xs" />
                <span class="qn-pen-dots">
                  <span v-for="n in (m.pen_local_fall || 0)" :key="'plf' + n" class="qn-pen-dot qn-pen-miss"></span>
                  <span v-for="n in (m.pen_local || 0)" :key="'pl' + n" class="qn-pen-dot qn-pen-ok"></span>
                </span>
                <b class="qn-penales-num">{{ m.pen_local }} - {{ m.pen_visita }}</b>
                <span class="qn-pen-dots">
                  <span v-for="n in (m.pen_visita || 0)" :key="'pv' + n" class="qn-pen-dot qn-pen-ok"></span>
                  <span v-for="n in (m.pen_visita_fall || 0)" :key="'pvf' + n" class="qn-pen-dot qn-pen-miss"></span>
                </span>
              </div>

              <div v-if="tipo(m) !== 'prox' && ((m.goleadores_local && m.goleadores_local.length) || (m.goleadores_visita && m.goleadores_visita.length))" class="qn-goles">
                <div class="qn-goles-col">
                  <div v-for="(g, i) in (m.goleadores_local || [])" :key="'l' + i" class="qn-gol">
                    <qn-soccer-ball :own="!!g.owngoal" class="q-mr-xs" />
                    <span class="qn-gol-name ellipsis">{{ g.name }}</span>
                    <span class="qn-gol-min">&nbsp;{{ g.minute }}'{{ g.penalty ? ' (P)' : '' }}{{ g.owngoal ? ' (ag)' : '' }}</span>
                  </div>
                </div>
                <div class="qn-goles-col qn-goles-right">
                  <div v-for="(g, i) in (m.goleadores_visita || [])" :key="'v' + i" class="qn-gol qn-gol-r">
                    <span class="qn-gol-min">{{ g.minute }}'{{ g.penalty ? ' (P)' : '' }}{{ g.owngoal ? ' (ag)' : '' }}&nbsp;</span>
                    <span class="qn-gol-name ellipsis">{{ g.name }}</span>
                    <qn-soccer-ball :own="!!g.owngoal" class="q-ml-xs" />
                  </div>
                </div>
              </div>

              <div v-if="tipo(m) !== 'prox' && ((m.tarjetas_local && m.tarjetas_local.length) || (m.tarjetas_visita && m.tarjetas_visita.length))" class="qn-tarjetas">
                <div class="qn-goles-col">
                  <div v-for="(t, i) in (m.tarjetas_local || [])" :key="'tl' + i" class="qn-gol">
                    <span class="qn-card-ic" :class="t.tipo === 'roja' ? 'qn-card-red' : 'qn-card-yellow'"></span>
                    <span class="qn-gol-name ellipsis">{{ t.name }}</span>
                    <span class="qn-gol-min">&nbsp;{{ t.minute }}'</span>
                  </div>
                </div>
                <div class="qn-goles-col qn-goles-right">
                  <div v-for="(t, i) in (m.tarjetas_visita || [])" :key="'tv' + i" class="qn-gol qn-gol-r">
                    <span class="qn-gol-min">{{ t.minute }}'&nbsp;</span>
                    <span class="qn-gol-name ellipsis">{{ t.name }}</span>
                    <span class="qn-card-ic q-ml-xs" :class="t.tipo === 'roja' ? 'qn-card-red' : 'qn-card-yellow'"></span>
                  </div>
                </div>
              </div>

              <div class="qn-pred">
                <template v-if="editable(m)">
                  <div class="qn-pred-row">
                    <q-input v-model="form[m.id].gl" type="number" dense outlined min="0" max="30"
                      input-class="text-center text-weight-bold" class="qn-num" inputmode="numeric" />
                    <span class="qn-pred-x">:</span>
                    <q-input v-model="form[m.id].gv" type="number" dense outlined min="0" max="30"
                      input-class="text-center text-weight-bold" class="qn-num" inputmode="numeric" />
                    <q-btn v-if="identity" unelevated no-caps rounded color="green-8" icon="save"
                      :loading="savingId === m.id" label="Guardar" class="q-ml-sm qn-btn-cta" @click="guardar(m)" />
                    <q-btn v-else unelevated no-caps rounded color="amber-8" icon="how_to_reg"
                      label="Unirme" class="q-ml-sm qn-btn-cta" @click="showJoin = true" />
                  </div>
                  <div v-if="esKo(m)" class="qn-pred-def">
                    <div class="qn-pred-def-q">¿Hasta dónde llega? <b class="text-amber-9">+{{ cfg.pts_ko_bonus }} si aciertas</b></div>
                    <q-btn-toggle v-model="form[m.id].def" spread no-caps dense unelevated
                      toggle-color="amber-8" color="grey-3" text-color="grey-8"
                      :options="[{ label: 'Termina en 90 min', value: 'reg' }, { label: 'Tiempo extra / Penales', value: 'ext' }]"
                      class="qn-def-toggle" />
                  </div>
                  <div v-if="misPron[m.id]" class="qn-pred-hint">
                    <q-icon name="bookmark" size="14px" /> Tu pronóstico actual: {{ misPron[m.id].goles_local }} - {{ misPron[m.id].goles_visita }}<span v-if="esKo(m) && misPron[m.id].def_pred"> · {{ defLabel(misPron[m.id].def_pred) }}</span>
                  </div>
                </template>

                <template v-else>
                  <div v-if="esAdmin && esKo(m) && m.estado_corto === 'PEN'" class="qn-admin-pen">
                    <div class="qn-admin-pen-q"><q-icon name="admin_panel_settings" size="14px" /> Tanda de penales (admin)</div>
                    <div class="qn-admin-pen-row">
                      <span class="qn-admin-pen-team ellipsis">{{ m.equipo_local }}</span>
                      <q-input v-model.number="penForm[m.id].pl" type="number" min="0" max="20" dense outlined
                        label="Anotó" inputmode="numeric" class="qn-admin-pen-in" />
                      <q-input v-model.number="penForm[m.id].plf" type="number" min="0" max="20" dense outlined
                        label="Falló" inputmode="numeric" class="qn-admin-pen-in" />
                    </div>
                    <div class="qn-admin-pen-row">
                      <span class="qn-admin-pen-team ellipsis">{{ m.equipo_visita }}</span>
                      <q-input v-model.number="penForm[m.id].pv" type="number" min="0" max="20" dense outlined
                        label="Anotó" inputmode="numeric" class="qn-admin-pen-in" />
                      <q-input v-model.number="penForm[m.id].pvf" type="number" min="0" max="20" dense outlined
                        label="Falló" inputmode="numeric" class="qn-admin-pen-in" />
                    </div>
                    <q-btn no-caps unelevated rounded color="green-8" icon="save" label="Guardar penales"
                      class="full-width q-mt-xs qn-btn-cta" :loading="penBusy === m.id" @click="setPenales(m)" />
                  </div>
                  <div v-if="misPron[m.id]" class="qn-mine">
                    <span>Tu pronóstico: <b>{{ misPron[m.id].goles_local }} - {{ misPron[m.id].goles_visita }}</b><span v-if="esKo(m) && misPron[m.id].def_pred" class="qn-mine-def"><q-icon name="schedule" size="12px" /> {{ defLabel(misPron[m.id].def_pred) }}</span></span>
                    <q-badge v-if="misPron[m.id].scored" :color="misPron[m.id].puntos > 0 ? 'green-7' : 'grey-6'" class="q-ml-sm">
                      +{{ misPron[m.id].puntos }} pts
                    </q-badge>
                  </div>
                  <div v-else class="qn-locked">
                    <q-icon :name="lockIcon(m)" size="15px" class="q-mr-xs" />{{ lockTexto(m) }}
                  </div>

                  <q-btn v-if="tipo(m) !== 'prox' || locked(m)" unelevated no-caps rounded size="md" color="green-9"
                    :icon="pubPron[m.id] ? 'expand_less' : 'groups'"
                    :label="pubPron[m.id] ? 'Ocultar' : 'Ver pronósticos'" class="q-mt-sm qn-btn-pron"
                    @click="togglePron(m)" />
                  <div v-if="pubPron[m.id]" class="qn-pub">
                    <div v-if="pubPron[m.id].length === 0" class="text-caption text-grey-6 q-pa-sm">Nadie pronosticó este partido.</div>
                    <div v-for="(p, i) in pubPron[m.id]" :key="i" class="qn-pub-row">
                      <span class="ellipsis">{{ p.nombre }}</span>
                      <span class="text-weight-bold">{{ p.goles_local }} - {{ p.goles_visita }}</span>
                      <q-badge v-if="p.scored" :color="p.puntos > 0 ? 'green-7' : 'grey-5'">+{{ p.puntos }}</q-badge>
                      <span v-else class="text-grey-5 text-caption">—</span>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </q-tab-panel>

        <q-tab-panel name="ranking" class="q-pa-none">
          <div v-if="loading" class="qn-rank">
            <div v-for="n in 6" :key="n" class="qn-rank-row qn-sk-rank-row">
              <q-skeleton type="QAvatar" size="34px" animation="wave" />
              <div class="qn-rank-name">
                <q-skeleton type="text" width="45%" animation="wave" />
                <q-skeleton type="text" width="65%" animation="wave" />
              </div>
              <q-skeleton type="text" width="34px" height="22px" animation="wave" />
            </div>
          </div>
          <div v-else-if="ranking.length === 0" class="flex flex-center column q-my-xl text-grey-6">
            <q-icon name="leaderboard" size="56px" color="grey-4" />
            <div class="q-mt-md">Aún no hay puntos en juego</div>
          </div>
          <div v-else class="qn-rank">
            <div v-for="(r, i) in ranking" :key="r.id" class="qn-rank-row" :class="['qn-rank-place-' + (i + 1), { 'qn-me': esMio(r) }]" @click="abrirPron(r)">
              <div v-if="i < 3" class="qn-medal" :class="'qn-medal-' + (i + 1)">
                <span>{{ i + 1 }}</span>
              </div>
              <div v-else class="qn-pos">{{ i + 1 }}</div>
              <div class="qn-rank-name ellipsis">
                {{ r.nombre }}
                <span v-if="esMio(r)" class="qn-yo">tú</span>
                <div class="text-caption text-grey-6">{{ r.exactos }} exactos · {{ r.aciertos }} aciertos · {{ r.jugados }} jugados</div>
              </div>
              <div class="qn-rank-pts">{{ r.puntos }}<span>pts</span></div>
              <q-icon name="chevron_right" size="20px" color="grey-5" class="qn-rank-go" />
            </div>
          </div>
        </q-tab-panel>

        <q-tab-panel name="posiciones" class="q-pa-none">
          <div v-if="loading" class="qn-grupo">
            <q-skeleton type="text" width="32%" height="20px" class="q-mb-sm" animation="wave" />
            <div class="qn-tabla">
              <div v-for="n in 4" :key="n" class="qn-tabla-row qn-sk-tabla-row">
                <q-skeleton type="text" width="100%" animation="wave" />
              </div>
            </div>
          </div>
          <div v-else-if="gruposPos.length === 0" class="flex flex-center column q-my-xl text-grey-6">
            <q-icon name="table_chart" size="56px" color="grey-4" />
            <div class="q-mt-md">Aún no hay posiciones</div>
            <div class="text-caption">Se calculan con los partidos jugados.</div>
          </div>
          <div v-for="gp in gruposPos" :key="gp.grupo" class="qn-grupo">
            <div class="qn-grupo-head">Grupo {{ gp.grupo }}</div>
            <div class="qn-tabla">
              <div class="qn-tabla-row qn-tabla-head">
                <span class="qn-col-pos">#</span>
                <span class="qn-col-eq">Equipo</span>
                <span class="qn-col-n">PJ</span>
                <span class="qn-col-n qn-hide-xs">G</span>
                <span class="qn-col-n qn-hide-xs">E</span>
                <span class="qn-col-n qn-hide-xs">P</span>
                <span class="qn-col-n">DG</span>
                <span class="qn-col-n qn-col-pts">Pts</span>
              </div>
              <div v-for="(t, i) in gp.equipos" :key="t.equipo" class="qn-tabla-row" :class="{ 'qn-clasifica': i < 2 }">
                <span class="qn-col-pos">{{ i + 1 }}</span>
                <span class="qn-col-eq">
                  <img v-if="t.logo" :src="t.logo" class="qn-tabla-flag" alt="" />
                  <span class="ellipsis">{{ t.equipo }}</span>
                </span>
                <span class="qn-col-n">{{ t.pj }}</span>
                <span class="qn-col-n qn-hide-xs">{{ t.g }}</span>
                <span class="qn-col-n qn-hide-xs">{{ t.e }}</span>
                <span class="qn-col-n qn-hide-xs">{{ t.p }}</span>
                <span class="qn-col-n">{{ t.dg > 0 ? '+' + t.dg : t.dg }}</span>
                <span class="qn-col-n qn-col-pts">{{ t.pts }}</span>
              </div>
            </div>
          </div>
          <div v-if="gruposPos.length" class="qn-tabla-nota">
            <span class="qn-clasifica-dot"></span> Los 2 primeros de cada grupo avanzan (más los mejores terceros).
          </div>
        </q-tab-panel>

        <q-tab-panel name="llaves" class="q-pa-none">
          <div v-if="brkTree.length === 0" class="flex flex-center column q-my-xl text-grey-6">
            <q-icon name="account_tree" size="56px" color="grey-4" />
            <div class="q-mt-md">Aún no hay fase de eliminación</div>
          </div>
          <template v-else>
            <div v-if="eliminatoriasVacias" class="qn-brk-hint">
              <q-icon name="info" size="18px" class="q-mr-xs" />
              Las llaves se van completando cuando terminen los grupos.
            </div>
            <div class="qn-brk-scrollhint">
              <q-icon name="swipe" size="15px" class="q-mr-xs" />Desliza para ver todo el cuadro
            </div>
            <div ref="brkScroll" class="qn-brk-scroll" @scroll="onBrkScroll">
              <div class="qn-brk2" :class="{ 'qn-brk2-anim': brkReady }" :style="brkH ? { '--brk-h': brkH + 'px' } : null">
                <div v-for="col in brkTree" :key="col.key" class="qn-brk2-round">
                  <div class="qn-brk2-roundhead">{{ col.label }}</div>
                  <div class="qn-brk2-matches">
                    <div v-for="m in col.items" :key="m.id" class="qn-brk2-match">
                      <div class="qn-brk2-card" :class="'qn-brk-' + tipo(m)">
                        <div class="qn-brk-state" :class="'qn-brk-state-' + tipo(m)">
                          <span v-if="tipo(m) === 'live'" class="qn-live-dot qn-brk-livedot"></span>{{ brkEstado(m) }}
                        </div>
                        <div class="qn-brk-team" :class="{ 'qn-brk-win': ganador(m) === 1, 'qn-brk-dim': !m.equipo_local_logo }">
                          <img v-if="m.equipo_local_logo" :src="m.equipo_local_logo" class="qn-brk-flag" alt="" />
                          <span v-else class="qn-brk-ph"></span>
                          <span class="qn-brk-name ellipsis">{{ m.equipo_local || '—' }}</span>
                          <span v-if="tipo(m) !== 'prox' && m.goles_local != null" class="qn-brk-score">{{ m.goles_local }}</span>
                        </div>
                        <div class="qn-brk-team" :class="{ 'qn-brk-win': ganador(m) === 2, 'qn-brk-dim': !m.equipo_visita_logo }">
                          <img v-if="m.equipo_visita_logo" :src="m.equipo_visita_logo" class="qn-brk-flag" alt="" />
                          <span v-else class="qn-brk-ph"></span>
                          <span class="qn-brk-name ellipsis">{{ m.equipo_visita || '—' }}</span>
                          <span v-if="tipo(m) !== 'prox' && m.goles_visita != null" class="qn-brk-score">{{ m.goles_visita }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="tercerLugar" class="qn-brk-3rd">
              <div class="qn-brk-3rd-head"><q-icon name="military_tech" size="16px" class="q-mr-xs" />Tercer lugar</div>
              <div class="qn-brk2-card qn-brk-3rd-card" :class="'qn-brk-' + tipo(tercerLugar)">
                <div class="qn-brk-state" :class="'qn-brk-state-' + tipo(tercerLugar)">
                  <span v-if="tipo(tercerLugar) === 'live'" class="qn-live-dot qn-brk-livedot"></span>{{ brkEstado(tercerLugar) }}
                </div>
                <div class="qn-brk-team" :class="{ 'qn-brk-win': ganador(tercerLugar) === 1, 'qn-brk-dim': !tercerLugar.equipo_local_logo }">
                  <img v-if="tercerLugar.equipo_local_logo" :src="tercerLugar.equipo_local_logo" class="qn-brk-flag" alt="" />
                  <span v-else class="qn-brk-ph"></span>
                  <span class="qn-brk-name ellipsis">{{ tercerLugar.equipo_local || '—' }}</span>
                  <span v-if="tipo(tercerLugar) !== 'prox' && tercerLugar.goles_local != null" class="qn-brk-score">{{ tercerLugar.goles_local }}</span>
                </div>
                <div class="qn-brk-team" :class="{ 'qn-brk-win': ganador(tercerLugar) === 2, 'qn-brk-dim': !tercerLugar.equipo_visita_logo }">
                  <img v-if="tercerLugar.equipo_visita_logo" :src="tercerLugar.equipo_visita_logo" class="qn-brk-flag" alt="" />
                  <span v-else class="qn-brk-ph"></span>
                  <span class="qn-brk-name ellipsis">{{ tercerLugar.equipo_visita || '—' }}</span>
                  <span v-if="tipo(tercerLugar) !== 'prox' && tercerLugar.goles_visita != null" class="qn-brk-score">{{ tercerLugar.goles_visita }}</span>
                </div>
              </div>
            </div>
          </template>
        </q-tab-panel>
      </q-tab-panels>
    </div>
    </q-pull-to-refresh>

    <q-dialog v-model="showJoin">
      <q-card class="qn-join">
        <q-card-section class="text-center">
          <q-icon name="sports_soccer" size="48px" color="green-8" />
          <div class="text-h6 text-weight-bold q-mt-sm">Unirse a la quiniela</div>
          <div class="text-grey-7 text-caption">Escribe tu nombre y un PIN de 4 dígitos. El PIN protege tus pronósticos.</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="joinData.nombre" label="Tu nombre" outlined dense maxlength="40" autofocus>
            <template v-slot:prepend><q-icon name="person" /></template>
          </q-input>
          <q-input v-model="joinData.pin" label="PIN (4 dígitos)" outlined dense mask="####" inputmode="numeric">
            <template v-slot:prepend><q-icon name="pin" /></template>
          </q-input>
          <div class="text-caption text-grey-6">Si ya te uniste antes, usa el mismo nombre y PIN para recuperar tus pronósticos.</div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat no-caps label="Cancelar" color="grey-7" v-close-popup />
          <q-btn unelevated no-caps rounded color="green-8" label="Entrar" class="qn-btn-cta" :loading="joinLoading" @click="join" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../supabase'
import { notify } from '../utils/notify'
import { pushSupported, pushDenied, isSubscribed, subscribePush, unsubscribePush } from '../utils/push'
import QnSoccerBall from '../components/QnSoccerBall.vue'

const PUSH_HABILITADO = true

const IDENTITY_KEY = 'quiniela_identity'
const CELEB_KEY = 'quiniela_celebrados'
const DANIEL_CAMPEON_NOMBRE = 'daniel v'
const CAMPEON_CIERRA_DANIEL_V = '2026-07-02T18:00:00+00:00'
const FIN = new Set(['FT', 'AET', 'PEN', 'WO'])
const LIVE = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT', 'SUSP'])

const KO_ORDER = [
  { ronda: 'Dieciseisavos', label: '16avos' },
  { ronda: 'Octavos de final', label: 'Octavos' },
  { ronda: 'Cuartos de final', label: 'Cuartos' },
  { ronda: 'Semifinal', label: 'Semis' },
  { ronda: 'Final', label: 'Final' },
  { ronda: 'Tercer lugar', label: '3er lugar' }
]
const KO_RONDAS = new Set(KO_ORDER.map(r => r.ronda))

const FEEDERS = {
  89: [74, 77], 90: [73, 75], 91: [76, 78], 92: [79, 80],
  93: [83, 84], 94: [81, 82], 95: [86, 88], 96: [85, 87],
  97: [89, 90], 98: [93, 94], 99: [91, 92], 100: [95, 96],
  101: [97, 98], 102: [99, 100],
  104: [101, 102]
}
const TREE_ROUNDS = [
  { ronda: 'Dieciseisavos', label: '16avos' },
  { ronda: 'Octavos de final', label: 'Octavos' },
  { ronda: 'Cuartos de final', label: 'Cuartos' },
  { ronda: 'Semifinal', label: 'Semis' },
  { ronda: 'Final', label: 'Final' }
]
const firstLeaf = (num) => { const ch = FEEDERS[num]; return ch ? firstLeaf(ch[0]) : num }
const leafSeq = () => { const out = []; const rec = (n) => { const ch = FEEDERS[n]; if (!ch) { out.push(n); return } rec(ch[0]); rec(ch[1]) }; rec(104); return out }
const normalizarNombre = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase()

const ERROR_MSG = {
  CREDENCIALES: 'Nombre o PIN incorrecto',
  PIN_INCORRECTO: 'PIN incorrecto para ese nombre',
  PIN_INVALIDO: 'El PIN debe ser de 4 dígitos',
  NOMBRE_VACIO: 'Escribe tu nombre',
  BLOQUEADO: 'Ya no se puede cambiar: falta menos de 15 minutos',
  AUN_NO_ABRE: 'Aún no se habilita (abre 12 h antes)',
  PARTIDO_NO_EXISTE: 'Partido no encontrado',
  MARCADOR_INVALIDO: 'Marcador inválido',
  EMPATE_NO_PERMITIDO: 'En eliminatorias se permiten empates',
  CLASIFICADO_REQUERIDO: 'En eliminatorias se permiten empates',
  DEFINICION_REQUERIDA: 'Elige si termina en 90 min o si llega a tiempo extra/penales',
  NO_AUTORIZADO: 'No tienes permiso para esta acción',
  NO_ES_KO: 'Solo aplica a partidos de eliminatoria',
  LADO_INVALIDO: 'Lado inválido',
  PENALES_EMPATE: 'En penales debe haber un ganador (anotados distintos)',
  PENALES_INVALIDO: 'Penales inválidos'
}

function msgFromError (e) {
  const raw = (e && e.message) ? e.message : String(e)
  for (const k in ERROR_MSG) { if (raw.includes(k)) return ERROR_MSG[k] }
  return 'No se pudo completar la acción'
}

export default defineComponent({
  name: 'QuinielaPage',
  components: { QnSoccerBall },
  setup () {
    const router = useRouter()
    const route = useRoute()
    const VALID_TABS = ['partidos', 'posiciones', 'llaves', 'ranking']
    const tab = ref(VALID_TABS.includes(route.query.tab) ? route.query.tab : 'partidos')
    const cfg = ref({ abre_horas_antes: 12, bloquea_minutos_antes: 15, pts_exacto: 3, pts_resultado: 1, pts_bonus_equipo: 1, pts_ko_exacto: 5, pts_ko_resultado: 3, pts_ko_bonus: 1, pts_campeon: 10, campeon_cierra: CAMPEON_CIERRA_DANIEL_V })
    const partidos = ref([])
    const ranking = ref([])
    const posiciones = ref([])
    const misPron = reactive({})
    const pubPron = reactive({})
    const form = reactive({})
    const penForm = reactive({})
    const identity = ref(null)
    const now = ref(Date.now())
    const clock = ref(Date.now())
    const loading = ref(true)
    const filtro = ref('prox')
    const showJoin = ref(false)
    const joinData = reactive({ nombre: '', pin: '' })
    const joinLoading = ref(false)
    const savingId = ref(null)
    const esAdmin = ref(false)
    const penBusy = ref(null)
    const miCampeon = ref(null)
    const campeonSel = ref(null)
    const campeonOptions = ref([])
    const savingCampeon = ref(false)
    const pushAvail = ref(false)
    const pushOn = ref(false)
    const pushBusy = ref(false)
    const pushHintDismissed = ref(localStorage.getItem('qn_push_hint_dismissed') === '1')
    const fechaActiva = ref(false)
    const calAbierto = ref(false)
    const stickyShow = ref(false)
    const headerH = ref(56)
    const sentinel = ref(null)
    const brkScroll = ref(null)
    const brkH = ref(null)
    const brkReady = ref(false)
    const brkLastIdx = ref(0)
    let brkRaf = 0
    let brkSettleTimer = 0
    let brkSnapping = false
    const celebrados = new Set((() => { try { return JSON.parse(localStorage.getItem(CELEB_KEY) || '[]') } catch (e) { return [] } })())
    let primeraCargaMine = true
    const fechaCalendario = ref('2026-01-01')
    const calendarLocale = {
      days: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      daysShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
      months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
      monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      firstDayOfWeek: 1,
      format24h: true,
      pluralDay: 'días'
    }

    const keyFmt = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Costa_Rica' })

    const fechaSel = computed(() => {
      if (!fechaActiva.value) return null
      return fechaCalendario.value
    })

    const fechaLabel = computed(() => {
      if (!fechaActiva.value || !fechaCalendario.value) return ''
      const [year, month, day] = fechaCalendario.value.split('-').map(Number)
      return new Intl.DateTimeFormat('es-CR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
        .format(new Date(Date.UTC(year, month - 1, day)))
    })

    let nowTimer = null
    let clockTimer = null
    let pollTimer = null
    let channel = null

    const filtros = [
      { label: 'Todos', value: 'todos' },
      { label: 'En vivo', value: 'live' },
      { label: 'Próximos', value: 'prox' },
      { label: 'Finalizados', value: 'fin' }
    ]

    const inicial = computed(() => (identity.value?.nombre || '?').trim().charAt(0).toUpperCase())
    const esDanielVCampeon = computed(() => normalizarNombre(identity.value?.nombre) === DANIEL_CAMPEON_NOMBRE)
    const campeonVisible = computed(() => Boolean(identity.value))

    const tipo = (m) => {
      const s = m.estado_corto
      if (FIN.has(s)) return 'fin'
      if (LIVE.has(s)) return 'live'
      return 'prox'
    }
    const ko = (m) => new Date(m.kickoff).getTime()
    const locked = (m) => now.value >= ko(m) - cfg.value.bloquea_minutos_antes * 60000
    const abierto = (m) => now.value >= ko(m) - cfg.value.abre_horas_antes * 3600000
    const editable = (m) => tipo(m) === 'prox' && abierto(m) && !locked(m)
    const esKo = (m) => KO_RONDAS.has(m.ronda)
    const defLabel = (d) => d === 'reg' ? "90 minutos" : d === 'ext' ? 'tiempo extra/penales' : ''

    const hora = (m) => {
      try {
        return new Date(m.kickoff).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Costa_Rica' })
      } catch (e) { return '' }
    }

    const estadoTexto = (m) => {
      const t = tipo(m)
      if (t === 'fin') {
        if (m.estado_corto === 'AET') return 'Final (TE)'
        if (m.estado_corto === 'PEN') return 'Final (pen)'
        return 'Final'
      }
      if (t === 'live') {
        const s = m.estado_corto
        if (s === 'HT') return 'Medio tiempo'
        if (s === 'INT') return 'Interrumpido'
        if (s === 'SUSP') return 'Suspendido'
        if (s === 'P') return 'Penales'
        const label = m.minuto_label || (m.minuto ? String(m.minuto) : '')
        if (s === 'ET') return label ? "TE " + label + "'" : 'Tiempo extra'
        return label ? label + "'" : 'En vivo'
      }
      return hora(m)
    }

    const lockIcon = (m) => {
      if (tipo(m) !== 'prox') return 'sports'
      return abierto(m) ? 'lock' : 'schedule'
    }
    const lockTexto = (m) => {
      const t = tipo(m)
      if (t === 'live') return 'Partido en juego'
      if (t === 'fin') return 'Partido finalizado'
      if (!abierto(m)) return 'Abre ' + cfg.value.abre_horas_antes + ' h antes del partido'
      return 'Pronóstico cerrado'
    }

    const lista = computed(() => {
      let arr = partidos.value
      if (filtro.value === 'live') arr = arr.filter(m => tipo(m) === 'live')
      else if (filtro.value === 'prox') arr = arr.filter(m => tipo(m) === 'prox')
      else if (filtro.value === 'fin') {
        arr = arr
          .filter(m => tipo(m) === 'fin')
          .sort((a, b) => ko(b) - ko(a))
      }
      if (fechaActiva.value && fechaSel.value) {
        arr = arr.filter(m => keyFmt.format(new Date(m.kickoff)) === fechaSel.value)
      }
      return arr
    })

    const grupos = computed(() => {
      const fmt = new Intl.DateTimeFormat('es-CR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Costa_Rica' })
      const keyFmt = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Costa_Rica' })
      const out = []
      let cur = null
      for (const m of lista.value) {
        const d = new Date(m.kickoff)
        const key = keyFmt.format(d)
        if (!cur || cur.key !== key) {
          cur = { key, label: fmt.format(d), items: [] }
          out.push(cur)
        }
        cur.items.push(m)
      }
      return out
    })

    const esMio = (r) => identity.value && (r.nombre || '').toLowerCase() === identity.value.nombre.toLowerCase()

    const abrirPron = (r) => {
      router.push({ path: '/quiniela/pronostico', query: { nombre: r.nombre } })
    }

    const enVivo = computed(() => partidos.value.find(m => tipo(m) === 'live') || null)

    const proximo = computed(() => {
      const t = clock.value
      let best = null
      for (const m of partidos.value) {
        if (m.finalizado) continue
        const ko = new Date(m.kickoff).getTime()
        if (ko > t && (!best || ko < best.ko)) best = { m, ko }
      }
      return best
    })

    const cuenta = computed(() => {
      if (!proximo.value) return ''
      let ms = proximo.value.ko - clock.value
      if (ms < 0) ms = 0
      const pad = (n) => String(n).padStart(2, '0')
      const d = Math.floor(ms / 86400000)
      const h = Math.floor((ms % 86400000) / 3600000)
      const mn = Math.floor((ms % 3600000) / 60000)
      const s = Math.floor((ms % 60000) / 1000)
      return (d > 0 ? d + 'd ' : '') + pad(h) + ':' + pad(mn) + ':' + pad(s)
    })

    const brkTree = computed(() => {
      if (!partidos.value.some(m => KO_RONDAS.has(m.ronda))) return []
      const leaves = leafSeq()
      const leafIdx = new Map(leaves.map((n, i) => [n, i]))
      const cols = []
      for (const r of TREE_ROUNDS) {
        const items = partidos.value.filter(m => m.ronda === r.ronda)
        if (!items.length) continue
        const withNum = items.map(m => ({ m, num: m.match_no }))
        withNum.sort((a, b) => (leafIdx.get(firstLeaf(a.num)) ?? 0) - (leafIdx.get(firstLeaf(b.num)) ?? 0))
        cols.push({ key: r.ronda, label: r.label, items: withNum.map(x => x.m) })
      }
      return cols
    })
    const tercerLugar = computed(() => partidos.value.find(m => m.ronda === 'Tercer lugar') || null)
    const hayEliminatorias = computed(() => partidos.value.some(m => KO_RONDAS.has(m.ronda)))
    const eliminatoriasVacias = computed(() => brkTree.value.every(c => c.items.every(m => !m.equipo_local_logo && !m.equipo_visita_logo)))

    const ganador = (m) => {
      if (tipo(m) !== 'fin') return 0
      if (m.estado_corto === 'PEN' && m.ganador_ko) return m.ganador_ko
      if (m.goles_local == null || m.goles_visita == null) return 0
      if (m.goles_local > m.goles_visita) return 1
      if (m.goles_visita > m.goles_local) return 2
      return 0
    }
    const brkFecha = (m) => {
      try {
        return new Date(m.kickoff).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', timeZone: 'America/Costa_Rica' })
      } catch (e) { return '' }
    }
    const brkEstado = (m) => {
      const t = tipo(m)
      if (t === 'live') return estadoTexto(m)
      if (t === 'fin') return 'Final'
      return brkFecha(m) + ' · ' + hora(m)
    }

    const calcBrkHeight = () => {
      const sc = brkScroll.value
      if (!sc) return
      const inner = sc.querySelector('.qn-brk2')
      if (!inner) return
      const rounds = inner.querySelectorAll('.qn-brk2-round')
      if (!rounds.length) return
      const slot = parseFloat(getComputedStyle(inner).getPropertyValue('--match-slot')) || 96
      const sl = sc.scrollLeft
      let lead = 0
      for (let i = 0; i < rounds.length; i++) {
        if (rounds[i].offsetLeft <= sl + 48) lead = i
      }
      const count = (brkTree.value[lead] && brkTree.value[lead].items.length) || 1
      brkH.value = Math.round(count * slot)
    }

    const onBrkScroll = () => {
      if (!brkRaf) brkRaf = requestAnimationFrame(() => { brkRaf = 0; calcBrkHeight() })
      if (brkSnapping) return
      if (brkSettleTimer) clearTimeout(brkSettleTimer)
      brkSettleTimer = setTimeout(brkSettle, 140)
    }

    const brkRoundEls = () => {
      const sc = brkScroll.value
      return sc ? Array.from(sc.querySelectorAll('.qn-brk2-round')) : []
    }
    const brkNearestIdx = (left) => {
      const els = brkRoundEls()
      let best = 0
      let bd = Infinity
      els.forEach((e, i) => { const d = Math.abs(e.offsetLeft - left); if (d < bd) { bd = d; best = i } })
      return best
    }
    const brkSnapTo = (left) => {
      const sc = brkScroll.value
      if (!sc) return
      brkSnapping = true
      sc.scrollTo({ left, behavior: 'smooth' })
      setTimeout(() => { brkSnapping = false; calcBrkHeight() }, 420)
    }
    const brkSettle = () => {
      if (brkSnapping) return
      const sc = brkScroll.value
      const els = brkRoundEls()
      if (!sc || !els.length) return
      const maxScroll = sc.scrollWidth - sc.clientWidth
      let lastFlush = 0
      els.forEach((e, i) => { if (e.offsetLeft <= maxScroll + 4) lastFlush = i })
      const cur = brkNearestIdx(sc.scrollLeft)

      if (cur >= lastFlush && brkLastIdx.value >= lastFlush) {
        const minLeft = els[lastFlush].offsetLeft
        if (sc.scrollLeft < minLeft - 4) brkSnapTo(minLeft)
        brkLastIdx.value = Math.max(lastFlush, cur)
        return
      }

      let target = cur
      if (cur - brkLastIdx.value > 1) target = brkLastIdx.value + 1
      else if (cur - brkLastIdx.value < -1) target = brkLastIdx.value - 1
      target = Math.max(0, Math.min(target, els.length - 1))
      brkLastIdx.value = target
      const dest = els[target].offsetLeft
      if (Math.abs(dest - sc.scrollLeft) > 1) brkSnapTo(dest)
    }

    const scrollTop = () => {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }) } catch (e) { window.scrollTo(0, 0) }
    }

    const onRefresh = async (done) => {
      try { await refrescar() } finally { if (typeof done === 'function') done() }
    }

    const measureHeader = () => {
      const h = document.querySelector('.q-header')
      headerH.value = h ? h.offsetHeight : 56
    }
    const onScroll = () => {
      if (!sentinel.value) { stickyShow.value = false; return }
      stickyShow.value = sentinel.value.getBoundingClientRect().top < headerH.value
    }
    const onResize = () => { measureHeader(); onScroll(); calcBrkHeight() }

    const guardarCelebrados = () => {
      try { localStorage.setItem(CELEB_KEY, JSON.stringify(Array.from(celebrados))) } catch (e) { /* noop */ }
    }
    const celebrar = (n) => {
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      notify({
        type: 'positive',
        message: n > 1 ? '¡' + n + ' marcadores exactos!' : '¡Marcador exacto! +' + cfg.value.pts_exacto + ' pts',
        icon: 'celebration',
        position: 'top'
      })
      if (reduce) return
      const layer = document.createElement('div')
      layer.className = 'qn-confetti'
      document.body.appendChild(layer)
      const colors = ['#ffd54f', '#f9a825', '#2e7d32', '#1b5e20', '#e53935', '#1e88e5', '#ffffff']
      const total = 90
      for (let i = 0; i < total; i++) {
        const p = document.createElement('span')
        p.className = 'qn-confetti-p'
        p.style.background = colors[i % colors.length]
        p.style.left = (Math.random() * 100) + 'vw'
        const size = 7 + Math.random() * 7
        p.style.width = size + 'px'
        p.style.height = (size * (0.4 + Math.random() * 0.6)) + 'px'
        if (Math.random() > 0.5) p.style.borderRadius = '50%'
        layer.appendChild(p)
        const dx = (Math.random() - 0.5) * 260
        const dy = window.innerHeight + 80
        const rot = (Math.random() - 0.5) * 1080
        const anim = p.animate([
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + rot + 'deg)', opacity: 1, offset: 0.85 },
          { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + rot + 'deg)', opacity: 0 }
        ], { duration: 2200 + Math.random() * 1600, delay: Math.random() * 350, easing: 'cubic-bezier(.2,.6,.35,1)', fill: 'forwards' })
        if (i === total - 1) anim.onfinish = () => { if (layer.parentNode) layer.remove() }
      }
      setTimeout(() => { if (layer.parentNode) layer.remove() }, 4800)
    }

    const seedForm = () => {
      for (const m of partidos.value) {
        if (!form[m.id]) form[m.id] = { gl: null, gv: null, def: null }
        const mp = misPron[m.id]
        if (mp) { form[m.id].gl = mp.goles_local; form[m.id].gv = mp.goles_visita; form[m.id].def = mp.def_pred || null }
        if (esKo(m)) {
          if (!penForm[m.id]) penForm[m.id] = { pl: null, plf: null, pv: null, pvf: null }
          penForm[m.id].pl = m.pen_local; penForm[m.id].plf = m.pen_local_fall
          penForm[m.id].pv = m.pen_visita; penForm[m.id].pvf = m.pen_visita_fall
        }
      }
    }

    const loadConfig = async () => {
      const { data } = await supabase.from('qn_config').select('*').eq('id', 1).single()
      if (data) cfg.value = data
    }

    const loadPartidos = async () => {
      const { data, error } = await supabase.from('qn_partidos').select('*').order('kickoff', { ascending: true })
      if (!error) { partidos.value = data || []; seedForm() }
    }

    const loadRanking = async () => {
      const { data } = await supabase.from('qn_ranking').select('*')
      ranking.value = (data || []).sort((a, b) => b.puntos - a.puntos || b.exactos - a.exactos)
    }

    const loadPosiciones = async () => {
      const { data } = await supabase.from('qn_posiciones').select('*')
      posiciones.value = data || []
    }

    const gruposPos = computed(() => {
      const map = new Map()
      for (const t of posiciones.value) {
        if (!map.has(t.grupo)) map.set(t.grupo, [])
        map.get(t.grupo).push(t)
      }
      const out = []
      for (const [grupo, equipos] of map) {
        equipos.sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.equipo.localeCompare(b.equipo))
        out.push({ grupo, equipos })
      }
      return out.sort((a, b) => a.grupo.localeCompare(b.grupo))
    })

    const equiposBase = computed(() => {
      const seen = new Map()
      for (const t of posiciones.value) {
        if (!seen.has(t.equipo)) seen.set(t.equipo, { label: t.equipo, value: t.equipo, logo: t.logo })
      }
      return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label, 'es'))
    })

    const campeonCerrado = computed(() => {
      const t = Date.parse(CAMPEON_CIERRA_DANIEL_V)
      return Number.isFinite(t) && now.value >= t
    })

    const campeonCierraLabel = computed(() => {
      const t = Date.parse(CAMPEON_CIERRA_DANIEL_V)
      if (!Number.isFinite(t)) return ''
      return new Intl.DateTimeFormat('es-CR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Costa_Rica' }).format(new Date(t)) + ' hora Costa Rica'
    })

    const filterCampeon = (val, update) => {
      update(() => {
        const n = (val || '').toLowerCase()
        campeonOptions.value = n
          ? equiposBase.value.filter(e => e.label.toLowerCase().includes(n))
          : equiposBase.value.slice()
      })
    }

    const loadMiCampeon = async () => {
      if (!identity.value) { miCampeon.value = null; campeonSel.value = null; return }
      const { data, error } = await supabase.rpc('qn_mi_campeon', { p_nombre: identity.value.nombre, p_pin: identity.value.pin })
      if (error) return
      const row = (data || [])[0] || null
      miCampeon.value = row
      campeonSel.value = row ? row.equipo : null
    }

    const guardarCampeon = async () => {
      if (!identity.value) { showJoin.value = true; return }
      if (!esDanielVCampeon.value) { notify({ type: 'negative', message: 'Solo Daniel V puede elegir campeon', position: 'top' }); return }
      if (campeonCerrado.value) { notify({ type: 'warning', message: 'Ya cerro la eleccion de campeon', position: 'top' }); return }
      if (!campeonSel.value) { notify({ type: 'warning', message: 'Elige un equipo', position: 'top' }); return }
      savingCampeon.value = true
      const { error } = await supabase.rpc('qn_guardar_campeon', { p_nombre: identity.value.nombre, p_pin: identity.value.pin, p_equipo: campeonSel.value })
      savingCampeon.value = false
      if (error) {
        const raw = (error && error.message) ? error.message : String(error)
        const msg = raw.includes('CAMPEON_CERRADO') ? 'Ya cerró la elección de campeón'
          : raw.includes('EQUIPO_INVALIDO') ? 'Equipo no válido'
          : msgFromError(error)
        notify({ type: 'negative', message: msg, position: 'top' }); return
      }
      await loadMiCampeon()
      notify({ type: 'positive', message: '¡Campeón guardado!', position: 'top' })
    }

    const loadMine = async () => {
      if (!identity.value) return
      const { data, error } = await supabase.rpc('qn_mis_pronosticos', { p_nombre: identity.value.nombre, p_pin: identity.value.pin })
      if (error) return
      for (const k in misPron) delete misPron[k]
      const exacto = cfg.value.pts_exacto
      const nuevos = []
      for (const r of (data || [])) {
        misPron[r.match_id] = { goles_local: r.goles_local, goles_visita: r.goles_visita, puntos: r.puntos, scored: r.scored, def_pred: r.def_pred }
        if (r.scored && r.puntos === exacto && !celebrados.has(r.match_id)) {
          nuevos.push(r.match_id)
          celebrados.add(r.match_id)
        }
      }
      guardarCelebrados()
      if (nuevos.length && !primeraCargaMine) celebrar(nuevos.length)
      primeraCargaMine = false
      seedForm()
    }

    const join = async () => {
      const nombre = (joinData.nombre || '').trim()
      const pin = (joinData.pin || '').trim()
      if (!nombre) { notify({ type: 'warning', message: 'Escribe tu nombre', position: 'top' }); return }
      if (!/^\d{4}$/.test(pin)) { notify({ type: 'warning', message: 'El PIN debe ser de 4 dígitos', position: 'top' }); return }
      joinLoading.value = true
      const { error } = await supabase.rpc('qn_registrar', { p_nombre: nombre, p_pin: pin })
      joinLoading.value = false
      if (error) { notify({ type: 'negative', message: msgFromError(error), position: 'top' }); return }
      identity.value = { nombre, pin }
      localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity.value))
      showJoin.value = false
      joinData.nombre = ''
      joinData.pin = ''
      await loadMine()
      await loadMiCampeon()
      await checkAdmin()
      notify({ type: 'positive', message: '¡Listo, ' + nombre + '!', position: 'top' })
    }

    const salir = () => {
      identity.value = null
      localStorage.removeItem(IDENTITY_KEY)
      esAdmin.value = false
      for (const k in misPron) delete misPron[k]
      miCampeon.value = null
      campeonSel.value = null
      primeraCargaMine = true
      seedForm()
      notify({ type: 'info', message: 'Saliste de la quiniela', position: 'top' })
    }

    const dismissPushHint = () => {
      pushHintDismissed.value = true
      localStorage.setItem('qn_push_hint_dismissed', '1')
    }

    const togglePush = async () => {
      if (!identity.value) { showJoin.value = true; return }
      if (pushDenied()) {
        notify({ type: 'warning', message: 'Activa las notificaciones del navegador para esta página', position: 'top' })
        return
      }
      pushBusy.value = true
      try {
        if (pushOn.value) {
          await unsubscribePush()
          pushOn.value = false
          notify({ type: 'info', message: 'Notificaciones desactivadas', position: 'top' })
        } else {
          await subscribePush(identity.value, cfg.value.vapid_public)
          pushOn.value = true
          notify({ type: 'positive', message: 'Te avisaremos de tus partidos', position: 'top' })
        }
      } catch (e) {
        const code = (e && e.message) ? e.message : String(e)
        const map = {
          PERM_DENIED: 'No diste permiso de notificaciones',
          NO_VAPID: 'Notificaciones no configuradas aún',
          UNSUPPORTED: 'Tu navegador no soporta notificaciones',
          NO_IDENTITY: 'Únete primero a la quiniela',
          FCM_STALE_DEVICE: 'Limpiamos el registro anterior de este dispositivo. Intenta activar las notificaciones otra vez.'
        }
        notify({ type: 'negative', message: map[code] || ('No se pudo: ' + code), position: 'top', timeout: 8000 })
      } finally {
        pushBusy.value = false
      }
    }

    const guardar = async (m) => {
      if (!identity.value) { showJoin.value = true; return }
      const f = form[m.id] || {}
      const gl = parseInt(f.gl, 10)
      const gv = parseInt(f.gv, 10)
      if (!Number.isInteger(gl) || !Number.isInteger(gv) || gl < 0 || gv < 0 || gl > 30 || gv > 30) {
        notify({ type: 'warning', message: 'Ingresa un marcador válido (0-30)', position: 'top' }); return
      }
      const ko = esKo(m)
      const def = ko ? (f.def || null) : null
      if (ko && !def) {
        notify({ type: 'warning', message: 'Elige si termina en 90 min o si llega a tiempo extra/penales', position: 'top' }); return
      }
      savingId.value = m.id
      const { error } = await supabase.rpc('qn_guardar_pronostico', {
        p_nombre: identity.value.nombre, p_pin: identity.value.pin, p_match_id: m.id, p_gl: gl, p_gv: gv, p_def: def
      })
      savingId.value = null
      if (error) { notify({ type: 'negative', message: msgFromError(error), position: 'top' }); return }
      misPron[m.id] = { goles_local: gl, goles_visita: gv, puntos: 0, scored: false, def_pred: def }
      notify({ type: 'positive', message: 'Pronóstico guardado', position: 'top' })
    }

    const checkAdmin = async () => {
      if (!identity.value) { esAdmin.value = false; return }
      const { data } = await supabase.rpc('qn_es_admin', { p_nombre: identity.value.nombre, p_pin: identity.value.pin })
      esAdmin.value = !!data
    }

    const setGanadorKo = async (m, lado) => {
      if (!identity.value) return
      penBusy.value = m.id
      const { error } = await supabase.rpc('qn_set_ganador_ko_user', {
        p_nombre: identity.value.nombre, p_pin: identity.value.pin, p_match_id: m.id, p_lado: lado
      })
      penBusy.value = null
      if (error) { notify({ type: 'negative', message: msgFromError(error), position: 'top' }); return }
      await refrescar()
      notify({ type: 'positive', message: 'Ganador por penales guardado', position: 'top' })
    }


    const setPenales = async (m) => {
      if (!identity.value) return
      const f = penForm[m.id] || {}
      const pl = parseInt(f.pl, 10)
      const pv = parseInt(f.pv, 10)
      const plf = Number.isInteger(parseInt(f.plf, 10)) ? parseInt(f.plf, 10) : 0
      const pvf = Number.isInteger(parseInt(f.pvf, 10)) ? parseInt(f.pvf, 10) : 0
      if (!Number.isInteger(pl) || !Number.isInteger(pv) || pl < 0 || pv < 0) {
        notify({ type: 'warning', message: 'Ingresa los penales anotados de cada equipo', position: 'top' }); return
      }
      if (pl === pv) {
        notify({ type: 'warning', message: 'En penales debe haber un ganador (anotados distintos)', position: 'top' }); return
      }
      penBusy.value = m.id
      const { error } = await supabase.rpc('qn_set_penales_user', {
        p_nombre: identity.value.nombre, p_pin: identity.value.pin, p_match_id: m.id,
        p_pl: pl, p_plf: plf, p_pv: pv, p_pvf: pvf
      })
      penBusy.value = null
      if (error) { notify({ type: 'negative', message: msgFromError(error), position: 'top' }); return }
      await refrescar()
      notify({ type: 'positive', message: 'Penales guardados', position: 'top' })
    }

    const togglePron = async (m) => {
      if (pubPron[m.id]) { delete pubPron[m.id]; return }
      const { data } = await supabase.from('qn_pronosticos_publicos').select('*').eq('match_id', m.id).order('puntos', { ascending: false })
      pubPron[m.id] = data || []
    }

    const refrescar = async () => {
      await Promise.all([loadPartidos(), loadRanking(), loadPosiciones()])
      await loadMine()
      await loadMiCampeon()
    }

    const toggleFecha = () => {
      if (calAbierto.value) { calAbierto.value = false; return }
      if (!fechaActiva.value) {
        let refPartido = null
        if (filtro.value === 'fin') {
          refPartido = partidos.value
            .filter(m => tipo(m) === 'fin')
            .sort((a, b) => ko(b) - ko(a))[0]
        }
        if (!refPartido) refPartido = partidos.value[0]
        const d = refPartido ? new Date(refPartido.kickoff) : new Date()
        const pad = (n) => String(n).padStart(2, '0')
        fechaCalendario.value = `2026-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
      }
      calAbierto.value = true
    }

    const alElegirFecha = () => {
      fechaActiva.value = true
      calAbierto.value = false
    }

    const limpiarFecha = () => {
      fechaActiva.value = false
      calAbierto.value = false
    }

    watch(tab, (t) => {
      if (t === 'llaves') {
        brkLastIdx.value = 0
        nextTick(() => {
          calcBrkHeight()
          requestAnimationFrame(() => { brkReady.value = true })
        })
      }
    })
    watch(brkTree, () => { nextTick(calcBrkHeight) })
    watch(equiposBase, (v) => { campeonOptions.value = v.slice() }, { immediate: true })

    onMounted(async () => {
      const saved = localStorage.getItem(IDENTITY_KEY)
      if (saved) { try { identity.value = JSON.parse(saved) } catch (e) { identity.value = null } }

      await loadConfig()
      await Promise.all([loadPartidos(), loadRanking(), loadPosiciones()])
      await loadMine()
      await loadMiCampeon()
      await checkAdmin()
      loading.value = false

      if (partidos.value.some(m => tipo(m) === 'live')) filtro.value = 'live'

      pushAvail.value = PUSH_HABILITADO && pushSupported()
      if (pushAvail.value && identity.value) {
        try { pushOn.value = await isSubscribed() } catch (e) { pushOn.value = false }
      }

      nowTimer = setInterval(() => { now.value = Date.now() }, 30000)
      clockTimer = setInterval(() => { clock.value = Date.now() }, 1000)
      pollTimer = setInterval(refrescar, 60000)

      await nextTick()
      measureHeader()
      onScroll()
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onResize)

      channel = supabase.channel('qn_rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'qn_partidos' }, (payload) => {
          const r = payload.new
          if (!r || !r.id) return
          const i = partidos.value.findIndex(p => p.id === r.id)
          if (i >= 0) partidos.value[i] = { ...partidos.value[i], ...r }
          else partidos.value.push(r)
          loadRanking()
          loadPosiciones()
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'qn_pronosticos' }, () => {
          loadRanking()
          loadMine()
        })
        .subscribe()
    })

    onUnmounted(() => {
      if (nowTimer) clearInterval(nowTimer)
      if (clockTimer) clearInterval(clockTimer)
      if (pollTimer) clearInterval(pollTimer)
      if (channel) supabase.removeChannel(channel)
      if (brkRaf) cancelAnimationFrame(brkRaf)
      if (brkSettleTimer) clearTimeout(brkSettleTimer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    })

    return {
      tab, cfg, partidos, ranking, gruposPos, misPron, pubPron, form, identity, loading, filtro, filtros,
      showJoin, joinData, joinLoading, savingId, inicial,
      esAdmin, penBusy, penForm, defLabel, setGanadorKo, setPenales,
      miCampeon, campeonSel, campeonOptions, savingCampeon, campeonVisible, esDanielVCampeon, campeonCerrado, campeonCierraLabel, filterCampeon, guardarCampeon,
      pushAvail, pushOn, pushBusy, pushHintDismissed, togglePush, dismissPushHint,
      tipo, hora, editable, esKo, locked, estadoTexto, lockIcon, lockTexto, grupos, esMio, abrirPron,
      enVivo, proximo, cuenta,
      stickyShow, headerH, sentinel, scrollTop, onRefresh,
      brkScroll, brkH, brkReady, onBrkScroll,
      brkTree, tercerLugar, hayEliminatorias, eliminatoriasVacias, ganador, brkEstado,
      fechaActiva, calAbierto, fechaCalendario, calendarLocale, fechaLabel,
      toggleFecha, limpiarFecha, alElegirFecha,
      join, salir, guardar, togglePron
    }
  }
})
</script>

<style scoped>
.qn-page {
  --qn-green: #1b5e20;
  --qn-green-dark: #14532d;
  --qn-amber: #f9a825;
  --qn-ink: #1a1a1a;
  --qn-muted: #6b7280;
  --qn-bg: #f4f6f4;
  --qn-surface: #ffffff;
  --qn-line: #e6eae6;
  --qn-divider: #f0f2f0;
  --qn-r-card: 12px;
  --qn-r-ctrl: 8px;
  background: var(--qn-bg);
  padding-bottom: calc(32px + env(safe-area-inset-bottom));
  -webkit-tap-highlight-color: transparent;
}

.qn-banner {
  position: relative;
  width: min(100%, 960px);
  aspect-ratio: 16 / 9;
  margin: 0 auto;
  background: #073b20;
}

.qn-banner-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.qn-banner-place {
  position: absolute;
  top: clamp(10px, 2.8vw, 20px);
  left: clamp(12px, 4vw, 32px);
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: calc(100% - 24px);
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(10, 40, 22, 0.85);
  color: #fff;
  font-size: clamp(12px, 2.5vw, 16px);
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.qn-banner-place .q-icon {
  color: #fff;
  flex-shrink: 0;
}

.qn-wrap { max-width: 720px; margin: -24px auto 0; padding: 0 16px 16px; position: relative; z-index: 2; }

.qn-identity {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--qn-surface);
  border-radius: var(--qn-r-card);
  padding: 10px 14px;
  border: 1px solid var(--qn-line);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.qn-rules { margin-top: 12px; background: var(--qn-surface); border-radius: var(--qn-r-card); overflow: hidden; border: 1px solid var(--qn-line); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04); }
.qn-rules-body { padding: 4px 16px 14px; font-size: 13px; color: var(--qn-ink); }
.qn-rules-tag { font-size: 12px; font-weight: 600; color: var(--qn-muted); margin: 8px 0 4px; }
.qn-rules-tag:first-child { margin-top: 0; }
.qn-rules-note { font-size: 12px; color: var(--qn-muted); padding-left: 2px; }
.qn-rules-note-dot { flex: 0 0 18px; width: 18px; height: 18px; margin-right: 8px; border-radius: 50%; background: #f3e2b3; color: #8a6d1a; font-weight: 700; font-size: 12px; line-height: 18px; text-align: center; }

.qn-champ {
  margin-top: 12px;
  background: var(--qn-surface);
  border-radius: var(--qn-r-card);
  padding: 14px 16px 16px;
  border: 1px solid var(--qn-line);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.qn-champ-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: var(--qn-green);
  margin-bottom: 12px;
}
.qn-champ-head .q-icon { color: var(--qn-amber); }
.qn-champ-select { margin-bottom: 10px; }
.qn-champ-flag { width: 28px; height: 20px; object-fit: cover; border-radius: 3px; }
.qn-champ-flag-lg { width: 46px; height: 33px; object-fit: cover; border-radius: 4px; }
.qn-champ-actions { display: flex; justify-content: flex-end; }
.qn-champ-hint { margin-top: 8px; font-size: 13px; color: var(--qn-green); display: flex; align-items: center; gap: 4px; }
.qn-champ-deadline { margin-top: 6px; font-size: 12px; color: var(--qn-muted); display: flex; align-items: center; gap: 4px; }
.qn-champ-join { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; font-size: 14px; color: var(--qn-ink); }
.qn-champ-locked { display: flex; align-items: center; gap: 12px; }
.qn-champ-locked-info { min-width: 0; }
.qn-champ-team { font-weight: 700; font-size: 16px; color: var(--qn-green); }
.qn-champ-sub { margin-top: 3px; font-size: 12px; color: var(--qn-muted); display: flex; align-items: center; }

.qn-next {
  margin-top: 12px;
  border-radius: var(--qn-r-card);
  overflow: hidden;
  background: var(--qn-green-dark);
  color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
.qn-live-dot {
  width: 9px; height: 9px; border-radius: 50%;
  background: #ff5252;
  box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7);
  animation: qnpulse 1.2s infinite;
}
@keyframes qnpulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.6); }
  70% { box-shadow: 0 0 0 8px rgba(255, 82, 82, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0); }
}
.qn-next-body { padding: 14px 16px 16px; text-align: center; }
.qn-next-tag {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.9;
  display: flex;
  align-items: center;
  justify-content: center;
}
.qn-next-timer {
  font-size: 38px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--qn-amber);
  font-variant-numeric: tabular-nums;
  margin: 2px 0 4px;
}
.qn-next-match {
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  flex-wrap: wrap;
}
.qn-next-vs { color: var(--qn-amber); font-weight: 700; }
.qn-next-flag { width: 24px; height: 17px; object-fit: cover; border-radius: 2px; }
.qn-next-sub { font-size: 12px; opacity: 0.85; margin-top: 3px; }

.qn-goles {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--qn-divider);
}
.qn-goles-col { flex: 1; min-width: 0; }
.qn-goles-right { text-align: right; }
.qn-gol {
  display: flex;
  align-items: center;
  font-size: 11.5px;
  color: var(--qn-ink);
  margin-bottom: 2px;
}
.qn-gol-r { justify-content: flex-end; }
.qn-gol-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qn-gol-min { color: var(--qn-muted); flex-shrink: 0; }

.qn-tarjetas {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid var(--qn-divider);
}
.qn-card-ic {
  display: inline-block;
  width: 9px;
  height: 13px;
  border-radius: 2px;
  margin-right: 5px;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}
.qn-card-yellow { background: #fbc02d; }
.qn-card-red { background: #e53935; }

.qn-tabs {
  margin-top: 14px;
  position: sticky;
  z-index: 5;
  background: var(--qn-bg);
  transition: top 0.25s ease;
}
.qn-panels { background: transparent; margin-top: 12px; }
.qn-panels :deep(.q-tab-panel) { padding: 0; }

.qn-filtros {
  display: flex;
  align-items: stretch;
  background: #e9ece9;
  border-radius: 10px;
  padding: 3px;
}
.qn-filtro {
  flex: 1;
  margin: 0;
  height: auto;
  min-height: 34px;
  padding: 0 6px;
  border-radius: var(--qn-r-ctrl);
  background: transparent;
  color: var(--qn-muted);
  font-size: 13px;
  font-weight: 600;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}
.qn-filtro :deep(.q-chip__content) { justify-content: center; }
.qn-filtro.qn-filtro-on {
  background: #fff;
  color: var(--qn-green);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.qn-fecha {
  font-weight: 700;
  color: var(--qn-green);
  text-transform: capitalize;
  margin: 4px 2px 10px;
  font-size: 14px;
  display: flex;
  align-items: center;
}
.qn-fecha::before {
  content: "";
  width: 6px; height: 18px;
  background: var(--qn-amber);
  border-radius: 3px;
  margin-right: 8px;
}

.qn-card {
  background: var(--qn-surface);
  border-radius: var(--qn-r-card);
  padding: 14px;
  margin-bottom: 12px;
  border: 1px solid var(--qn-line);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.qn-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.qn-ronda { font-size: 11px; font-weight: 700; color: var(--qn-muted); text-transform: uppercase; letter-spacing: 0.4px; }
.qn-estado { font-size: 12px; font-weight: 700; display: flex; align-items: center; padding: 3px 10px; border-radius: 999px; }
.qn-estado-prox { background: #e3f2fd; color: #1565c0; }
.qn-estado-live { background: #ffebee; color: #c62828; }
.qn-estado-fin { background: #e8f5e9; color: #1b5e20; }

.qn-blink { animation: qnblink 1s infinite; }
@keyframes qnblink { 50% { opacity: 0.25; } }

.qn-match { display: flex; align-items: flex-start; justify-content: space-between; }
.qn-team { width: 38%; display: flex; flex-direction: column; align-items: center; text-align: center; }
.qn-logo { width: 46px; height: 46px; object-fit: contain; }
.qn-team-name { font-size: 13px; font-weight: 700; margin-top: 6px; line-height: 1.2; }

.qn-center { width: 24%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding-top: 4px; }
.qn-score { font-size: 26px; font-weight: 700; color: var(--qn-ink); }
.qn-dash { color: #bbb; }
.qn-vs { font-size: 16px; font-weight: 700; color: #455a64; }
.qn-hora { font-size: 12px; color: var(--qn-muted); margin-top: 2px; font-weight: 600; }

.qn-pred { margin-top: 12px; border-top: 1px solid var(--qn-divider); padding-top: 10px; }
.qn-pred-row { display: flex; align-items: center; justify-content: center; }
.qn-num { width: 62px; }
.qn-pred-x { font-size: 20px; font-weight: 700; margin: 0 8px; color: var(--qn-muted); }
.qn-pred-hint { text-align: center; font-size: 12px; color: var(--qn-green); margin-top: 6px; }
.qn-pred-def { margin-top: 10px; }
.qn-pred-def-q { font-size: 12px; color: var(--qn-muted); text-align: center; margin-bottom: 4px; }
.qn-def-toggle { border: 1px solid var(--qn-line); border-radius: var(--qn-r-ctrl); overflow: hidden; font-size: 12px; }
.qn-mine-def { font-size: 11px; color: #b06f00; margin-left: 6px; white-space: nowrap; }
.qn-admin-pen { margin-bottom: 10px; padding: 8px; border: 1px solid rgba(200, 161, 74, 0.45); border-radius: var(--qn-r-ctrl); background: #fff8e8; }
.qn-admin-pen-q { font-size: 12px; color: #8a6d1a; font-weight: 600; text-align: center; margin-bottom: 6px; }
.qn-admin-pen-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.qn-admin-pen-team { flex: 1; min-width: 0; font-size: 12.5px; font-weight: 600; color: #5a4a14; }
.qn-admin-pen-in { width: 78px; flex: 0 0 78px; }
.qn-penales { text-align: center; font-size: 12.5px; color: var(--qn-ink); margin-top: 8px; display: flex; align-items: center; justify-content: center; }
.qn-penales-num { margin: 0 8px; font-size: 13px; color: var(--qn-ink); }
.qn-pen-dots { display: inline-flex; align-items: center; gap: 3px; }
.qn-pen-dot { width: 9px; height: 9px; border-radius: 50%; box-sizing: border-box; flex-shrink: 0; }
.qn-pen-ok { background: var(--qn-green); }
.qn-pen-miss { background: #fff; border: 1.5px solid #c62828; }

.qn-mine { font-size: 13px; color: var(--qn-ink); display: flex; align-items: center; justify-content: center; }
.qn-locked { font-size: 12.5px; color: var(--qn-muted); display: flex; align-items: center; justify-content: center; font-weight: 600; }

.qn-pub { margin-top: 8px; background: var(--qn-bg); border-radius: var(--qn-r-ctrl); padding: 4px 10px; }
.qn-btn-cta { min-height: 44px; }
.qn-btn-pron {
  min-height: 44px;
  padding: 0 18px;
  font-weight: 700;
}
.qn-btn-pron :deep(.q-icon) { font-size: 20px; }
.qn-pred .qn-btn-pron { margin-top: 8px; }
.qn-pub-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 5px 2px; border-bottom: 1px solid var(--qn-divider); font-size: 13px; }
.qn-pub-row:last-child { border-bottom: none; }

.qn-rank { background: var(--qn-surface); border-radius: var(--qn-r-card); overflow: hidden; border: 1px solid var(--qn-line); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04); }
.qn-rank-row { display: flex; align-items: center; gap: 12px; min-height: 64px; padding: 10px 14px; position: relative; cursor: pointer; transition: background 0.1s; }
.qn-rank-row:not(:last-child)::after { content: ""; position: absolute; left: 60px; right: 0; bottom: 0; height: 1px; background: var(--qn-divider); }
.qn-rank-row:active { background: rgba(0, 0, 0, 0.05); }
.qn-rank-row.qn-me { background: rgba(27, 94, 32, 0.06); box-shadow: inset 3px 0 0 var(--qn-green); }
.qn-pos { width: 30px; height: 30px; border-radius: 50%; background: #eee; color: var(--qn-muted); font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.qn-medal {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
}
.qn-medal-1 { background: #f5b800; }
.qn-medal-2 { background: #aeb9c0; }
.qn-medal-3 { background: #c07a3e; }
.qn-rank-name { flex: 1; font-weight: 700; min-width: 0; }
.qn-yo { background: var(--qn-green); color: #fff; font-size: 10px; padding: 1px 6px; border-radius: 8px; margin-left: 6px; vertical-align: middle; }
.qn-rank-pts { font-weight: 700; font-size: 20px; color: var(--qn-green); font-variant-numeric: tabular-nums; }
.qn-rank-pts span { font-size: 11px; font-weight: 600; color: var(--qn-muted); margin-left: 3px; }

.qn-grupo { margin-bottom: 18px; }
.qn-grupo-head {
  font-weight: 700;
  color: var(--qn-green);
  font-size: 14px;
  margin: 2px 2px 8px;
  display: flex;
  align-items: center;
}
.qn-grupo-head::before {
  content: "";
  width: 6px; height: 16px;
  background: var(--qn-amber);
  border-radius: 3px;
  margin-right: 8px;
}
.qn-tabla { background: var(--qn-surface); border-radius: var(--qn-r-card); overflow: hidden; border: 1px solid var(--qn-line); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04); }
.qn-tabla-row {
  display: flex;
  align-items: center;
  padding: 9px 10px;
  position: relative;
  font-size: 13px;
}
.qn-tabla-row:not(:last-child)::after { content: ""; position: absolute; left: 32px; right: 0; bottom: 0; height: 1px; background: var(--qn-divider); }
.qn-tabla-head {
  background: var(--qn-green);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 7px 10px;
}
.qn-tabla-head::after { display: none; }
.qn-col-pos { width: 22px; text-align: center; font-weight: 700; color: var(--qn-muted); flex-shrink: 0; }
.qn-tabla-head .qn-col-pos { color: #fff; }
.qn-col-eq { flex: 1; min-width: 0; display: flex; align-items: center; gap: 7px; font-weight: 600; }
.qn-tabla-flag { width: 22px; height: 15px; object-fit: cover; border-radius: 2px; flex-shrink: 0; }
.qn-col-n { width: 30px; text-align: center; flex-shrink: 0; color: var(--qn-muted); font-variant-numeric: tabular-nums; }
.qn-col-pts { font-weight: 700; color: var(--qn-green); width: 34px; }
.qn-tabla-head .qn-col-n, .qn-tabla-head .qn-col-pts { color: #fff; }
.qn-clasifica { border-left: 4px solid var(--qn-green); }
.qn-clasifica .qn-col-pos { color: var(--qn-green); }
.qn-tabla-nota {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: var(--qn-muted);
  margin: 4px 4px 8px;
}
.qn-clasifica-dot { width: 10px; height: 10px; border-radius: 2px; background: var(--qn-green); flex-shrink: 0; }
.qn-rank-go { flex-shrink: 0; }

.qn-push-hint {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--qn-surface);
  border: 1px solid var(--qn-line);
  border-radius: var(--qn-r-card);
  padding: 10px 12px;
  margin-top: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.qn-push-hint-icon { flex-shrink: 0; }
.qn-push-hint-text { flex: 1; min-width: 0; }

.qn-hint-enter-active, .qn-hint-leave-active { transition: max-height 0.25s ease, opacity 0.25s ease; overflow: hidden; max-height: 80px; }
.qn-hint-enter-from, .qn-hint-leave-to { max-height: 0; opacity: 0; }

.qn-join { width: 360px; max-width: 92vw; border-radius: 12px; }

.qn-date-wrap { margin-bottom: 12px; }
.qn-date-toggle { min-height: 32px; }
.qn-date-label { font-size: 13px; font-weight: 700; color: var(--qn-green); margin-left: 8px; }

.qn-calendar-shell {
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  margin-bottom: 4px;
  padding: 8px;
  background: var(--qn-surface);
  border: 1px solid var(--qn-line);
  border-radius: var(--qn-r-card);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.qn-calendar-picker {
  width: 100%;
  max-width: 380px;
  box-shadow: none;
}
.qn-calendar-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 4px 4px 2px 12px;
  border-top: 1px solid var(--qn-divider);
}
.qn-calendar-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--qn-muted);
  font-size: 12px;
}

.qn-calendar-enter-active, .qn-calendar-leave-active {
  transition: max-height 0.28s ease, opacity 0.28s ease;
  overflow: hidden;
  max-height: 520px;
}
.qn-calendar-enter-from, .qn-calendar-leave-to {
  max-height: 0;
  opacity: 0;
}

.qn-sentinel { height: 1px; width: 100%; pointer-events: none; }

.qn-sticky {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 1500;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px calc(14px + env(safe-area-inset-right)) 9px calc(14px + env(safe-area-inset-left));
  background: var(--qn-green-dark);
  color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
}
.qn-sticky:active { opacity: 0.85; }
.qn-sticky-flag { width: 22px; height: 16px; object-fit: cover; border-radius: 2px; flex-shrink: 0; }
.qn-sticky-team { max-width: 30%; font-weight: 700; }
.qn-sticky-team-r { text-align: right; }
.qn-sticky-score { color: var(--qn-amber); font-size: 17px; font-weight: 700; font-variant-numeric: tabular-nums; flex-shrink: 0; }
.qn-sticky-vs { color: var(--qn-amber); font-weight: 700; font-size: 12px; flex-shrink: 0; }
.qn-sticky-min { margin-left: auto; font-size: 12px; font-weight: 700; color: var(--qn-amber); flex-shrink: 0; font-variant-numeric: tabular-nums; }
.qn-sticky-count { margin-left: auto; font-size: 15px; font-weight: 700; color: var(--qn-amber); font-variant-numeric: tabular-nums; flex-shrink: 0; }

.qn-sticky-enter-active, .qn-sticky-leave-active { transition: transform 0.25s ease, opacity 0.25s ease; }
.qn-sticky-enter-from, .qn-sticky-leave-to { transform: translateY(-100%); opacity: 0; }

.qn-sk-card :deep(.q-skeleton) { --q-skeleton-bg: rgba(0, 0, 0, 0.07); }
.qn-sk-team { width: 38%; }
.qn-sk-rank-row { cursor: default; }

.qn-brk-hint {
  display: flex;
  align-items: center;
  background: #e3f2fd;
  color: #1565c0;
  border-radius: var(--qn-r-card);
  padding: 9px 12px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
}
.qn-brk-scrollhint {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--qn-muted);
  font-size: 11.5px;
  font-weight: 600;
  margin-bottom: 8px;
}
.qn-brk-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 10px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}
.qn-brk2 {
  --gut: 26px;
  --line: #c4cfc4;
  --match-slot: 98px;
  display: flex;
  align-items: stretch;
  width: max-content;
  min-width: 100%;
}
.qn-brk2-round {
  flex: 0 0 auto;
  width: 156px;
  display: flex;
  flex-direction: column;
}
.qn-brk2-round:not(:last-child) { margin-right: var(--gut); }
.qn-brk2-roundhead {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--qn-green);
  text-align: center;
  padding: 6px 0;
  margin-bottom: 8px;
  background: var(--qn-surface);
  border: 1px solid var(--qn-line);
  border-radius: 999px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.qn-brk2-matches {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  height: var(--brk-h, calc(var(--match-slot) * 16));
}
.qn-brk2-anim .qn-brk2-matches {
  transition: height 0.5s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.qn-brk2-match {
  flex: 1 1 0;
  min-height: var(--match-slot);
  display: flex;
  align-items: center;
  position: relative;
}
.qn-brk2-card {
  width: 100%;
  background: var(--qn-surface);
  border-radius: var(--qn-r-card);
  padding: 7px 9px;
  border: 1px solid var(--qn-line);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  position: relative;
  z-index: 1;
}

.qn-brk2-round:not(:last-child) .qn-brk2-match::after {
  content: "";
  position: absolute;
  left: 100%;
  top: 50%;
  width: calc(var(--gut) / 2);
  height: 2px;
  background: var(--line);
}
.qn-brk2-round:not(:last-child) .qn-brk2-match:nth-child(odd)::before {
  content: "";
  position: absolute;
  left: calc(100% + var(--gut) / 2 - 1px);
  top: 50%;
  width: 2px;
  height: 100%;
  background: var(--line);
}
.qn-brk2-round:not(:first-child) .qn-brk2-card::before {
  content: "";
  position: absolute;
  right: 100%;
  top: 50%;
  width: calc(var(--gut) / 2);
  height: 2px;
  background: var(--line);
}

.qn-brk-3rd {
  margin-top: 16px;
  max-width: 320px;
}
.qn-brk-3rd-head {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--qn-muted);
  margin-bottom: 6px;
}
.qn-brk-state {
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--qn-muted);
}
.qn-brk-state-live { color: #c62828; }
.qn-brk-state-fin { color: var(--qn-green); }
.qn-brk-livedot { width: 7px; height: 7px; }
.qn-brk-team {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--qn-ink);
}
.qn-brk-team + .qn-brk-team { border-top: 1px solid var(--qn-divider); }
.qn-brk-win { font-weight: 700; color: var(--qn-ink); }
.qn-brk-dim { color: var(--qn-muted); font-weight: 600; font-style: italic; }
.qn-brk-flag { width: 22px; height: 16px; object-fit: cover; border-radius: 2px; flex-shrink: 0; }
.qn-brk-ph { width: 22px; height: 16px; border-radius: 2px; background: #ececec; flex-shrink: 0; }
.qn-brk-name { flex: 1; min-width: 0; }
.qn-brk-score { font-weight: 700; font-size: 14px; color: var(--qn-ink); flex-shrink: 0; font-variant-numeric: tabular-nums; }
.qn-brk-win .qn-brk-score { color: var(--qn-green); }

@media (max-width: 599px) {
  .qn-logo { width: 40px; height: 40px; }
  .qn-team-name { font-size: 12px; }
  .qn-score { font-size: 22px; }
  .qn-calendar-shell { padding: 4px; }
  .qn-calendar-actions { padding-left: 8px; }
  .qn-hide-xs { display: none; }
  .qn-brk2 { --gut: 20px; --match-slot: 94px; }
  .qn-brk2-round { width: 144px; }
}

@media (prefers-reduced-motion: reduce) {
  .qn-calendar-enter-active, .qn-calendar-leave-active { transition: none; }
  .qn-sticky-enter-active, .qn-sticky-leave-active { transition: none; }
  .qn-brk2-anim .qn-brk2-matches { transition: none; }
  .qn-tabs { transition: none; }
}
</style>

<style>
.qn-confetti {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 0;
  z-index: 100000;
  pointer-events: none;
  overflow: visible;
}
.qn-confetti-p {
  position: absolute;
  top: -14px;
  display: block;
  will-change: transform, opacity;
}
</style>

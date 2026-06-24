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
            <q-btn unelevated no-caps rounded color="green-8" icon="how_to_reg" label="Unirme" @click="showJoin = true" />
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
            <div class="qn-next-tag qn-shimmer"><span class="qn-live-dot"></span> En vivo</div>
            <div class="qn-next-timer qn-shimmer">{{ enVivo.goles_local ?? 0 }} <span class="qn-next-vs">-</span> {{ enVivo.goles_visita ?? 0 }}</div>
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
          <div class="row no-wrap items-start q-mb-xs"><q-icon name="check_circle" color="green-7" size="18px" class="q-mr-sm" /><span>Acertar el marcador exacto: <b class="q-ml-xs">{{ cfg.pts_exacto }} pts</b></span></div>
          <div class="row no-wrap items-start q-mb-xs"><q-icon name="check_circle" color="blue-7" size="18px" class="q-mr-sm" /><span>Acertar solo el resultado (quién gana o si empata), sin el marcador: <b class="q-ml-xs">{{ cfg.pts_resultado }} pt</b></span></div>
          <div class="row no-wrap items-start text-grey-7"><q-icon name="schedule" size="16px" class="q-mr-sm" /><span>Los pronósticos se abren {{ cfg.abre_horas_antes }} h antes y se bloquean {{ cfg.bloquea_minutos_antes }} min antes del partido. Después del bloqueo ya puedes ver los pronósticos de los demás.</span></div>
        </div>
      </q-expansion-item>

      <q-tabs v-model="tab" class="qn-tabs" active-color="green-9" indicator-color="amber-8" align="justify" no-caps dense>
        <q-tab name="partidos" icon="sports_soccer" label="Partidos" />
        <q-tab name="posiciones" icon="table_chart" label="Posiciones" />
        <q-tab v-if="hayEliminatorias" name="llaves" icon="account_tree" label="Llaves" />
        <q-tab name="ranking" icon="leaderboard" label="Ranking" />
      </q-tabs>

      <q-tab-panels v-model="tab" animated class="qn-panels">
        <q-tab-panel name="partidos" class="q-pa-none">
          <div class="qn-filtros row q-gutter-xs q-mb-md">
            <q-chip v-for="f in filtros" :key="f.value" clickable :selected="filtro === f.value"
              :color="filtro === f.value ? 'green-8' : 'grey-3'"
              :text-color="filtro === f.value ? 'white' : 'grey-8'"
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

              <div v-if="tipo(m) !== 'prox' && ((m.goleadores_local && m.goleadores_local.length) || (m.goleadores_visita && m.goleadores_visita.length))" class="qn-goles">
                <div class="qn-goles-col">
                  <div v-for="(g, i) in (m.goleadores_local || [])" :key="'l' + i" class="qn-gol">
                    <q-icon name="sports_soccer" size="11px" :color="g.owngoal ? 'red-6' : 'grey-7'" class="q-mr-xs" />
                    <span class="qn-gol-name ellipsis">{{ g.name }}</span>
                    <span class="qn-gol-min">&nbsp;{{ g.minute }}'{{ g.penalty ? ' (P)' : '' }}{{ g.owngoal ? ' (ag)' : '' }}</span>
                  </div>
                </div>
                <div class="qn-goles-col qn-goles-right">
                  <div v-for="(g, i) in (m.goleadores_visita || [])" :key="'v' + i" class="qn-gol qn-gol-r">
                    <span class="qn-gol-min">{{ g.minute }}'{{ g.penalty ? ' (P)' : '' }}{{ g.owngoal ? ' (ag)' : '' }}&nbsp;</span>
                    <span class="qn-gol-name ellipsis">{{ g.name }}</span>
                    <q-icon name="sports_soccer" size="11px" :color="g.owngoal ? 'red-6' : 'grey-7'" class="q-ml-xs" />
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
                      :loading="savingId === m.id" label="Guardar" class="q-ml-sm" @click="guardar(m)" />
                    <q-btn v-else unelevated no-caps rounded color="amber-8" icon="how_to_reg"
                      label="Unirme" class="q-ml-sm" @click="showJoin = true" />
                  </div>
                  <div v-if="misPron[m.id]" class="qn-pred-hint">
                    <q-icon name="bookmark" size="14px" /> Tu pronóstico actual: {{ misPron[m.id].goles_local }} - {{ misPron[m.id].goles_visita }}
                  </div>
                </template>

                <template v-else>
                  <div v-if="misPron[m.id]" class="qn-mine">
                    <span>Tu pronóstico: <b>{{ misPron[m.id].goles_local }} - {{ misPron[m.id].goles_visita }}</b></span>
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
            <div class="qn-brk-scroll">
              <div class="qn-brk2">
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
          <q-btn unelevated no-caps rounded color="green-8" label="Entrar" :loading="joinLoading" @click="join" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'
import { notify } from '../utils/notify'
import { pushSupported, pushDenied, isSubscribed, subscribePush, unsubscribePush } from '../utils/push'

const PUSH_HABILITADO = false

const IDENTITY_KEY = 'quiniela_identity'
const CELEB_KEY = 'quiniela_celebrados'
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

const KO_BASE = {
  Dieciseisavos: 73,
  'Octavos de final': 89,
  'Cuartos de final': 97,
  Semifinal: 101,
  'Tercer lugar': 103,
  Final: 104
}
const FEEDERS = {
  89: [73, 75], 90: [74, 77], 91: [76, 78], 92: [79, 80],
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

const ERROR_MSG = {
  CREDENCIALES: 'Nombre o PIN incorrecto',
  PIN_INCORRECTO: 'PIN incorrecto para ese nombre',
  PIN_INVALIDO: 'El PIN debe ser de 4 dígitos',
  NOMBRE_VACIO: 'Escribe tu nombre',
  BLOQUEADO: 'Ya no se puede cambiar: falta menos de 15 minutos',
  AUN_NO_ABRE: 'Aún no se habilita (abre 12 h antes)',
  PARTIDO_NO_EXISTE: 'Partido no encontrado',
  MARCADOR_INVALIDO: 'Marcador inválido'
}

function msgFromError (e) {
  const raw = (e && e.message) ? e.message : String(e)
  for (const k in ERROR_MSG) { if (raw.includes(k)) return ERROR_MSG[k] }
  return 'No se pudo completar la acción'
}

export default defineComponent({
  name: 'QuinielaPage',
  setup () {
    const router = useRouter()
    const tab = ref('partidos')
    const cfg = ref({ abre_horas_antes: 12, bloquea_minutos_antes: 15, pts_exacto: 3, pts_resultado: 1, pts_bonus_equipo: 1 })
    const partidos = ref([])
    const ranking = ref([])
    const posiciones = ref([])
    const misPron = reactive({})
    const pubPron = reactive({})
    const form = reactive({})
    const identity = ref(null)
    const now = ref(Date.now())
    const clock = ref(Date.now())
    const loading = ref(true)
    const filtro = ref('prox')
    const showJoin = ref(false)
    const joinData = reactive({ nombre: '', pin: '' })
    const joinLoading = ref(false)
    const savingId = ref(null)
    const pushAvail = ref(false)
    const pushOn = ref(false)
    const pushBusy = ref(false)
    const pushHintDismissed = ref(localStorage.getItem('qn_push_hint_dismissed') === '1')
    const fechaActiva = ref(false)
    const calAbierto = ref(false)
    const stickyShow = ref(false)
    const headerH = ref(56)
    const sentinel = ref(null)
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
        const base = KO_BASE[r.ronda]
        const items = partidos.value.filter(m => m.ronda === r.ronda).sort((a, b) => ko(a) - ko(b))
        if (!items.length) continue
        const withNum = items.map((m, i) => ({ m, num: base + i }))
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
    const onResize = () => { measureHeader(); onScroll() }

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
        if (!form[m.id]) form[m.id] = { gl: null, gv: null }
        const mp = misPron[m.id]
        if (mp) { form[m.id].gl = mp.goles_local; form[m.id].gv = mp.goles_visita }
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

    const loadMine = async () => {
      if (!identity.value) return
      const { data, error } = await supabase.rpc('qn_mis_pronosticos', { p_nombre: identity.value.nombre, p_pin: identity.value.pin })
      if (error) return
      for (const k in misPron) delete misPron[k]
      const exacto = cfg.value.pts_exacto
      const nuevos = []
      for (const r of (data || [])) {
        misPron[r.match_id] = { goles_local: r.goles_local, goles_visita: r.goles_visita, puntos: r.puntos, scored: r.scored }
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
      notify({ type: 'positive', message: '¡Listo, ' + nombre + '!', position: 'top' })
    }

    const salir = () => {
      identity.value = null
      localStorage.removeItem(IDENTITY_KEY)
      for (const k in misPron) delete misPron[k]
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
          NO_IDENTITY: 'Únete primero a la quiniela'
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
      savingId.value = m.id
      const { error } = await supabase.rpc('qn_guardar_pronostico', {
        p_nombre: identity.value.nombre, p_pin: identity.value.pin, p_match_id: m.id, p_gl: gl, p_gv: gv
      })
      savingId.value = null
      if (error) { notify({ type: 'negative', message: msgFromError(error), position: 'top' }); return }
      misPron[m.id] = { goles_local: gl, goles_visita: gv, puntos: 0, scored: false }
      notify({ type: 'positive', message: 'Pronóstico guardado', position: 'top' })
    }

    const togglePron = async (m) => {
      if (pubPron[m.id]) { delete pubPron[m.id]; return }
      const { data } = await supabase.from('qn_pronosticos_publicos').select('*').eq('match_id', m.id).order('puntos', { ascending: false })
      pubPron[m.id] = data || []
    }

    const refrescar = async () => {
      await Promise.all([loadPartidos(), loadRanking(), loadPosiciones()])
      await loadMine()
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

    onMounted(async () => {
      const saved = localStorage.getItem(IDENTITY_KEY)
      if (saved) { try { identity.value = JSON.parse(saved) } catch (e) { identity.value = null } }

      await loadConfig()
      await Promise.all([loadPartidos(), loadRanking(), loadPosiciones()])
      await loadMine()
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
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    })

    return {
      tab, cfg, partidos, ranking, gruposPos, misPron, pubPron, form, identity, loading, filtro, filtros,
      showJoin, joinData, joinLoading, savingId, inicial,
      pushAvail, pushOn, pushBusy, pushHintDismissed, togglePush, dismissPushHint,
      tipo, hora, editable, locked, estadoTexto, lockIcon, lockTexto, grupos, esMio, abrirPron,
      enVivo, proximo, cuenta,
      stickyShow, headerH, sentinel, scrollTop, onRefresh,
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
  background: #f4f7f4;
  padding-bottom: 32px;
}

.qn-banner {
  position: relative;
  width: min(100%, 960px);
  aspect-ratio: 16 / 9;
  margin: 0 auto;
  background: #073b20;
  -webkit-mask-image: linear-gradient(to bottom, #000 62%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 62%, transparent 100%);
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
  border: 1px solid rgba(255, 213, 79, 0.62);
  background:
    radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.16), transparent 34%),
    linear-gradient(135deg, rgba(7, 59, 32, 0.88), rgba(47, 125, 50, 0.76));
  color: #fff6d7;
  box-shadow: 0 8px 20px rgba(2, 28, 14, 0.28);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  font-size: clamp(12px, 2.5vw, 16px);
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
  white-space: nowrap;
}

.qn-banner-place .q-icon {
  color: #ffd54f;
  flex-shrink: 0;
}

.qn-wrap { max-width: 720px; margin: 0 auto; padding: 16px; }

.qn-identity {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 16px;
  padding: 10px 14px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  margin-top: 14px;
  position: relative;
  z-index: 2;
  border: 1px solid rgba(46, 125, 50, 0.12);
}

.qn-rules { margin-top: 12px; background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); }
.qn-rules-body { padding: 4px 16px 14px; font-size: 13px; color: #333; }

.qn-next {
  margin-top: 12px;
  border-radius: 16px;
  overflow: hidden;
  background:
    radial-gradient(circle at 90% 10%, rgba(255, 213, 79, 0.22), transparent 45%),
    linear-gradient(135deg, #14532d 0%, #1b5e20 60%, #0f3d18 100%);
  color: #fff;
  box-shadow: 0 8px 22px rgba(20, 83, 45, 0.35);
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
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  opacity: 0.9;
  display: flex;
  align-items: center;
  justify-content: center;
}
.qn-next-timer {
  font-size: 38px;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: 1px;
  color: #ffd54f;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  margin: 2px 0 4px;
}
.qn-next-match {
  font-size: 15px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  flex-wrap: wrap;
}
.qn-next-vs { color: #ffd54f; font-weight: 700; }
.qn-next-flag { width: 24px; height: 17px; object-fit: cover; border-radius: 2px; }
.qn-next-sub { font-size: 12px; opacity: 0.85; margin-top: 3px; }

.qn-shimmer {
  background-image: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0) 20%,
    rgba(255, 255, 255, 0.5) 50%,
    rgba(255, 255, 255, 0) 80%,
    transparent 100%
  );
  background-size: 300% 100%;
  background-repeat: no-repeat;
  animation: qn-shimmer-sweep 2s ease-in-out infinite alternate;
}
@keyframes qn-shimmer-sweep {
  0% { background-position: 0% 0; }
  100% { background-position: 100% 0; }
}

.qn-goles {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed #eee;
}
.qn-goles-col { flex: 1; min-width: 0; }
.qn-goles-right { text-align: right; }
.qn-gol {
  display: flex;
  align-items: center;
  font-size: 11.5px;
  color: #444;
  margin-bottom: 2px;
}
.qn-gol-r { justify-content: flex-end; }
.qn-gol-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qn-gol-min { color: #888; flex-shrink: 0; }

.qn-tarjetas {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed #f0f0f0;
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

.qn-tabs { margin-top: 14px; background: #fff; border-radius: 14px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); }
.qn-panels { background: transparent; margin-top: 12px; }
.qn-panels :deep(.q-tab-panel) { padding: 0; }

.qn-filtros { flex-wrap: wrap; }

.qn-fecha {
  font-weight: 800;
  color: #1b5e20;
  text-transform: capitalize;
  margin: 4px 2px 10px;
  font-size: 14px;
  display: flex;
  align-items: center;
}
.qn-fecha::before {
  content: "";
  width: 6px; height: 18px;
  background: linear-gradient(180deg, #ffd54f, #f9a825);
  border-radius: 3px;
  margin-right: 8px;
}

.qn-card {
  background: #fff;
  border-radius: 18px;
  padding: 14px;
  margin-bottom: 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.07);
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-left: 5px solid #bdbdbd;
}
.qn-card.qn-live { border-left-color: #e53935; }
.qn-card.qn-fin { border-left-color: #1b5e20; }
.qn-card.qn-prox { border-left-color: #1e88e5; }

.qn-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.qn-ronda { font-size: 11px; font-weight: 700; color: #757575; text-transform: uppercase; letter-spacing: 0.4px; }
.qn-estado { font-size: 12px; font-weight: 800; display: flex; align-items: center; padding: 3px 10px; border-radius: 999px; }
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
.qn-score { font-size: 26px; font-weight: 900; color: #1a1a1a; }
.qn-dash { color: #bbb; }
.qn-vs { font-size: 16px; font-weight: 900; color: #455a64; }
.qn-hora { font-size: 12px; color: #757575; margin-top: 2px; font-weight: 600; }

.qn-pred { margin-top: 12px; border-top: 1px dashed #e0e0e0; padding-top: 10px; }
.qn-pred-row { display: flex; align-items: center; justify-content: center; }
.qn-num { width: 62px; }
.qn-pred-x { font-size: 20px; font-weight: 900; margin: 0 8px; color: #757575; }
.qn-pred-hint { text-align: center; font-size: 12px; color: #2e7d32; margin-top: 6px; }

.qn-mine { font-size: 13px; color: #333; display: flex; align-items: center; justify-content: center; }
.qn-locked { font-size: 12.5px; color: #9e9e9e; display: flex; align-items: center; justify-content: center; font-weight: 600; }

.qn-pub { margin-top: 8px; background: #fafafa; border-radius: 12px; padding: 4px 10px; }
.qn-btn-pron {
  min-height: 38px;
  padding: 0 18px;
  font-weight: 700;
  letter-spacing: 0.2px;
  box-shadow: 0 4px 12px rgba(27, 94, 32, 0.28);
}
.qn-btn-pron :deep(.q-icon) { font-size: 20px; }
.qn-pred .qn-btn-pron { margin-top: 8px; }
.qn-pub-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 5px 2px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
.qn-pub-row:last-child { border-bottom: none; }

.qn-rank { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); }
.qn-rank-row { display: flex; align-items: center; gap: 12px; min-height: 64px; padding: 10px 14px; border-bottom: 1px solid #f2f2f2; cursor: pointer; transition: background 0.15s, box-shadow 0.15s; }
.qn-rank-row:last-child { border-bottom: none; }
.qn-rank-row:hover { background: rgba(46, 125, 50, 0.06); }
.qn-rank-row.qn-me:not(.qn-rank-place-1):not(.qn-rank-place-2):not(.qn-rank-place-3) { background: linear-gradient(90deg, rgba(255, 213, 79, 0.18), transparent); }
.qn-rank-row.qn-me { box-shadow: inset 3px 0 0 rgba(46, 125, 50, 0.75); }
.qn-rank-row.qn-rank-place-1 { background: linear-gradient(90deg, #fff1b8 0%, #fff8df 58%, #ffffff 100%); border-bottom-color: #f1cd4f; }
.qn-rank-row.qn-rank-place-2 { background: linear-gradient(90deg, #e9eef2 0%, #f7f9fa 58%, #ffffff 100%); border-bottom-color: #c7d0d8; }
.qn-rank-row.qn-rank-place-3 { background: linear-gradient(90deg, #f5d2ad 0%, #fff0df 58%, #ffffff 100%); border-bottom-color: #d59a5d; }
.qn-rank-row.qn-rank-place-1:hover { background: linear-gradient(90deg, #ffe89a 0%, #fff4ca 58%, #ffffff 100%); }
.qn-rank-row.qn-rank-place-2:hover { background: linear-gradient(90deg, #dfe6eb 0%, #f1f5f7 58%, #ffffff 100%); }
.qn-rank-row.qn-rank-place-3:hover { background: linear-gradient(90deg, #efc291 0%, #ffe6cb 58%, #ffffff 100%); }
.qn-pos { width: 30px; height: 30px; border-radius: 50%; background: #eee; color: #555; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.qn-medal {
  position: relative;
  width: 44px;
  height: 52px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 4px;
  color: #fff;
  font-size: 20px;
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.28);
}
.qn-medal::before {
  content: "";
  position: absolute;
  top: 0;
  left: 5px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  z-index: 1;
  box-shadow: inset 0 2px 5px rgba(255, 255, 255, 0.85), inset 0 -4px 7px rgba(87, 56, 0, 0.24), 0 3px 6px rgba(0, 0, 0, 0.16);
}
.qn-medal::after {
  content: "";
  position: absolute;
  top: 27px;
  left: 10px;
  width: 24px;
  height: 24px;
  background:
    linear-gradient(135deg, #d7192a 0 46%, transparent 47%) left / 50% 100% no-repeat,
    linear-gradient(225deg, #b71020 0 46%, transparent 47%) right / 50% 100% no-repeat;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.15));
}
.qn-medal span { position: relative; z-index: 2; margin-top: 4px; }
.qn-medal-1::before { background: radial-gradient(circle at 30% 24%, #fff7bd 0 16%, #ffd84d 38%, #f5a900 72%, #d98900 100%); border: 2px solid #ffe27a; }
.qn-medal-2::before { background: radial-gradient(circle at 30% 24%, #ffffff 0 16%, #dfe5e8 38%, #aeb9c0 72%, #87949d 100%); border: 2px solid #eef3f6; }
.qn-medal-3::before { background: radial-gradient(circle at 30% 24%, #ffe4ba 0 16%, #d99a5b 38%, #a96228 72%, #804014 100%); border: 2px solid #efc08b; }
.qn-rank-name { flex: 1; font-weight: 700; min-width: 0; }
.qn-yo { background: #2e7d32; color: #fff; font-size: 10px; padding: 1px 6px; border-radius: 8px; margin-left: 6px; vertical-align: middle; }
.qn-rank-pts { font-weight: 900; font-size: 20px; color: #1b5e20; }
.qn-rank-pts span { font-size: 11px; font-weight: 600; color: #9e9e9e; margin-left: 3px; }
.qn-rank-place-1 .qn-rank-pts { color: #9a6700; }
.qn-rank-place-2 .qn-rank-pts { color: #60717d; }
.qn-rank-place-3 .qn-rank-pts { color: #8b4f1f; }

.qn-grupo { margin-bottom: 18px; }
.qn-grupo-head {
  font-weight: 800;
  color: #1b5e20;
  font-size: 14px;
  margin: 2px 2px 8px;
  display: flex;
  align-items: center;
}
.qn-grupo-head::before {
  content: "";
  width: 6px; height: 16px;
  background: linear-gradient(180deg, #ffd54f, #f9a825);
  border-radius: 3px;
  margin-right: 8px;
}
.qn-tabla { background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06); }
.qn-tabla-row {
  display: flex;
  align-items: center;
  padding: 9px 10px;
  border-bottom: 1px solid #f2f2f2;
  font-size: 13px;
}
.qn-tabla-row:last-child { border-bottom: none; }
.qn-tabla-head {
  background: #1b5e20;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding: 7px 10px;
}
.qn-col-pos { width: 22px; text-align: center; font-weight: 700; color: #757575; flex-shrink: 0; }
.qn-tabla-head .qn-col-pos { color: #fff; }
.qn-col-eq { flex: 1; min-width: 0; display: flex; align-items: center; gap: 7px; font-weight: 600; }
.qn-tabla-flag { width: 22px; height: 15px; object-fit: cover; border-radius: 2px; flex-shrink: 0; }
.qn-col-n { width: 30px; text-align: center; flex-shrink: 0; color: #555; font-variant-numeric: tabular-nums; }
.qn-col-pts { font-weight: 800; color: #1b5e20; width: 34px; }
.qn-tabla-head .qn-col-n, .qn-tabla-head .qn-col-pts { color: #fff; }
.qn-clasifica { border-left: 4px solid #2e7d32; }
.qn-clasifica .qn-col-pos { color: #2e7d32; }
.qn-tabla-nota {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: #757575;
  margin: 4px 4px 8px;
}
.qn-clasifica-dot { width: 10px; height: 10px; border-radius: 2px; background: #2e7d32; flex-shrink: 0; }
.qn-rank-go { flex-shrink: 0; }

.qn-push-hint {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1px solid rgba(46, 125, 50, 0.2);
  border-left: 4px solid #2e7d32;
  border-radius: 14px;
  padding: 10px 12px;
  margin-top: 10px;
  box-shadow: 0 2px 10px rgba(46, 125, 50, 0.1);
}
.qn-push-hint-icon { flex-shrink: 0; }
.qn-push-hint-text { flex: 1; min-width: 0; }

.qn-hint-enter-active, .qn-hint-leave-active { transition: max-height 0.25s ease, opacity 0.25s ease; overflow: hidden; max-height: 80px; }
.qn-hint-enter-from, .qn-hint-leave-to { max-height: 0; opacity: 0; }

.qn-join { width: 360px; max-width: 92vw; border-radius: 20px; }

.qn-date-wrap { margin-bottom: 12px; }
.qn-date-toggle { min-height: 32px; }
.qn-date-label { font-size: 13px; font-weight: 700; color: #1b5e20; margin-left: 8px; }

.qn-calendar-shell {
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  margin-bottom: 4px;
  padding: 8px;
  background: #fff;
  border: 1px solid rgba(27, 94, 32, 0.1);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(27, 94, 32, 0.12);
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
  border-top: 1px solid #edf2ed;
}
.qn-calendar-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b766c;
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
  padding: 9px 14px;
  background: linear-gradient(135deg, #14532d 0%, #1b5e20 65%, #0f3d18 100%);
  color: #fff;
  box-shadow: 0 6px 18px rgba(20, 83, 45, 0.4);
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
}
.qn-sticky-flag { width: 22px; height: 16px; object-fit: cover; border-radius: 2px; flex-shrink: 0; }
.qn-sticky-team { max-width: 30%; font-weight: 700; }
.qn-sticky-team-r { text-align: right; }
.qn-sticky-score { color: #ffd54f; font-size: 17px; font-weight: 900; font-variant-numeric: tabular-nums; flex-shrink: 0; }
.qn-sticky-vs { color: #ffd54f; font-weight: 800; font-size: 12px; flex-shrink: 0; }
.qn-sticky-min { margin-left: auto; font-size: 12px; font-weight: 800; color: #ffd54f; flex-shrink: 0; font-variant-numeric: tabular-nums; }
.qn-sticky-count { margin-left: auto; font-size: 15px; font-weight: 900; color: #ffd54f; font-variant-numeric: tabular-nums; flex-shrink: 0; }

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
  border-radius: 12px;
  padding: 9px 12px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
}
.qn-brk-scrollhint {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9e9e9e;
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
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #1b5e20;
  text-align: center;
  padding: 6px 0;
  margin-bottom: 8px;
  background: #fff;
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.qn-brk2-matches {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
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
  background: #fff;
  border-radius: 12px;
  padding: 7px 9px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.07);
  border-left: 4px solid #bdbdbd;
  position: relative;
  z-index: 1;
}
.qn-brk2-card.qn-brk-live { border-left-color: #e53935; }
.qn-brk2-card.qn-brk-fin { border-left-color: #1b5e20; }
.qn-brk2-card.qn-brk-prox { border-left-color: #1e88e5; }

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
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #8d6e00;
  margin-bottom: 6px;
}
.qn-brk-3rd-card { border-left-color: #c9a227 !important; }
.qn-brk-state {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #9e9e9e;
}
.qn-brk-state-live { color: #c62828; }
.qn-brk-state-fin { color: #1b5e20; }
.qn-brk-livedot { width: 7px; height: 7px; }
.qn-brk-team {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
  font-size: 12.5px;
  font-weight: 600;
  color: #333;
}
.qn-brk-team + .qn-brk-team { border-top: 1px dashed #eee; }
.qn-brk-win { font-weight: 900; color: #0d2818; }
.qn-brk-dim { color: #9e9e9e; font-weight: 600; font-style: italic; }
.qn-brk-flag { width: 22px; height: 16px; object-fit: cover; border-radius: 2px; flex-shrink: 0; }
.qn-brk-ph { width: 22px; height: 16px; border-radius: 2px; background: #ececec; flex-shrink: 0; }
.qn-brk-name { flex: 1; min-width: 0; }
.qn-brk-score { font-weight: 900; font-size: 14px; color: #1a1a1a; flex-shrink: 0; font-variant-numeric: tabular-nums; }
.qn-brk-win .qn-brk-score { color: #1b5e20; }

@media (max-width: 599px) {
  .qn-logo { width: 40px; height: 40px; }
  .qn-team-name { font-size: 12px; }
  .qn-score { font-size: 22px; }
  .qn-calendar-shell { padding: 4px; border-radius: 16px; }
  .qn-calendar-actions { padding-left: 8px; }
  .qn-hide-xs { display: none; }
  .qn-brk2 { --gut: 20px; --match-slot: 94px; }
  .qn-brk2-round { width: 144px; }
}

@media (prefers-reduced-motion: reduce) {
  .qn-calendar-enter-active, .qn-calendar-leave-active { transition: none; }
  .qn-shimmer { animation: none; }
  .qn-sticky-enter-active, .qn-sticky-leave-active { transition: none; }
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

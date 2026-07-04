<template>
  <q-page class="qn-page">
    <div class="qn-banner">
      <div class="qn-banner-overlay"></div>
      <div class="qn-banner-content">
        <q-btn flat dense round color="white" icon="arrow_back" class="qn-back" @click="volver" />
        <div class="qn-avatar-big">{{ inicial }}</div>
        <div class="qn-title">Pronósticos de {{ nombre }}</div>
        <div class="qn-subtitle">Desglose de puntos por partido</div>
      </div>
    </div>

    <div class="qn-wrap">
      <div v-if="nombre" class="qn-det-summary">
        <div class="qn-det-stat">
          <div class="qn-det-num">
            <q-skeleton v-if="loading" type="rect" width="34px" height="24px" animation="wave" class="qn-det-sk-num" />
            <template v-else>{{ resumen.puntos }}</template>
          </div>
          <div class="qn-det-lbl">Puntos</div>
        </div>
        <div class="qn-det-stat">
          <div class="qn-det-num">
            <q-skeleton v-if="loading" type="rect" width="34px" height="24px" animation="wave" class="qn-det-sk-num" />
            <template v-else>{{ resumen.exactos }}</template>
          </div>
          <div class="qn-det-lbl">Exactos</div>
        </div>
        <div class="qn-det-stat">
          <div class="qn-det-num">
            <q-skeleton v-if="loading" type="rect" width="34px" height="24px" animation="wave" class="qn-det-sk-num" />
            <template v-else>{{ resumen.aciertos }}</template>
          </div>
          <div class="qn-det-lbl">Aciertos</div>
        </div>
        <div class="qn-det-stat">
          <div class="qn-det-num">
            <q-skeleton v-if="loading" type="rect" width="34px" height="24px" animation="wave" class="qn-det-sk-num" />
            <template v-else>{{ resumen.jugados }}</template>
          </div>
          <div class="qn-det-lbl">Jugados</div>
        </div>
      </div>

      <div v-if="nombre && (campeon || loading)" class="qn-det-champ">
        <q-icon name="emoji_events" size="20px" class="qn-det-champ-trophy" />
        <span class="qn-det-champ-lbl">Campeón elegido</span>
        <template v-if="loading && !campeon">
          <q-skeleton type="rect" width="30px" height="21px" animation="wave" style="margin-left:auto;border-radius:3px" />
          <q-skeleton type="rect" width="84px" height="15px" animation="wave" style="border-radius:4px" />
        </template>
        <template v-else>
          <img v-if="campeon.logo" :src="campeon.logo" class="qn-det-champ-flag" alt="" />
          <span class="qn-det-champ-team">{{ campeon.equipo }}</span>
        </template>
      </div>

      <div v-if="loading">
        <div class="qn-fecha"><q-skeleton type="rect" width="140px" height="16px" animation="wave" style="border-radius:4px" /></div>
        <div v-for="n in 3" :key="n" class="qn-card">
          <div class="qn-card-top">
            <q-skeleton type="text" width="32%" animation="wave" />
            <q-skeleton type="QChip" width="64px" height="20px" animation="wave" />
          </div>
          <div class="qn-match">
            <div class="qn-team">
              <q-skeleton type="QAvatar" size="46px" animation="wave" />
              <q-skeleton type="text" width="70%" class="q-mt-sm" animation="wave" />
            </div>
            <div class="qn-center">
              <q-skeleton type="rect" width="44px" height="26px" animation="wave" style="border-radius:6px" />
            </div>
            <div class="qn-team">
              <q-skeleton type="QAvatar" size="46px" animation="wave" />
              <q-skeleton type="text" width="70%" class="q-mt-sm" animation="wave" />
            </div>
          </div>
          <div class="qn-det-pron">
            <q-skeleton type="text" width="100%" animation="wave" />
            <q-skeleton type="text" width="100%" animation="wave" />
            <q-skeleton type="text" width="60%" animation="wave" />
          </div>
        </div>
      </div>

      <div v-else-if="!nombre" class="flex flex-center column q-my-xl text-grey-6">
        <q-icon name="person_off" size="56px" color="grey-4" />
        <div class="q-mt-md">Usuario no encontrado</div>
      </div>

      <div v-else-if="items.length === 0" class="flex flex-center column q-my-xl text-grey-6">
        <q-icon name="sports_soccer" size="56px" color="grey-4" />
        <div class="q-mt-md">Aún no hay pronósticos para mostrar</div>
        <div class="text-caption">Los pronósticos se hacen públicos una vez cerrado el partido.</div>
      </div>

      <div v-else>
        <div v-for="g in grupos" :key="g.key" class="q-mb-lg">
          <div class="qn-fecha">{{ g.label }}</div>

          <div v-for="it in g.items" :key="it.m.id" class="qn-card" :class="'qn-' + tipo(it.m)">
            <div class="qn-card-top">
              <div class="qn-ronda">{{ it.m.ronda || 'Mundial' }}</div>
              <div class="qn-estado" :class="'qn-estado-' + tipo(it.m)">
                <q-icon v-if="tipo(it.m) === 'live'" name="fiber_manual_record" size="10px" class="qn-blink q-mr-xs" />
                {{ estadoTexto(it.m) }}
              </div>
            </div>

            <div class="qn-match">
              <div class="qn-team">
                <img v-if="it.m.equipo_local_logo" :src="it.m.equipo_local_logo" class="qn-logo" alt="" />
                <q-icon v-else name="shield" size="34px" color="grey-5" />
                <div class="qn-team-name">{{ it.m.equipo_local || '—' }}</div>
              </div>

              <div class="qn-center">
                <div v-if="tipo(it.m) !== 'prox' && it.m.goles_local != null" class="qn-score">
                  {{ it.m.goles_local }} <span class="qn-dash">-</span> {{ it.m.goles_visita }}
                </div>
                <div v-else class="qn-vs">VS</div>
                <div class="qn-hora">{{ hora(it.m) }}</div>
              </div>

              <div class="qn-team">
                <img v-if="it.m.equipo_visita_logo" :src="it.m.equipo_visita_logo" class="qn-logo" alt="" />
                <q-icon v-else name="shield" size="34px" color="grey-5" />
                <div class="qn-team-name">{{ it.m.equipo_visita || '—' }}</div>
              </div>
            </div>

            <div class="qn-det-pron">
              <div class="qn-det-pron-row">
                <span class="qn-det-label">Pronóstico</span>
                <span class="qn-det-val qn-det-val-pron">{{ it.pron.goles_local }} - {{ it.pron.goles_visita }}</span>
              </div>
              <div class="qn-det-pron-row">
                <span class="qn-det-label">Resultado real</span>
                <span class="qn-det-val">
                  <template v-if="tipo(it.m) !== 'prox' && it.m.goles_local != null">
                    {{ it.m.goles_local }} - {{ it.m.goles_visita }}
                  </template>
                  <template v-else>Por jugar</template>
                </span>
              </div>
              <div class="qn-det-pron-foot">
                <q-badge v-if="it.etiqueta.text !== 'Por puntuar'" :color="it.etiqueta.color" class="q-mr-sm">
                  {{ it.etiqueta.text }}
                </q-badge>
                <q-badge v-else color="blue-grey-4" class="q-mr-sm">Por puntuar</q-badge>
                <div class="qn-det-pts" :class="{ 'qn-det-pts-ok': it.pron.scored && it.pron.puntos > 0 }">
                  <template v-if="it.pron.scored">+{{ it.pron.puntos }} pts</template>
                  <template v-else>—</template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../supabase'

const FIN = new Set(['FT', 'AET', 'PEN', 'WO'])
const LIVE = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT', 'SUSP'])
const KO_RONDAS = new Set(['Dieciseisavos', 'Octavos de final', 'Cuartos de final', 'Semifinal', 'Final', 'Tercer lugar'])

export default defineComponent({
  name: 'QuinielaPronosticoPage',
  setup () {
    const route = useRoute()
    const router = useRouter()
    const nombre = ref('')
    const cfg = ref({ pts_exacto: 3, pts_resultado: 1, pts_bonus_equipo: 1, pts_ko_exacto: 5, pts_ko_resultado: 3, pts_ko_bonus: 1 })
    const partidos = ref([])
    const pronos = ref([])
    const rankingRow = ref(null)
    const campeon = ref(null)
    const loading = ref(true)

    const inicial = computed(() => (nombre.value || '?').trim().charAt(0).toUpperCase())

    const tipo = (m) => {
      const s = m.estado_corto
      if (FIN.has(s)) return 'fin'
      if (LIVE.has(s)) return 'live'
      return 'prox'
    }

    const hora = (m) => {
      try {
        return new Date(m.kickoff).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Costa_Rica' })
      } catch (e) { return '' }
    }

    const estadoTexto = (m) => {
      const t = tipo(m)
      if (t === 'fin') return 'Final'
      if (t === 'live') {
        if (m.estado_corto === 'HT') return 'Medio tiempo'
        return m.minuto ? m.minuto + "'" : 'En vivo'
      }
      return hora(m)
    }

    const esExacto = (p, m) => p.goles_local === m.goles_local && p.goles_visita === m.goles_visita
    const esResultado = (p, m) => {
      const r = (a, b) => (a > b ? 1 : a < b ? -1 : 0)
      return r(p.goles_local, p.goles_visita) === r(m.goles_local, m.goles_visita)
    }
    const etiqueta = (p, m) => {
      if (!p || !p.scored) return { text: 'Por puntuar', color: 'blue-grey-4' }
      if (m.goles_local == null || m.goles_visita == null) return { text: 'Por puntuar', color: 'blue-grey-4' }
      if (esExacto(p, m)) return { text: 'Marcador exacto', color: 'green-7' }
      if (KO_RONDAS.has(m.ronda)) {
        const re = cfg.value.pts_ko_resultado || 3
        if (p.puntos >= re) return { text: 'Pasó de ronda', color: 'blue-7' }
        if (p.puntos > 0) return { text: 'Acertó la definición', color: 'amber-8' }
        return { text: 'Sin acierto', color: 'grey-6' }
      }
      if (esResultado(p, m)) return { text: 'Resultado correcto', color: 'blue-7' }
      return { text: 'Sin acierto', color: 'grey-6' }
    }

    const pronMap = computed(() => {
      const map = {}
      for (const p of pronos.value) map[p.match_id] = p
      return map
    })

    const items = computed(() => {
      const out = []
      for (const m of partidos.value) {
        const p = pronMap.value[m.id]
        if (!p) continue
        out.push({ m, pron: p, etiqueta: etiqueta(p, m) })
      }
      return out.sort((a, b) => new Date(b.m.kickoff) - new Date(a.m.kickoff))
    })

    const grupos = computed(() => {
      const fmt = new Intl.DateTimeFormat('es-CR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Costa_Rica' })
      const keyFmt = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Costa_Rica' })
      const out = []
      let cur = null
      for (const it of items.value) {
        const d = new Date(it.m.kickoff)
        const key = keyFmt.format(d)
        if (!cur || cur.key !== key) {
          cur = { key, label: fmt.format(d), items: [] }
          out.push(cur)
        }
        cur.items.push(it)
      }
      return out
    })

    const resumen = computed(() => {
      if (rankingRow.value) {
        return {
          puntos: rankingRow.value.puntos,
          exactos: rankingRow.value.exactos,
          aciertos: rankingRow.value.aciertos,
          jugados: rankingRow.value.jugados
        }
      }
      let puntos = 0
      let exactos = 0
      let aciertos = 0
      let jugados = 0
      for (const it of items.value) {
        if (!it.pron.scored) continue
        jugados++
        puntos += it.pron.puntos
        if (it.pron.puntos > 0) aciertos++
        if (it.m.goles_local != null && it.m.goles_visita != null && esExacto(it.pron, it.m)) exactos++
      }
      return { puntos, exactos, aciertos, jugados }
    })

    const volver = () => {
      router.push({ path: '/quiniela', query: { tab: 'ranking' } })
    }

    onMounted(async () => {
      nombre.value = (route.query.nombre || '').toString()
      if (!nombre.value) { loading.value = false; return }
      const tasks = [
        supabase.from('qn_config').select('*').eq('id', 1).single().then(({ data }) => { if (data) cfg.value = data }),
        supabase.from('qn_partidos').select('*').order('kickoff', { ascending: true }).then(({ data }) => { partidos.value = data || [] }),
        supabase.from('qn_pronosticos_publicos').select('*').eq('nombre', nombre.value).then(({ data }) => { pronos.value = data || [] }),
        supabase.from('qn_ranking').select('*').then(({ data }) => {
          rankingRow.value = (data || []).find(r => (r.nombre || '').toLowerCase() === nombre.value.toLowerCase()) || null
        }),
        supabase.from('qn_campeones_publicos').select('*').eq('nombre', nombre.value).limit(1).then(({ data }) => {
          campeon.value = (data || [])[0] || null
        })
      ]
      await Promise.all(tasks.map(p => p.catch(() => {})))
      loading.value = false
    })

    return { nombre, inicial, loading, items, grupos, resumen, campeon, tipo, hora, estadoTexto, volver }
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
  overflow: hidden;
  padding: 34px 20px 30px;
  background:
    radial-gradient(circle at 18% 20%, rgba(255, 215, 0, 0.22), transparent 42%),
    radial-gradient(circle at 85% 80%, rgba(255, 255, 255, 0.16), transparent 40%),
    linear-gradient(135deg, #1b5e20 0%, #2e7d32 45%, #1b5e20 100%);
  color: #fff;
  text-align: center;
}

.qn-banner-overlay {
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.04) 0 2px, transparent 2px 60px);
  pointer-events: none;
}

.qn-banner-content { position: relative; z-index: 1; }

.qn-back {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.18);
}

.qn-avatar-big {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffd54f, #f9a825);
  color: #1b5e20;
  font-size: 26px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.qn-title {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.qn-subtitle { opacity: 0.92; font-size: 13px; margin-top: 4px; }

.qn-wrap { max-width: 720px; margin: 0 auto; padding: 16px; }

.qn-det-summary {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  background: #fff;
  border-radius: 16px;
  padding: 14px 10px;
  margin-top: -28px;
  position: relative;
  z-index: 2;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(46, 125, 50, 0.12);
}
.qn-det-stat { flex: 1; text-align: center; }
.qn-det-num { font-size: 22px; font-weight: 900; color: #1b5e20; line-height: 1.1; }
.qn-det-sk-num { margin: 0 auto; border-radius: 6px; }
.qn-det-lbl { font-size: 11px; color: #757575; text-transform: uppercase; letter-spacing: 0.4px; margin-top: 2px; }

.qn-det-champ {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border-radius: 14px;
  padding: 12px 14px;
  margin-top: 12px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(249, 168, 37, 0.32);
}
.qn-det-champ-trophy { color: #f9a825; }
.qn-det-champ-lbl { font-size: 13px; font-weight: 700; color: #757575; }
.qn-det-champ-flag { width: 30px; height: 21px; object-fit: cover; border-radius: 3px; margin-left: auto; }
.qn-det-champ-team { font-size: 15px; font-weight: 900; color: #14532d; }

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
.qn-vs { font-size: 16px; font-weight: 900; color: #9e9e9e; }
.qn-hora { font-size: 12px; color: #757575; margin-top: 2px; font-weight: 600; }

.qn-det-pron {
  margin-top: 12px;
  border-top: 1px dashed #e0e0e0;
  padding-top: 10px;
}
.qn-det-pron-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 0;
  font-size: 13px;
}
.qn-det-label { color: #757575; font-weight: 600; }
.qn-det-val { font-weight: 800; color: #333; font-variant-numeric: tabular-nums; }
.qn-det-val-pron { color: #1b5e20; }
.qn-det-pron-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}
.qn-det-pts {
  font-size: 15px;
  font-weight: 900;
  color: #9e9e9e;
}
.qn-det-pts-ok { color: #1b5e20; }

@media (max-width: 599px) {
  .qn-title { font-size: 20px; }
  .qn-logo { width: 40px; height: 40px; }
  .qn-team-name { font-size: 12px; }
  .qn-score { font-size: 22px; }
  .qn-det-num { font-size: 18px; }
}
</style>

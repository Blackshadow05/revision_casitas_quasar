import { createClient } from "jsr:@supabase/supabase-js@2";

const RAPID_HOST = "flashscore4.p.rapidapi.com";
const BASE = `https://${RAPID_HOST}/api/flashscore/v2`;
const TOURNAMENT_ID = "sblsx4y7";
const TOURNAMENT_IDS = new Set([TOURNAMENT_ID, "6kkowojd"]);
const WINDOW_MIN = 360;
const PRE_ROLL_MS = 2 * 60000;
const HEAVY_DAY_MIN = 5;
const THROTTLE_EVERY = 1;
const SUMMARY_REFRESH_MIN = 5;
const CR_OFFSET_MS = 6 * 3600000;
const INTERRUPT_CODES = new Set(["INT", "SUSP"]);
const INT_BACKOFF_MS = 10 * 60000;
const SUSP_BACKOFF_MS = 30 * 60000;

const API_FOOTBALL_BASE = "https://v3.football.api-sports.io";
const API_FOOTBALL_PROVIDER = "api-football";
const API_FOOTBALL_START_DELAY_MS = 2 * 60000;
const API_FOOTBALL_SECOND_HALF_DELAY_MS = 60 * 60000;
const API_FOOTBALL_FINAL_MIN = 92;
const API_FOOTBALL_INTERVAL_MS = 2 * 60000;
const API_FOOTBALL_DEFAULT_LEAGUE = "1";
const API_FOOTBALL_DEFAULT_SEASON = "2026";
const KO_ROUNDS = new Set(["Dieciseisavos", "Octavos de final", "Cuartos de final", "Semifinal", "Final", "Tercer lugar"]);
const LIVE_CODES = new Set(["LIVE", "1H", "HT", "2H", "ET", "BT", "P"]);
const KNOCKOUT_LIVE_CODES = new Set(["ET", "P"]);
const FIN_CODES = new Set(["FT", "AET", "PEN"]);
const FLASH_KO_PROVIDER = "flashscore-ko";
const FLASH_KO_LOOKAHEAD_DAYS = 7;
const FLASH_KO_SYNC_INTERVAL_MS = 30 * 60000;
const FLASH_KO_MATCH_TOLERANCE_MS = 90 * 60000;
const KO_FEEDERS: Record<number, [number, number]> = {
  89: [74, 77], 90: [73, 75], 91: [76, 78], 92: [79, 80],
  93: [83, 84], 94: [81, 82], 95: [86, 88], 96: [85, 87],
  97: [89, 90], 98: [93, 94], 99: [91, 92], 100: [95, 96],
  101: [97, 98], 102: [99, 100],
  104: [101, 102],
};
const THIRD_PLACE_FEEDERS: [number, number] = [101, 102];

const ENES: Record<string, string> = {
  "Algeria": "Argelia", "Argentina": "Argentina", "Australia": "Australia", "Austria": "Austria",
  "Belgium": "Bélgica", "Bosnia & Herzegovina": "Bosnia y Herzegovina", "Brazil": "Brasil",
  "Canada": "Canadá", "Cape Verde": "Cabo Verde", "Colombia": "Colombia", "Croatia": "Croacia",
  "Curaçao": "Curazao", "Czech Republic": "República Checa", "DR Congo": "RD Congo", "Ecuador": "Ecuador",
  "Egypt": "Egipto", "England": "Inglaterra", "France": "Francia", "Germany": "Alemania", "Ghana": "Ghana",
  "Haiti": "Haití", "Iran": "Irán", "Iraq": "Irak", "Ivory Coast": "Costa de Marfil", "Japan": "Japón",
  "Jordan": "Jordania", "Mexico": "México", "Morocco": "Marruecos", "Netherlands": "Países Bajos",
  "New Zealand": "Nueva Zelanda", "Norway": "Noruega", "Panama": "Panamá", "Paraguay": "Paraguay",
  "Portugal": "Portugal", "Qatar": "Catar", "Saudi Arabia": "Arabia Saudita", "Scotland": "Escocia",
  "Senegal": "Senegal", "South Africa": "Sudáfrica", "South Korea": "Corea del Sur", "Spain": "España",
  "Sweden": "Suecia", "Switzerland": "Suiza", "Tunisia": "Túnez", "Turkey": "Turquía",
  "USA": "Estados Unidos", "Uruguay": "Uruguay", "Uzbekistan": "Uzbekistán",
};
const ALIAS: Record<string, string> = {
  "Czechia": "Czech Republic", "Türkiye": "Turkey", "Turkiye": "Turkey", "Korea Republic": "South Korea",
  "Cote d'Ivoire": "Ivory Coast", "Côte d'Ivoire": "Ivory Coast", "Bosnia and Herzegovina": "Bosnia & Herzegovina",
  "Congo DR": "DR Congo", "D.R. Congo": "DR Congo", "DR. Congo": "DR Congo", "Congo D.R.": "DR Congo",
  "United States": "USA", "United States of America": "USA", "Curacao": "Curaçao", "Holland": "Netherlands", "South Korea Republic": "South Korea",
};
function norm(s: string): string { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
const NORM_EN: Record<string, string> = {};
for (const [en, esName] of Object.entries(ENES)) NORM_EN[norm(en)] = esName;
for (const [al, en] of Object.entries(ALIAS)) { const t = ENES[en]; if (t) NORM_EN[norm(al)] = t; }
function es(fs: string): string | null {
  if (!fs) return null;
  if (ENES[fs]) return ENES[fs];
  const k = ALIAS[fs];
  if (k && ENES[k]) return ENES[k];
  return NORM_EN[norm(fs)] ?? null;
}
function json(obj: unknown, status = 200): Response { return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } }); }
function pairKey(a: string, b: string): string { return [a, b].sort().join("|"); }
function scoreNum(v: unknown): number | null { const n = Number(v); return Number.isFinite(n) ? n : null; }
function detailsDue(nowMs: number, row: any, corto: string, finished: boolean, golesLocal: unknown, golesVisita: unknown): { due: boolean; reason: string } {
  if (finished) return { due: true, reason: "finished" };
  if (row.estado_corto !== corto) return { due: true, reason: "status_changed" };
  const localNow = scoreNum(row.goles_local);
  const visitaNow = scoreNum(row.goles_visita);
  const localNext = scoreNum(golesLocal);
  const visitaNext = scoreNum(golesVisita);
  if (localNext !== null && visitaNext !== null && (localNow !== localNext || visitaNow !== visitaNext)) return { due: true, reason: "score_changed" };
  const minute = new Date(nowMs).getUTCMinutes();
  if (minute % SUMMARY_REFRESH_MIN === 0) return { due: true, reason: "periodic" };
  return { due: false, reason: "unchanged" };
}

function mapEstado(st: any): { corto: string; interrupted: boolean } {
  const finished = !!st.is_finished;
  const s = String(st.stage ?? "").toLowerCase();
  const interrupted = /interrupt|suspend|abandon|postpone|cancel/.test(s);
  if (interrupted) return { corto: /suspend|abandon|postpone|cancel/.test(s) ? "SUSP" : "INT", interrupted: true };
  if (finished) {
    if (st.is_finished_after_penalties === true) return { corto: "PEN", interrupted: false };
    if (st.is_finished_after_extra_time === true) return { corto: "AET", interrupted: false };
    if (/penalt/.test(s)) return { corto: "PEN", interrupted: false };
    if (/extra/.test(s)) return { corto: "AET", interrupted: false };
    return { corto: "FT", interrupted: false };
  }
  if (st.is_finished_after_penalties === true) return { corto: "P", interrupted: false };
  if (st.is_finished_after_extra_time === true) return { corto: "ET", interrupted: false };
  if (/half\s*time|half-time|\bht\b/.test(s)) return { corto: "HT", interrupted: false };
  if (/penalt/.test(s)) return { corto: "P", interrupted: false };
  if (/extra/.test(s)) return { corto: "ET", interrupted: false };
  if (/1st|first half/.test(s)) return { corto: "1H", interrupted: false };
  if (/2nd|second half/.test(s)) return { corto: "2H", interrupted: false };
  return { corto: "LIVE", interrupted: false };
}
function sideFromProviderWinner(value: unknown, localIsHome: boolean): number | null {
  const v = String(value ?? "").trim().toLowerCase();
  if (!v || v === "null" || v === "undefined") return null;
  if (["home", "h", "1", "local"].includes(v)) return localIsHome ? 1 : 2;
  if (["away", "a", "2", "visitor", "visitante"].includes(v)) return localIsHome ? 2 : 1;
  if (["local", "l"].includes(v)) return 1;
  if (["visita", "visit", "v"].includes(v)) return 2;
  return null;
}
function flashscoreWinner(st: any, localIsHome: boolean): number | null {
  return sideFromProviderWinner(st.final_winner, localIsHome)
    ?? sideFromProviderWinner(st.winner, localIsHome);
}
function scoreWinner(golesLocal: unknown, golesVisita: unknown): number | null {
  const gl = Number(golesLocal), gv = Number(golesVisita);
  if (!Number.isFinite(gl) || !Number.isFinite(gv) || gl === gv) return null;
  return gl > gv ? 1 : 2;
}
async function rapid(path: string, key: string): Promise<any> {
  const r = await fetch(`${BASE}/${path}`, { headers: { "x-rapidapi-host": RAPID_HOST, "x-rapidapi-key": key } });
  if (!r.ok) throw new Error(`rapid ${path} -> ${r.status}`);
  return await r.json();
}
function tournamentMatches(list: any): any[] {
  if (!Array.isArray(list)) return [];
  return list.filter((x: any) => TOURNAMENT_IDS.has(x?.tournament_id)).flatMap((t: any) => t?.matches ?? []);
}
function concreteTeam(name: string | null | undefined): boolean {
  const v = String(name ?? "").trim();
  return !!v && !/^(ganador|perdedor|3[ºo]|\d+[ºo]|\-)/i.test(v);
}
function fsTeam(fm: any, side: "home" | "away"): { id: number | null; name: string | null; logo: string | null } {
  const team = side === "home" ? fm?.home_team : fm?.away_team;
  const rawName = String(team?.name ?? "");
  const id = Number(team?.team_id);
  return {
    id: Number.isFinite(id) ? id : null,
    name: es(rawName),
    logo: team?.small_image_path ?? team?.image_path ?? null,
  };
}
function fsKickoffMs(fm: any): number | null {
  const ts = Number(fm?.timestamp);
  if (!Number.isFinite(ts) || ts <= 0) return null;
  return ts * 1000;
}
function rowKnownTeamScore(row: any, home: string | null, away: string | null): number {
  let score = 0;
  if (concreteTeam(row.equipo_local) && (row.equipo_local === home || row.equipo_local === away)) score += 2;
  if (concreteTeam(row.equipo_visita) && (row.equipo_visita === home || row.equipo_visita === away)) score += 2;
  return score;
}
function buildKoNumberMap(rows: any[]): Map<number, any> {
  const byNum = new Map<number, any>();
  for (const m of rows) {
    const n = Number(m.match_no);
    if (Number.isFinite(n)) byNum.set(n, m);
  }
  return byNum;
}
function winnerTeam(row: any): any | null {
  if (!row || !row.finalizado || !row.ganador_ko) return null;
  if (row.ganador_ko === 1 && concreteTeam(row.equipo_local)) {
    return { name: row.equipo_local, id: row.equipo_local_id ?? null, logo: row.equipo_local_logo ?? null };
  }
  if (row.ganador_ko === 2 && concreteTeam(row.equipo_visita)) {
    return { name: row.equipo_visita, id: row.equipo_visita_id ?? null, logo: row.equipo_visita_logo ?? null };
  }
  return null;
}
function loserTeam(row: any): any | null {
  if (!row || !row.finalizado || !row.ganador_ko) return null;
  if (row.ganador_ko === 1 && concreteTeam(row.equipo_visita)) {
    return { name: row.equipo_visita, id: row.equipo_visita_id ?? null, logo: row.equipo_visita_logo ?? null };
  }
  if (row.ganador_ko === 2 && concreteTeam(row.equipo_local)) {
    return { name: row.equipo_local, id: row.equipo_local_id ?? null, logo: row.equipo_local_logo ?? null };
  }
  return null;
}
function teamPatch(prefix: "equipo_local" | "equipo_visita", team: any): Record<string, unknown> {
  return {
    [prefix]: team.name,
    [`${prefix}_id`]: team.id ?? null,
    [`${prefix}_logo`]: team.logo ?? null,
  };
}
function needsTeamUpdate(row: any, side: "local" | "visita", team: any): boolean {
  const name = side === "local" ? row.equipo_local : row.equipo_visita;
  return team?.name && name !== team.name;
}
function parseSummary(events: any[], localIsHome: boolean) {
  const golL: any[] = [], golV: any[] = [], tarL: any[] = [], tarV: any[] = [];
  for (const e of events ?? []) {
    const p = (e.players ?? [{}])[0] ?? {};
    const type = String(p.type ?? "");
    const desc = String(e.description ?? "");
    const homeSide = e.team === "home";
    const isLocal = localIsHome ? homeSide : !homeSide;
    if (/card/i.test(type)) {
      (isLocal ? tarL : tarV).push({ name: p.name ?? "", minute: e.minutes ?? "", tipo: /red/i.test(type) ? "roja" : "amarilla" });
    } else if (/goal/i.test(type)) {
      const g: any = { name: p.name ?? "", minute: e.minutes ?? "" };
      if (/own/i.test(type) || /own goal/i.test(desc)) g.owngoal = true;
      if (/penalt/i.test(type) || /from the penalty spot|converts the penalty|penalty kick/i.test(desc)) g.penalty = true;
      (isLocal ? golL : golV).push(g);
    }
  }
  return { golL, golV, tarL, tarV };
}

function apiFootballKey(): string | null {
  return Deno.env.get("API_FOOTBALL_KEY") ?? Deno.env.get("API_FOOTBALL_API_KEY") ?? Deno.env.get("APIFOOTBALL_KEY") ?? Deno.env.get("API_FOOTBALL_TOKEN") ?? Deno.env.get("APISPORTS_KEY") ?? null;
}
async function apiFootball(path: string, key: string): Promise<any> {
  const r = await fetch(`${API_FOOTBALL_BASE}/${path}`, {
    headers: { "x-apisports-key": key, "x-rapidapi-key": key, "x-rapidapi-host": "v3.football.api-sports.io" },
  });
  if (!r.ok) throw new Error(`api-football ${path} -> ${r.status}`);
  return await r.json();
}
function crDate(ms: number): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Costa_Rica", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(ms));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
function mapApiFootballStatus(status: any): { usable: boolean; corto: string; finalizado: boolean; interrupted: boolean } {
  const raw = String(status?.short ?? "").toUpperCase();
  if (FIN_CODES.has(raw)) return { usable: true, corto: raw, finalizado: true, interrupted: false };
  if (LIVE_CODES.has(raw)) return { usable: true, corto: raw === "BT" ? "HT" : raw, finalizado: false, interrupted: false };
  if (raw === "INT") return { usable: true, corto: "INT", finalizado: false, interrupted: true };
  if (["SUSP", "PST", "CANC", "ABD", "AWD", "WO"].includes(raw)) return { usable: true, corto: "SUSP", finalizado: false, interrupted: true };
  return { usable: false, corto: raw || "NS", finalizado: false, interrupted: false };
}
function findApiFootballFixture(row: any, fixtures: any[]): any | null {
  const wanted = pairKey(row.equipo_local, row.equipo_visita);
  for (const f of fixtures) {
    const home = es(f?.teams?.home?.name ?? "");
    const away = es(f?.teams?.away?.name ?? "");
    if (!home || !away) continue;
    if (pairKey(home, away) === wanted) return f;
  }
  return null;
}
async function fetchApiFootballFixtureForRow(supabase: any, row: any, key: string): Promise<any | null> {
  const { data: chk } = await supabase.from("qn_provider_checks").select("fixture_id").eq("provider", API_FOOTBALL_PROVIDER).eq("match_id", row.id).maybeSingle();
  const fid = chk?.fixture_id;
  if (fid) {
    const payload = await apiFootball(`fixtures?id=${encodeURIComponent(String(fid))}&timezone=America%2FCosta_Rica`, key);
    const f = Array.isArray(payload?.response) ? payload.response[0] : null;
    if (f) return f;
  }
  const date = crDate(Date.parse(row.kickoff));
  const league = Deno.env.get("API_FOOTBALL_LEAGUE_ID") ?? API_FOOTBALL_DEFAULT_LEAGUE;
  const season = Deno.env.get("API_FOOTBALL_SEASON") ?? API_FOOTBALL_DEFAULT_SEASON;
  let payload = await apiFootball(`fixtures?league=${encodeURIComponent(league)}&season=${encodeURIComponent(season)}&date=${encodeURIComponent(date)}&timezone=America%2FCosta_Rica`, key);
  let list = Array.isArray(payload?.response) ? payload.response : [];
  let f = findApiFootballFixture(row, list);
  if (!f) {
    payload = await apiFootball(`fixtures?date=${encodeURIComponent(date)}&timezone=America%2FCosta_Rica`, key);
    list = Array.isArray(payload?.response) ? payload.response : [];
    f = findApiFootballFixture(row, list);
  }
  return f ?? null;
}
function extractPenales(row: any, fixture: any): { ganador_ko: number; pen_local?: number; pen_visita?: number } | null {
  if (!fixture) return null;
  const short = String(fixture.fixture?.status?.short ?? "").toUpperCase();
  const pen = fixture.score?.penalty ?? {};
  const ph = Number(pen.home), pa = Number(pen.away);
  const hasPen = Number.isFinite(ph) && Number.isFinite(pa);
  if (short !== "PEN" && !hasPen) return null;
  const apiHome = es(fixture.teams?.home?.name ?? "");
  if (!apiHome) return null;
  const localIsHome = apiHome === row.equipo_local;
  let g: number | null = null;
  if (fixture.teams?.home?.winner === true) g = localIsHome ? 1 : 2;
  else if (fixture.teams?.away?.winner === true) g = localIsHome ? 2 : 1;
  else if (hasPen && ph !== pa) g = ph > pa ? (localIsHome ? 1 : 2) : (localIsHome ? 2 : 1);
  if (!g) return null;
  const out: any = { ganador_ko: g };
  if (hasPen) { out.pen_local = localIsHome ? ph : pa; out.pen_visita = localIsHome ? pa : ph; }
  return out;
}
async function resolvePenalesPendientes(supabase: any, nowMs: number): Promise<any> {
  const key = apiFootballKey();
  if (!key) return { enabled: false };
  const { data: pend } = await supabase.from("qn_partidos")
    .select("id, kickoff, equipo_local, equipo_visita, ronda")
    .eq("estado_corto", "PEN").eq("finalizado", true).is("ganador_ko", null)
    .gte("kickoff", new Date(nowMs - WINDOW_MIN * 60000).toISOString());
  if (!pend || pend.length === 0) return { enabled: true, pending: 0, fixed: [] };
  const fixed: any[] = [];
  for (const row of pend) {
    if (!KO_ROUNDS.has(row.ronda)) continue;
    try {
      const f = await fetchApiFootballFixtureForRow(supabase, row, key);
      const pen = extractPenales(row, f);
      if (!pen) continue;
      const upd: any = { ganador_ko: pen.ganador_ko, updated_at: new Date().toISOString() };
      if (pen.pen_local != null) upd.pen_local = pen.pen_local;
      if (pen.pen_visita != null) upd.pen_visita = pen.pen_visita;
      const { error } = await supabase.from("qn_partidos").update(upd).eq("id", row.id);
      if (!error) { await supabase.rpc("qn_calcular_puntos", { p_match_id: row.id }); fixed.push(row.id); }
    } catch (_e) { /* reintenta el proximo minuto */ }
  }
  return { enabled: true, pending: pend.length, fixed };
}
function fixtureSample(fixtures: any[]): any[] {
  return (fixtures ?? []).slice(0, 20).map((f: any) => ({
    id: f?.fixture?.id ?? null,
    status: f?.fixture?.status?.short ?? null,
    home: f?.teams?.home?.name ?? null,
    away: f?.teams?.away?.name ?? null,
    league: f?.league?.name ?? null,
  }));
}
function noFixtureRaw(row: any, date: string, scoped: any[], broad: any[] | null, mode: string): any {
  return {
    lookup: mode,
    date,
    searched: { home: row.equipo_local, away: row.equipo_visita },
    scoped_count: scoped?.length ?? 0,
    broad_count: broad?.length ?? null,
    scoped_sample: fixtureSample(scoped ?? []),
    broad_sample: broad ? fixtureSample(broad) : null,
  };
}
function compactFixture(fixture: any): any {
  return fixture ? {
    fixture: { id: fixture.fixture?.id ?? null, date: fixture.fixture?.date ?? null, status: fixture.fixture?.status ?? null },
    league: fixture.league ?? null,
    teams: fixture.teams ?? null,
    goals: fixture.goals ?? null,
    score: fixture.score ?? null,
  } : null;
}
function buildApiPatch(row: any, fixture: any, mapped: any, nowMs: number): any {
  const apiHome = es(fixture.teams?.home?.name ?? "");
  const localIsHome = apiHome === row.equipo_local;
  const goals = fixture.goals ?? {};
  const golesLocal = localIsHome ? goals.home : goals.away;
  const golesVisita = localIsHome ? goals.away : goals.home;
  const elapsed = Number(fixture.fixture?.status?.elapsed);
  const patch: any = {
    estado_corto: mapped.corto,
    estado_largo: fixture.fixture?.status?.long ?? mapped.corto,
    minuto: mapped.finalizado || mapped.interrupted ? null : (Number.isFinite(elapsed) && elapsed > 0 ? elapsed : null),
    minuto_label: null,
    finalizado: mapped.finalizado,
    updated_at: new Date(nowMs).toISOString(),
  };
  if (golesLocal != null) patch.goles_local = golesLocal;
  if (golesVisita != null) patch.goles_visita = golesVisita;
  if (mapped.corto === "PEN") {
    const pen = extractPenales(row, fixture);
    if (pen) {
      patch.ganador_ko = pen.ganador_ko;
      if (pen.pen_local != null) patch.pen_local = pen.pen_local;
      if (pen.pen_visita != null) patch.pen_visita = pen.pen_visita;
    }
  }
  return patch;
}

async function runApiFootballBackup(supabase: any, rows: any[], nowMs: number, configSeason: number | null, statusOverride: Map<number, string>, skipIds: Set<number>): Promise<any> {
  const key = apiFootballKey();
  if (!key) return { enabled: false, reason: "missing_api_football_key" };

  const candidates = rows.filter((row) => {
    if (skipIds.has(Number(row.id))) return false;
    const ko = Date.parse(row.kickoff);
    const ageMs = nowMs - ko;
    if (ageMs < API_FOOTBALL_START_DELAY_MS) return false;
    const status = statusOverride.get(Number(row.id)) ?? row.estado_corto;
    const startDue = status === "NS";
    const secondHalfDue = status === "HT" && ageMs >= API_FOOTBALL_SECOND_HALF_DELAY_MS;
    const finalDue = LIVE_CODES.has(status) && ageMs >= API_FOOTBALL_FINAL_MIN * 60000;
    const knockoutDue = KNOCKOUT_LIVE_CODES.has(status);
    return startDue || secondHalfDue || finalDue || knockoutDue;
  });
  if (!candidates.length) return { enabled: true, candidates: 0, apiCalls: 0, updates: [] };

  const { data: checks } = await supabase.from("qn_provider_checks").select("match_id, checked_at, status_corto, fixture_id").eq("provider", API_FOOTBALL_PROVIDER).in("match_id", candidates.map((m) => m.id));
  const checksById = new Map((checks ?? []).map((r: any) => [Number(r.match_id), r]));
  const due = candidates.filter((row) => {
    const last = checksById.get(Number(row.id))?.checked_at;
    return nowMs - (last ? Date.parse(last) : 0) >= API_FOOTBALL_INTERVAL_MS;
  });
  if (!due.length) return { enabled: true, candidates: candidates.length, due: 0, apiCalls: 0, updates: [] };

  const league = Deno.env.get("API_FOOTBALL_LEAGUE_ID") ?? API_FOOTBALL_DEFAULT_LEAGUE;
  const season = Deno.env.get("API_FOOTBALL_SEASON") ?? String(configSeason ?? API_FOOTBALL_DEFAULT_SEASON);
  const scopedByDate = new Map<string, any[]>();
  const broadByDate = new Map<string, any[]>();
  let liveFixtures: any[] | null = null;
  let apiCalls = 0;
  const updates: any[] = [];
  let finished = false;

  for (const row of due) {
    const rowId = Number(row.id);
    const koMs = Date.parse(row.kickoff);
    const ageMs = nowMs - koMs;
    const currentStatus = statusOverride.get(rowId) ?? row.estado_corto;
    const startDue = currentStatus === "NS";
    const secondHalfDue = currentStatus === "HT" && ageMs >= API_FOOTBALL_SECOND_HALF_DELAY_MS;
    const cachedFixtureId = checksById.get(rowId)?.fixture_id;
    const useFixtureLookup = !!cachedFixtureId && (KNOCKOUT_LIVE_CODES.has(currentStatus) || ageMs >= API_FOOTBALL_FINAL_MIN * 60000);
    let fixture: any = null;
    let rawForCheck: any = null;
    let lookupMode = "date-scoped";
    const date = crDate(koMs);

    if (useFixtureLookup) {
      const payload = await apiFootball(`fixtures?id=${encodeURIComponent(String(cachedFixtureId))}&timezone=America%2FCosta_Rica`, key);
      apiCalls++;
      fixture = Array.isArray(payload?.response) ? payload.response[0] : null;
      lookupMode = "fixture";
    } else {
      if (startDue || secondHalfDue) {
        if (!liveFixtures) {
          const payload = await apiFootball("fixtures?live=all", key);
          apiCalls++;
          liveFixtures = Array.isArray(payload?.response) ? payload.response : [];
        }
        fixture = findApiFootballFixture(row, liveFixtures);
        lookupMode = fixture ? "live-all" : "date-scoped";
      }
      if (!fixture) {
        if (!scopedByDate.has(date)) {
          const query = `fixtures?league=${encodeURIComponent(league)}&season=${encodeURIComponent(season)}&date=${encodeURIComponent(date)}&timezone=America%2FCosta_Rica`;
          const payload = await apiFootball(query, key);
          apiCalls++;
          scopedByDate.set(date, Array.isArray(payload?.response) ? payload.response : []);
        }
        const scoped = scopedByDate.get(date) ?? [];
        fixture = findApiFootballFixture(row, scoped);
        if (!fixture) {
          if (!broadByDate.has(date)) {
            const payload = await apiFootball(`fixtures?date=${encodeURIComponent(date)}&timezone=America%2FCosta_Rica`, key);
            apiCalls++;
            broadByDate.set(date, Array.isArray(payload?.response) ? payload.response : []);
          }
          const broad = broadByDate.get(date) ?? [];
          fixture = findApiFootballFixture(row, broad);
          lookupMode = fixture ? "date-broad" : "date-none";
          if (!fixture) rawForCheck = noFixtureRaw(row, date, scoped, broad, lookupMode);
        }
      }
    }

    const mapped = mapApiFootballStatus(fixture?.fixture?.status);
    await supabase.from("qn_provider_checks").upsert({
      match_id: row.id,
      provider: API_FOOTBALL_PROVIDER,
      checked_at: new Date(nowMs).toISOString(),
      status_corto: fixture?.fixture?.status?.short ?? null,
      fixture_id: fixture?.fixture?.id ?? cachedFixtureId ?? null,
      raw: fixture ? compactFixture(fixture) : rawForCheck,
    }, { onConflict: "match_id,provider" });

    if (!fixture || !mapped.usable) continue;
    const patch = buildApiPatch(row, fixture, mapped, nowMs);
    const { error } = await supabase.from("qn_partidos").update(patch).eq("id", row.id);
    if (!error) {
      if (mapped.finalizado) finished = true;
      updates.push({ id: row.id, provider: API_FOOTBALL_PROVIDER, lookup: lookupMode, estado: mapped.corto, min: patch.minuto, ft: mapped.finalizado });
    }
  }
  return { enabled: true, candidates: candidates.length, due: due.length, apiCalls, updates, anyFinished: finished };
}

const ESPN_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";
const ESPN_ORDER: Record<string, number> = { NS: 0, "1H": 1, LIVE: 1, HT: 2, "2H": 3, ET: 4, BT: 4, P: 5, FT: 6, AET: 6, PEN: 6 };
function espnDate(ms: number): string { return new Date(ms).toISOString().slice(0, 10).replace(/-/g, ""); }
function mapEspnStatus(status: any): { usable: boolean; corto: string; finalizado: boolean } {
  const t = status?.type ?? {};
  const name = String(t.name ?? "");
  const state = String(t.state ?? "");
  const period = Number(status?.period);
  if (state === "post") {
    if (name === "STATUS_FINAL_PEN") return { usable: true, corto: "PEN", finalizado: true };
    if (name === "STATUS_FINAL_AET") return { usable: true, corto: "AET", finalizado: true };
    if (/FINAL|FULL_TIME/.test(name)) return { usable: true, corto: "FT", finalizado: true };
    return { usable: false, corto: "FT", finalizado: false };
  }
  if (state === "in") {
    if (name === "STATUS_HALFTIME") return { usable: true, corto: "HT", finalizado: false };
    if (/SHOOTOUT|PENALT/.test(name) || period >= 5) return { usable: true, corto: "P", finalizado: false };
    if (/EXTRA|OVERTIME/.test(name) || period === 3 || period === 4) return { usable: true, corto: "ET", finalizado: false };
    if (name === "STATUS_FIRST_HALF" || period === 1) return { usable: true, corto: "1H", finalizado: false };
    if (name === "STATUS_SECOND_HALF" || period === 2) return { usable: true, corto: "2H", finalizado: false };
    return { usable: true, corto: "LIVE", finalizado: false };
  }
  return { usable: false, corto: "NS", finalizado: false };
}
function espnMinute(status: any): number | null {
  const m = String(status?.displayClock ?? "").match(/^(\d+)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function normClock(v: unknown): string {
  return String(v ?? "").replace(/'/g, "").trim();
}
function espnLabel(status: any): string | null {
  const c = normClock(status?.displayClock);
  return c.includes("+") ? c : null;
}
function jsonCount(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}
function parseEspnDetails(details: any[], homeTeamId: string, localIsHome: boolean) {
  const golL: any[] = [], golV: any[] = [], tarL: any[] = [], tarV: any[] = [];
  for (const dt of details ?? []) {
    if (dt?.shootout === true) continue;
    const teamId = String(dt?.team?.id ?? "");
    if (!teamId || !homeTeamId) continue;
    const homeSide = teamId === homeTeamId;
    const isLocal = localIsHome ? homeSide : !homeSide;
    const minute = normClock(dt.clock?.displayValue);
    const name = String((dt.athletesInvolved ?? [])[0]?.displayName ?? "");
    if (dt.scoringPlay === true) {
      const g: any = { name, minute };
      if (dt.ownGoal === true) g.owngoal = true;
      if (dt.penaltyKick === true) g.penalty = true;
      (isLocal ? golL : golV).push(g);
    } else if (dt.redCard === true || dt.yellowCard === true) {
      (isLocal ? tarL : tarV).push({ name, minute, tipo: dt.redCard === true ? "roja" : "amarilla" });
    }
  }
  return { golL, golV, tarL, tarV };
}
async function espnPrimary(supabase: any, rows: any[], nowMs: number): Promise<{ result: any; handled: Set<number>; statusOverride: Map<number, string>; finishedIds: Set<number>; anyFinished: boolean }> {
  const handled = new Set<number>();
  const statusOverride = new Map<number, string>();
  const finishedIds = new Set<number>();
  let anyFinished = false;
  const done = (result: any) => ({ result, handled, statusOverride, finishedIds, anyFinished });
  if (!rows.length) return done({ enabled: true, checked: 0 });
  const from = espnDate(nowMs - 24 * 3600000);
  const to = espnDate(nowMs + 24 * 3600000);
  let payload: any;
  try {
    const r = await fetch(`${ESPN_SCOREBOARD}?dates=${from}-${to}`);
    if (!r.ok) throw new Error(`espn scoreboard -> ${r.status}`);
    payload = await r.json();
  } catch (e) { return done({ enabled: true, error: String(e) }); }
  const events = Array.isArray(payload?.events) ? payload.events : [];
  const byPair = new Map<string, any>();
  for (const ev of events) {
    const comp = ev?.competitions?.[0];
    if (!comp) continue;
    const comps = Array.isArray(comp.competitors) ? comp.competitors : [];
    const home = comps.find((c: any) => c.homeAway === "home");
    const away = comps.find((c: any) => c.homeAway === "away");
    const h = es(home?.team?.displayName ?? "");
    const a = es(away?.team?.displayName ?? "");
    if (!h || !a) continue;
    byPair.set(pairKey(h, a), { comp, home, away, h });
  }
  const updates: any[] = [];
  for (const row of rows) {
    if (row.finalizado) continue;
    if (INTERRUPT_CODES.has(row.estado_corto)) continue;
    const m = byPair.get(pairKey(row.equipo_local, row.equipo_visita));
    if (!m) continue;
    const rowId = Number(row.id);
    const mapped = mapEspnStatus(m.comp.status);
    if (!mapped.usable) continue;
    const dbOrder = ESPN_ORDER[row.estado_corto] ?? 0;
    const newOrder = ESPN_ORDER[mapped.corto] ?? 0;
    if (!mapped.finalizado && newOrder < dbOrder) continue;
    const localIsHome = m.h === row.equipo_local;
    const homeTeamId = String(m.home?.team?.id ?? m.home?.id ?? "");
    let gl = scoreNum(localIsHome ? m.home?.score : m.away?.score);
    let gv = scoreNum(localIsHome ? m.away?.score : m.home?.score);
    if (!mapped.finalizado) {
      const dbL = scoreNum(row.goles_local), dbV = scoreNum(row.goles_visita);
      if (gl !== null && dbL !== null) gl = Math.max(gl, dbL);
      if (gv !== null && dbV !== null) gv = Math.max(gv, dbV);
    }
    const { golL, golV, tarL, tarV } = parseEspnDetails(m.comp.details ?? [], homeTeamId, localIsHome);
    const patch: any = {
      estado_corto: mapped.corto,
      estado_largo: m.comp.status?.type?.description ?? mapped.corto,
      finalizado: false,
      updated_at: new Date(nowMs).toISOString(),
    };
    if (mapped.finalizado || mapped.corto === "HT" || mapped.corto === "P") { patch.minuto = null; patch.minuto_label = null; }
    else { patch.minuto = espnMinute(m.comp.status); patch.minuto_label = espnLabel(m.comp.status); }
    if (gl !== null) patch.goles_local = gl;
    if (gv !== null) patch.goles_visita = gv;
    if (mapped.finalizado || golL.length > jsonCount(row.goleadores_local)) patch.goleadores_local = golL;
    if (mapped.finalizado || golV.length > jsonCount(row.goleadores_visita)) patch.goleadores_visita = golV;
    if (mapped.finalizado || tarL.length > jsonCount(row.tarjetas_local)) patch.tarjetas_local = tarL;
    if (mapped.finalizado || tarV.length > jsonCount(row.tarjetas_visita)) patch.tarjetas_visita = tarV;
    const ph = scoreNum(m.home?.shootoutScore);
    const pa = scoreNum(m.away?.shootoutScore);
    if ((mapped.corto === "P" || mapped.corto === "PEN") && ph !== null && pa !== null) {
      patch.pen_local = localIsHome ? ph : pa;
      patch.pen_visita = localIsHome ? pa : ph;
    }
    if (mapped.finalizado) {
      if (KO_ROUNDS.has(row.ronda)) {
        let g: number | null = null;
        if (m.home?.winner === true) g = localIsHome ? 1 : 2;
        else if (m.away?.winner === true) g = localIsHome ? 2 : 1;
        if (!g && ph !== null && pa !== null && ph !== pa) g = ph > pa ? (localIsHome ? 1 : 2) : (localIsHome ? 2 : 1);
        if (!g && mapped.corto !== "PEN") g = scoreWinner(gl, gv);
        if (!g) continue;
        patch.ganador_ko = g;
      }
      patch.finalizado = true;
    }
    const { error } = await supabase.from("qn_partidos").update(patch).eq("id", row.id);
    if (error) continue;
    handled.add(rowId);
    statusOverride.set(rowId, mapped.corto);
    if (patch.finalizado) { finishedIds.add(rowId); anyFinished = true; }
    updates.push({ id: row.id, partido: `${row.equipo_local} ${patch.goles_local ?? row.goles_local ?? "-"}-${patch.goles_visita ?? row.goles_visita ?? "-"} ${row.equipo_visita}`, min: patch.minuto ?? null, label: patch.minuto_label ?? null, estado: mapped.corto, ft: patch.finalizado === true });
  }
  return done({ enabled: true, checked: rows.length, matched: updates.length, updates });
}

async function syncFlashscoreKnockoutTeams(supabase: any, rapidKey: string, nowMs: number, cfg: any): Promise<any> {
  const last = cfg?.last_full_sync ? Date.parse(cfg.last_full_sync) : 0;
  if (last && nowMs - last < FLASH_KO_SYNC_INTERVAL_MS) {
    return { skipped: true, reason: "throttled", nextInMs: FLASH_KO_SYNC_INTERVAL_MS - (nowMs - last) };
  }

  const { data: rows, error } = await supabase
    .from("qn_partidos")
    .select("id, kickoff, ronda, equipo_local, equipo_visita, equipo_local_id, equipo_visita_id, equipo_local_logo, equipo_visita_logo, finalizado")
    .in("ronda", Array.from(KO_ROUNDS))
    .gte("kickoff", new Date(nowMs - 12 * 3600000).toISOString())
    .order("kickoff", { ascending: true });
  if (error) return { error: error.message };
  if (!rows || rows.length === 0) return { skipped: true, reason: "no_ko_rows" };

  const fetched: any[] = [];
  const fetchErrors: any[] = [];
  for (let day = -1; day <= FLASH_KO_LOOKAHEAD_DAYS; day++) {
    try {
      const list = await rapid(`matches/list?sport_id=1&day=${day}`, rapidKey);
      for (const fm of tournamentMatches(list)) {
        const koMs = fsKickoffMs(fm);
        const home = fsTeam(fm, "home");
        const away = fsTeam(fm, "away");
        if (!koMs || !concreteTeam(home.name) || !concreteTeam(away.name)) continue;
        fetched.push({ matchId: fm.match_id ?? null, koMs, home, away, rawStatus: fm.match_status ?? null });
      }
    } catch (e) {
      fetchErrors.push({ day, error: String(e) });
    }
  }

  const used = new Set<number>();
  const updates: any[] = [];
  const sortedRows = [...rows].sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff) || Number(a.id) - Number(b.id));
  for (const row of sortedRows) {
    if (row.finalizado) continue;
    const rowMs = Date.parse(row.kickoff);
    let bestIdx = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < fetched.length; i++) {
      if (used.has(i)) continue;
      const fm = fetched[i];
      const diff = Math.abs(fm.koMs - rowMs);
      if (diff > FLASH_KO_MATCH_TOLERANCE_MS) continue;
      const knownScore = rowKnownTeamScore(row, fm.home.name, fm.away.name);
      if (concreteTeam(row.equipo_local) && concreteTeam(row.equipo_visita) && knownScore < 4) continue;
      const score = knownScore * 100000000 - diff;
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    }
    if (bestIdx < 0) continue;

    const fm = fetched[bestIdx];
    used.add(bestIdx);
    const patch: any = {};
    if (row.equipo_local !== fm.home.name) Object.assign(patch, teamPatch("equipo_local", fm.home));
    if (row.equipo_visita !== fm.away.name) Object.assign(patch, teamPatch("equipo_visita", fm.away));
    if (Object.keys(patch).length === 0) continue;
    patch.updated_at = new Date(nowMs).toISOString();
    const { error: uerr } = await supabase.from("qn_partidos").update(patch).eq("id", row.id);
    if (!uerr) {
      await supabase.from("qn_provider_checks").upsert({
        match_id: row.id,
        provider: FLASH_KO_PROVIDER,
        checked_at: new Date(nowMs).toISOString(),
        status_corto: fm.rawStatus?.stage ?? null,
        fixture_id: null,
        raw: {
          match_id: fm.matchId,
          kickoff: new Date(fm.koMs).toISOString(),
          home: fm.home,
          away: fm.away,
          source: "matches/list",
        },
      }, { onConflict: "match_id,provider" });
      updates.push({ id: row.id, local: fm.home.name, visita: fm.away.name });
    }
  }

  await supabase.from("qn_config").update({ last_full_sync: new Date(nowMs).toISOString() }).eq("id", 1);
  return {
    skipped: false,
    apiCalls: FLASH_KO_LOOKAHEAD_DAYS + 2,
    fetched: fetched.length,
    sample: fetched.slice(0, 12).map((m) => ({
      matchId: m.matchId,
      kickoff: new Date(m.koMs).toISOString(),
      local: m.home.name,
      visita: m.away.name,
    })),
    updated: updates.length,
    updates,
    fetchErrors,
  };
}

async function propagateKnockoutWinners(supabase: any, nowMs: number): Promise<any> {
  const { data: rows, error } = await supabase
    .from("qn_partidos")
    .select("id, match_no, kickoff, ronda, equipo_local, equipo_visita, equipo_local_id, equipo_visita_id, equipo_local_logo, equipo_visita_logo, finalizado, ganador_ko")
    .in("ronda", Array.from(KO_ROUNDS))
    .order("kickoff", { ascending: true });
  if (error) return { error: error.message };
  const byNum = buildKoNumberMap(rows ?? []);
  const updates: any[] = [];
  const applyTarget = async (targetNum: number, side: "local" | "visita", team: any) => {
    const target = byNum.get(targetNum);
    if (!target || !team?.name || !needsTeamUpdate(target, side, team)) return;
    const prefix = side === "local" ? "equipo_local" : "equipo_visita";
    const patch = { ...teamPatch(prefix, team), updated_at: new Date(nowMs).toISOString() };
    const { error: uerr } = await supabase.from("qn_partidos").update(patch).eq("id", target.id);
    if (!uerr) {
      Object.assign(target, patch);
      updates.push({ target: target.id, targetNum, side, team: team.name });
    }
  };

  for (const [targetStr, children] of Object.entries(KO_FEEDERS)) {
    const targetNum = Number(targetStr);
    await applyTarget(targetNum, "local", winnerTeam(byNum.get(children[0])));
    await applyTarget(targetNum, "visita", winnerTeam(byNum.get(children[1])));
  }
  const third = byNum.get(103);
  if (third) {
    await applyTarget(103, "local", loserTeam(byNum.get(THIRD_PLACE_FEEDERS[0])));
    await applyTarget(103, "visita", loserTeam(byNum.get(THIRD_PLACE_FEEDERS[1])));
  }

  return { updated: updates.length, updates };
}

Deno.serve(async (req: Request) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret) return json({ error: "unauthorized" }, 401);
  const rapidKey = Deno.env.get("RAPIDAPI_KEY");
  if (!rapidKey) return json({ error: "missing RAPIDAPI_KEY" }, 500);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const nowMs = Date.now();
  const { data: cfg } = await supabase.from("qn_config").select("season, last_full_sync").eq("id", 1).single();

  let koSync: any = null;
  try { koSync = await syncFlashscoreKnockoutTeams(supabase, rapidKey, nowMs, cfg); } catch (e) { koSync = { error: String(e) }; }
  let koAdvance: any = null;
  try { koAdvance = await propagateKnockoutWinners(supabase, nowMs); } catch (e) { koAdvance = { error: String(e) }; }

  let penResolve: any = null;
  try { penResolve = await resolvePenalesPendientes(supabase, nowMs); } catch (e) { penResolve = { error: String(e) }; }
  let penResolveScored = false;
  if (penResolve && Array.isArray(penResolve.fixed) && penResolve.fixed.length > 0) penResolveScored = true;

  const { data: live, error: qerr } = await supabase
    .from("qn_partidos")
    .select("id, kickoff, ronda, equipo_local, equipo_visita, estado_corto, updated_at, finalizado, goles_local, goles_visita, goleadores_local, goleadores_visita, tarjetas_local, tarjetas_visita")
    .eq("finalizado", false)
    .lte("kickoff", new Date(nowMs + PRE_ROLL_MS).toISOString())
    .gte("kickoff", new Date(nowMs - WINDOW_MIN * 60000).toISOString());

  if (qerr) return json({ error: qerr.message }, 500);
  if (!live || live.length === 0) return json({ ok: true, ventana: 0, apiCalls: 0, summaryCalls: 0, summarySkipped: 0, koSync, koAdvance, penResolve, backup: { enabled: !!apiFootballKey(), candidates: 0 }, note: "sin partidos en ventana" });

  const backoffMs = (estado: string): number => estado === "SUSP" ? SUSP_BACKOFF_MS : estado === "INT" ? INT_BACKOFF_MS : 0;
  const isDue = (m: any): boolean => {
    const b = backoffMs(m.estado_corto);
    if (b === 0) return true;
    const last = m.updated_at ? Date.parse(m.updated_at) : 0;
    return (nowMs - last) >= b;
  };
  const dueRows = live.filter(isDue);
  const enBackoff = live.length - dueRows.length;
  if (dueRows.length === 0) return json({ ok: true, ventana: live.length, apiCalls: 0, summaryCalls: 0, summarySkipped: 0, enBackoff, koSync, koAdvance, penResolve, note: "todos interrumpidos/suspendidos en backoff" });

  const espn = await espnPrimary(supabase, dueRows, nowMs);

  let apiCalls = 0;
  let summaryCalls = 0;
  let summarySkipped = 0;
  const fsRows = dueRows.filter((m: any) => !espn.handled.has(Number(m.id)));
  const byPair = new Map<string, any>();
  let listError: string | null = null;
  const pending = new Set(fsRows.map((m: any) => pairKey(m.equipo_local, m.equipo_visita)));
  for (const day of [0, -1]) {
    if (pending.size === 0) break;
    let list: any;
    try { list = await rapid(`matches/list?sport_id=1&day=${day}`, rapidKey); apiCalls++; }
    catch (e) { listError = String(e); break; }
    for (const fm of tournamentMatches(list)) {
      const h = es(fm.home_team?.name ?? ""), a = es(fm.away_team?.name ?? "");
      if (!h || !a) continue;
      const k = pairKey(h, a);
      if (pending.has(k)) { byPair.set(k, fm); pending.delete(k); }
    }
  }

  const updates: any[] = [];
  let anyFinished = penResolveScored || espn.anyFinished;
  const statusOverride = new Map<number, string>(espn.statusOverride);
  const primaryFinishedIds = new Set<number>(espn.finishedIds);
  for (const row of fsRows) {
    const fm = byPair.get(pairKey(row.equipo_local, row.equipo_visita));
    if (!fm) {
      if (INTERRUPT_CODES.has(row.estado_corto)) await supabase.from("qn_partidos").update({ updated_at: new Date().toISOString() }).eq("id", row.id);
      continue;
    }
    const st = fm.match_status ?? {};
    const liveMin = Number(st.live_minute);
    const started = !!st.is_started || !!st.is_in_progress || (Number.isFinite(liveMin) && liveMin > 0) || !!st.is_finished;
    if (!started) continue;

    const { corto, interrupted } = mapEstado(st);
    const esHome = es(fm.home_team?.name ?? "");
    const localIsHome = esHome === row.equipo_local;
    const sc = fm.scores ?? {};
    let golesLocal = localIsHome ? sc.home : sc.away;
    let golesVisita = localIsHome ? sc.away : sc.home;
    const rawFinished = !!st.is_finished;
    if (!interrupted && !rawFinished && (ESPN_ORDER[corto] ?? 99) < (ESPN_ORDER[row.estado_corto] ?? 0)) continue;
    const koMs = Date.parse(row.kickoff);
    let minuto: number | null = null;
    let minutoLabel: string | null = null;
    if (!rawFinished && !interrupted) {
      minuto = Number.isFinite(liveMin) && liveMin > 0 ? liveMin : Math.max(0, Math.min(Math.floor((nowMs - koMs) / 60000), 120));
      const lt = typeof st.live_time === "string" ? st.live_time : null;
      minutoLabel = lt && lt.includes("+") ? lt : null;
    }
    const patch: any = { estado_corto: corto, estado_largo: st.stage ?? null, minuto, minuto_label: minutoLabel, updated_at: new Date().toISOString() };
    const detailCheck = detailsDue(nowMs, row, corto, rawFinished, golesLocal, golesVisita);
    if (!interrupted && detailCheck.due) {
      try {
        const sum = await rapid(`matches/match/summary?match_id=${fm.match_id}`, rapidKey); apiCalls++; summaryCalls++;
        const { golL, golV, tarL, tarV } = parseSummary(sum, localIsHome);
        if (rawFinished || golL.length > jsonCount(row.goleadores_local)) patch.goleadores_local = golL;
        if (rawFinished || golV.length > jsonCount(row.goleadores_visita)) patch.goleadores_visita = golV;
        if (rawFinished || tarL.length > jsonCount(row.tarjetas_local)) patch.tarjetas_local = tarL;
        if (rawFinished || tarV.length > jsonCount(row.tarjetas_visita)) patch.tarjetas_visita = tarV;
        golesLocal = Math.max(Number(golesLocal) || 0, golL.length);
        golesVisita = Math.max(Number(golesVisita) || 0, golV.length);
      } catch (_e) { /* keep score from list; leave detail untouched */ }
    } else if (!interrupted) {
      summarySkipped++;
    }
    if (!rawFinished) {
      const dbL = scoreNum(row.goles_local), dbV = scoreNum(row.goles_visita);
      if (dbL !== null) golesLocal = Math.max(Number(golesLocal) || 0, dbL);
      if (dbV !== null) golesVisita = Math.max(Number(golesVisita) || 0, dbV);
    }
    patch.goles_local = golesLocal ?? row.goles_local ?? null;
    patch.goles_visita = golesVisita ?? row.goles_visita ?? null;
    let ganadorKo: number | null = null;
    if (rawFinished && KO_ROUNDS.has(row.ronda)) {
      const ganadorApi = flashscoreWinner(st, localIsHome);
      const ganadorMarcador = corto === "PEN" ? null : scoreWinner(golesLocal, golesVisita);
      ganadorKo = ganadorApi ?? ganadorMarcador;
      if (ganadorKo) patch.ganador_ko = ganadorKo;
    }
    const pendingKoWinner = rawFinished && KO_ROUNDS.has(row.ronda) && corto !== "PEN" && !ganadorKo;
    const finished = rawFinished && !pendingKoWinner;
    patch.finalizado = finished;
    if (finished) anyFinished = true;
    if (finished && corto === "PEN") {
      const afKey = apiFootballKey();
      if (afKey) {
        try {
          const af = await fetchApiFootballFixtureForRow(supabase, row, afKey);
          const pen = extractPenales(row, af);
          if (pen) {
            patch.ganador_ko = pen.ganador_ko;
            if (pen.pen_local != null) patch.pen_local = pen.pen_local;
            if (pen.pen_visita != null) patch.pen_visita = pen.pen_visita;
          }
        } catch (_e) { /* deja el llenado manual del admin */ }
      }
    }
    const { error: uerr } = await supabase.from("qn_partidos").update(patch).eq("id", row.id);
    if (!uerr) {
      statusOverride.set(Number(row.id), corto);
      if (finished) primaryFinishedIds.add(Number(row.id));
      updates.push({ id: row.id, partido: `${row.equipo_local} ${patch.goles_local ?? "-"}-${patch.goles_visita ?? "-"} ${row.equipo_visita}`, min: minuto, label: minutoLabel, estado: corto, ft: finished, details: detailCheck.reason });
    }
  }

  let backup: any = null;
  try {
    backup = await runApiFootballBackup(supabase, dueRows, nowMs, cfg?.season ?? null, statusOverride, primaryFinishedIds);
    if (backup?.anyFinished) anyFinished = true;
  } catch (e) { backup = { enabled: true, error: String(e) }; }

  try {
    const afterLiveAdvance = await propagateKnockoutWinners(supabase, nowMs);
    if (afterLiveAdvance?.updated) koAdvance = afterLiveAdvance;
  } catch (e) { koAdvance = { error: String(e) }; }

  let scored: any = null;
  if (anyFinished) { const { data } = await supabase.rpc("qn_calcular_pendientes"); scored = data; }
  await supabase.from("qn_config").update({ last_live_sync: new Date().toISOString() }).eq("id", 1);
  return json({ ok: true, ventana: live.length, due: dueRows.length, enBackoff, espn: espn.result, fsMatched: updates.length, listError, apiCalls, summaryCalls, summarySkipped, koSync, koAdvance, penResolve, backup, scored, fsUpdates: updates });
});

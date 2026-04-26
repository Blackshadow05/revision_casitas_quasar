import { addRxPlugin, createRxDatabase } from 'rxdb'
import CryptoJS from 'crypto-js'
import { RxDBCleanupPlugin } from 'rxdb/plugins/cleanup'
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election'
import { replicateRxCollection } from 'rxdb/plugins/replication'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { supabase } from '../supabase'

const HOME_DATABASE_NAME = 'revision-casitas-home-v2'
const HOME_COLLECTION_NAME = 'revisiones_casitas'
export const HOME_SYNC_WINDOW_MONTHS = 6
export const HOME_SYNC_BATCH_SIZE = 250
export const HOME_SYNC_POLL_MS = 60 * 1000

const stringField = (maxLength) => ({ type: 'string', maxLength })

const revisionesCasitasSchema = {
  title: 'revisiones casitas local cache',
  version: 0,
  description: 'Cache local para el home de revisiones_casitas',
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: stringField(64),
    created_at: stringField(32),
    update_at: stringField(32),
    casita: stringField(32),
    quien_revisa: stringField(160),
    caja_fuerte: stringField(80),
    room_move: stringField(160),
    puertas_ventanas: stringField(400),
    chromecast: stringField(16),
    binoculares: stringField(16),
    trapo_binoculares: stringField(16),
    speaker: stringField(16),
    usb_speaker: stringField(16),
    controles_tv: stringField(16),
    secadora: stringField(16),
    accesorios_secadora: stringField(32),
    steamer: stringField(16),
    bolsa_vapor: stringField(16),
    plancha_cabello: stringField(16),
    cola_caballo: stringField(16),
    bulto: stringField(16),
    sombrero: stringField(16),
    bolso_yute: stringField(16),
    camas_ordenadas: stringField(16),
    evidencia_01: stringField(512),
    evidencia_02: stringField(512),
    evidencia_03: stringField(512),
    foto_minibar: stringField(512),
    foto_amenidad: stringField(512),
    notas: stringField(6000),
    nota_extra: stringField(6000),
    usuario_nota: stringField(160),
    hora_nota: stringField(32),
    imagen_nota: stringField(512)
  },
  required: ['id', 'created_at', 'update_at', 'casita', 'quien_revisa'],
  indexes: [
    'created_at',
    'update_at',
    'casita',
    'quien_revisa',
    ['casita', 'created_at']
  ]
}

const trackedFields = Object.keys(revisionesCasitasSchema.properties)

let pluginsRegistered = false
let databasePromise = null
let databaseInstance = null
let replicationPromise = null
let replicationState = null
let replicationSubscriptions = []
let resyncTimerId = null
let onlineListenerRegistered = false
let realtimePromise = null
let realtimeChannel = null

const syncListeners = new Set()
const realtimeListeners = new Set()
const syncState = createInitialSyncState()

function createInitialSyncState() {
  return {
    databaseReady: false,
    syncing: false,
    firstSyncPending: true,
    firstSyncCompleted: false,
    initialSyncPulled: 0,
    lastSyncAt: null,
    error: null
  }
}

function broadcastSyncState(patch = {}) {
  Object.assign(syncState, patch)
  const snapshot = { ...syncState }
  syncListeners.forEach((listener) => listener(snapshot))
}

function resetSyncState() {
  const freshState = createInitialSyncState()

  Object.keys(syncState).forEach((key) => {
    syncState[key] = freshState[key]
  })

  const snapshot = { ...syncState }
  syncListeners.forEach((listener) => listener(snapshot))
}

function registerPlugins() {
  if (pluginsRegistered) {
    return
  }

  addRxPlugin(RxDBCleanupPlugin)
  addRxPlugin(RxDBLeaderElectionPlugin)
  pluginsRegistered = true
}

function isRxDbSchemaConflict(error) {
  if (!error) {
    return false
  }

  if (error.code === 'DB6') {
    return true
  }

  const message = String(error?.message || '')
  return message.includes('RxDB Error-Code: DB6')
}

function forceDeleteIndexedDbByName(databaseName) {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(false)
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.deleteDatabase(databaseName)

      request.onsuccess = () => resolve(true)
      request.onerror = () => resolve(false)
      request.onblocked = () => resolve(false)
    } catch (_error) {
      resolve(false)
    }
  })
}

function arrayBufferToWordArray(buffer) {
  const bytes = new Uint8Array(buffer)
  const words = []

  for (let index = 0; index < bytes.length; index += 1) {
    words[index >>> 2] |= bytes[index] << (24 - (index % 4) * 8)
  }

  return CryptoJS.lib.WordArray.create(words, bytes.length)
}

async function hashInputSha256(input) {
  if (typeof crypto !== 'undefined' && typeof crypto.subtle?.digest === 'function') {
    let data

    if (typeof Blob !== 'undefined' && input instanceof Blob) {
      data = await input.arrayBuffer()
    } else if (typeof input === 'string') {
      data = new TextEncoder().encode(input)
    } else {
      data = input
    }

    const hashBuffer = await crypto.subtle.digest('SHA-256', data)

    return Array.from(new Uint8Array(hashBuffer))
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('')
  }

  if (typeof Blob !== 'undefined' && input instanceof Blob) {
    return CryptoJS.SHA256(arrayBufferToWordArray(await input.arrayBuffer())).toString(CryptoJS.enc.Hex)
  }

  if (typeof input === 'string') {
    return CryptoJS.SHA256(input).toString(CryptoJS.enc.Hex)
  }

  return CryptoJS.SHA256(arrayBufferToWordArray(input)).toString(CryptoJS.enc.Hex)
}

async function createHomeDatabaseInstance() {
  const database = await createRxDatabase({
    name: HOME_DATABASE_NAME,
    storage: getRxStorageDexie(),
    multiInstance: true,
    eventReduce: true,
    closeDuplicates: true,
    hashFunction: hashInputSha256
  })

  await database.addCollections({
    [HOME_COLLECTION_NAME]: {
      schema: revisionesCasitasSchema
    }
  })

  return database
}

function toLocalDatabaseTimestamp(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ')
}

function getWindowStartTimestamp() {
  const boundary = new Date()
  boundary.setMonth(boundary.getMonth() - HOME_SYNC_WINDOW_MONTHS)
  return toLocalDatabaseTimestamp(boundary)
}

function asText(value, fallback = '') {
  if (value === undefined || value === null) {
    return fallback
  }

  return String(value)
}

function normalizeDbTimestamp(value, fallback) {
  if (!value) {
    return fallback
  }

  return String(value)
    .replace('T', ' ')
    .replace(/([+-]\d{2}:\d{2}|Z)$/i, '')
    .slice(0, 19)
}

function normalizeRevision(row = {}) {
  const createdAt = normalizeDbTimestamp(row.created_at, toLocalDatabaseTimestamp(new Date()))
  const updateAt = normalizeDbTimestamp(row.update_at, createdAt)

  return trackedFields.reduce((document, field) => {
    if (field === 'id') {
      document.id = asText(row.id)
      return document
    }

    if (field === 'created_at') {
      document.created_at = createdAt
      return document
    }

    if (field === 'update_at') {
      document.update_at = updateAt
      return document
    }

    document[field] = asText(row[field])
    return document
  }, {})
}

function compareCheckpoint(left, right) {
  if (left.update_at === right.update_at) {
    return left.id < right.id ? -1 : (left.id > right.id ? 1 : 0)
  }

  return left.update_at < right.update_at ? -1 : 1
}

function isAfterCheckpoint(document, checkpoint) {
  if (!checkpoint || !checkpoint.updateAt) {
    return true
  }

  if (document.update_at > checkpoint.updateAt) {
    return true
  }

  return document.update_at === checkpoint.updateAt && document.id > checkpoint.id
}

function getNextCheckpoint(documents, currentCheckpoint, windowStart) {
  const lastDocument = documents[documents.length - 1]

  if (!lastDocument) {
    return currentCheckpoint || {
      updateAt: windowStart,
      id: ''
    }
  }

  return {
    updateAt: lastDocument.update_at,
    id: lastDocument.id
  }
}

function updateFirstSyncProgress(batchSize) {
  if (!syncState.firstSyncPending || batchSize <= 0) {
    return
  }

  broadcastSyncState({
    initialSyncPulled: syncState.initialSyncPulled + batchSize,
    error: null
  })
}

function normalizeBatch(rows, checkpoint, batchSize, _windowStart) {
  return (rows || [])
    .map((row) => normalizeRevision(row))
    .filter((document) => isAfterCheckpoint(document, checkpoint))
    .sort(compareCheckpoint)
    .slice(0, batchSize)
}

function shouldFallbackToDirectQuery(error) {
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase()
  return error?.code === 'PGRST202' || message.includes('pull_revisiones_casitas_window')
}

async function pullWithRpc(checkpoint, batchSize, windowStart) {
  const { data, error } = await supabase.rpc('pull_revisiones_casitas_window', {
    p_window_start: windowStart,
    p_last_update_at: checkpoint?.updateAt || null,
    p_last_id: checkpoint?.id || null,
    p_limit: batchSize
  })

  if (error) {
    throw error
  }

  return normalizeBatch(data, checkpoint, batchSize, windowStart)
}

async function pullWithDirectQuery(checkpoint, batchSize, windowStart) {
  const threshold = checkpoint?.updateAt || windowStart
  const { data, error } = await supabase
    .from('revisiones_casitas')
    .select('*')
    .gte('created_at', windowStart)
    .gte('update_at', threshold)
    .order('update_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(batchSize * 3)

  if (error) {
    throw error
  }

  return normalizeBatch(data, checkpoint, batchSize, windowStart)
}

async function pullHomeBatch(checkpoint, batchSize) {
  const windowStart = getWindowStartTimestamp()
  let documents = []

  try {
    documents = await pullWithRpc(checkpoint, batchSize, windowStart)
  } catch (error) {
    if (!shouldFallbackToDirectQuery(error)) {
      throw error
    }

    documents = await pullWithDirectQuery(checkpoint, batchSize, windowStart)
  }

  updateFirstSyncProgress(documents.length)

  return {
    documents,
    checkpoint: getNextCheckpoint(documents, checkpoint, windowStart)
  }
}

function releaseReplicationSubscriptions() {
  replicationSubscriptions.forEach((subscription) => subscription.unsubscribe())
  replicationSubscriptions = []
}

function triggerReplicationResync() {
  if (!replicationState) {
    return
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return
  }

  replicationState.reSync()
}

function startResyncPolling() {
  if (typeof window === 'undefined') {
    return
  }

  if (resyncTimerId) {
    window.clearInterval(resyncTimerId)
  }

  resyncTimerId = window.setInterval(() => {
    triggerReplicationResync()
  }, HOME_SYNC_POLL_MS)

  if (!onlineListenerRegistered) {
    window.addEventListener('online', triggerReplicationResync)
    onlineListenerRegistered = true
  }
}

function stopResyncPolling() {
  if (typeof window !== 'undefined' && resyncTimerId) {
    window.clearInterval(resyncTimerId)
  }

  resyncTimerId = null

  if (typeof window !== 'undefined' && onlineListenerRegistered) {
    window.removeEventListener('online', triggerReplicationResync)
    onlineListenerRegistered = false
  }
}

function attachReplicationObservers() {
  if (!replicationState) {
    return
  }

  releaseReplicationSubscriptions()

  replicationSubscriptions = [
    replicationState.active$.subscribe((active) => {
      broadcastSyncState({ syncing: active })
    }),
    replicationState.error$.subscribe((error) => {
      console.error('[HomeSync] Error de replicación:', error)
      broadcastSyncState({
        error: error?.message || 'No se pudo sincronizar el inicio',
        syncing: false
      })
    })
  ]

  replicationState.awaitInSync()
    .then(() => {
      if (syncState.firstSyncPending) {
        broadcastSyncState({
          firstSyncPending: false,
          firstSyncCompleted: true,
          lastSyncAt: toLocalDatabaseTimestamp(new Date()),
          error: null
        })
        return
      }

      broadcastSyncState({
        lastSyncAt: toLocalDatabaseTimestamp(new Date()),
        error: null
      })
    })
    .catch((error) => {
      console.error('[HomeSync] Falló la sincronización inicial:', error)
      broadcastSyncState({
        error: error?.message || 'No se pudo completar la sincronización inicial',
        syncing: false
      })
    })
}

function emitRealtimeChange(change) {
  realtimeListeners.forEach((listener) => listener(change))
}

function isWithinSyncWindow(document) {
  const effectiveTimestamp = document.update_at || document.created_at || ''
  return effectiveTimestamp >= getWindowStartTimestamp()
}

async function applyRealtimeDelete(payload) {
  const collection = await getHomeCollection()
  const documentId = asText(payload?.old?.id)

  if (!documentId) {
    return
  }

  const existingDocument = await collection.findOne(documentId).exec()
  const existingData = existingDocument ? normalizeRevision(existingDocument.toJSON()) : null

  if (existingDocument) {
    await existingDocument.remove()
  }

  broadcastSyncState({
    lastSyncAt: toLocalDatabaseTimestamp(new Date()),
    error: null
  })

  emitRealtimeChange({
    eventType: 'DELETE',
    record: existingData || normalizeRevision(payload?.old || { id: documentId })
  })
}

async function applyRealtimeUpsert(payload) {
  const collection = await getHomeCollection()
  const record = normalizeRevision(payload?.new || {})

  if (!record.id) {
    return
  }

  if (!isWithinSyncWindow(record)) {
    const existingDocument = await collection.findOne(record.id).exec()

    if (existingDocument) {
      await existingDocument.remove()
    }

    return
  }

  await collection.incrementalUpsert(record)

  broadcastSyncState({
    lastSyncAt: toLocalDatabaseTimestamp(new Date()),
    error: null
  })

  emitRealtimeChange({
    eventType: payload.eventType,
    record
  })
}

async function handleRealtimePayload(payload) {
  try {
    if (payload.eventType === 'DELETE') {
      await applyRealtimeDelete(payload)
      return
    }

    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      await applyRealtimeUpsert(payload)
    }
  } catch (error) {
    console.error('[HomeSync] Error aplicando cambio realtime:', error)
  }
}

export function subscribeHomeSyncState(listener) {
  syncListeners.add(listener)
  listener({ ...syncState })

  return () => {
    syncListeners.delete(listener)
  }
}

export function getHomeSyncState() {
  return { ...syncState }
}

export function subscribeHomeRealtime(listener) {
  realtimeListeners.add(listener)

  return () => {
    realtimeListeners.delete(listener)
  }
}

export async function ensureHomeDatabase() {
  if (databasePromise) {
    return databasePromise
  }

  databasePromise = (async () => {
    registerPlugins()

    let database

    try {
      database = await createHomeDatabaseInstance()
    } catch (error) {
      if (!isRxDbSchemaConflict(error)) {
        throw error
      }

      console.warn('[HomeSync] Esquema local anterior detectado, recreando cache local...')

      if (database?.remove) {
        await database.remove().catch(() => null)
      }

      await forceDeleteIndexedDbByName(HOME_DATABASE_NAME)

      database = await createHomeDatabaseInstance()
    }

    databaseInstance = database
    broadcastSyncState({
      databaseReady: true,
      error: null
    })

    return database
  })().catch((error) => {
    databasePromise = null
    databaseInstance = null
    broadcastSyncState({
      databaseReady: false,
      error: error?.message || 'No se pudo abrir la base local'
    })
    throw error
  })

  return databasePromise
}

export async function getHomeCollection() {
  const database = await ensureHomeDatabase()
  return database[HOME_COLLECTION_NAME]
}

export async function ensureHomeReplication() {
  if (replicationPromise) {
    return replicationPromise
  }

  replicationPromise = (async () => {
    const collection = await getHomeCollection()

    if (!replicationState) {
      replicationState = replicateRxCollection({
        collection,
        replicationIdentifier: 'revisiones-casitas-home-pull-v2',
        live: true,
        retryTime: 15 * 1000,
        autoStart: true,
        waitForLeadership: false,
        pull: {
          batchSize: HOME_SYNC_BATCH_SIZE,
          handler: (checkpoint, limit) => pullHomeBatch(checkpoint, limit || HOME_SYNC_BATCH_SIZE)
        }
      })

      attachReplicationObservers()
      startResyncPolling()
    }

    if (!realtimePromise) {
      realtimePromise = supabase
        .channel('revisiones-casitas-home-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'revisiones_casitas' },
          (payload) => {
            void handleRealtimePayload(payload)
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.error('[HomeSync] Falló la suscripción realtime de revisiones_casitas')
          }
        })

      realtimeChannel = realtimePromise
    }

    return replicationState
  })().catch((error) => {
    replicationPromise = null
    replicationState = null
    releaseReplicationSubscriptions()
    throw error
  })

  return replicationPromise
}

export async function awaitFirstHomeSync() {
  const state = await ensureHomeReplication()
  await state.awaitInSync()

  broadcastSyncState({
    firstSyncPending: false,
    firstSyncCompleted: true,
    lastSyncAt: toLocalDatabaseTimestamp(new Date()),
    error: null
  })

  return true
}

export async function resyncHomeReplication() {
  const state = await ensureHomeReplication()

  state.reSync()
  await state.awaitInSync()

  broadcastSyncState({
    firstSyncPending: false,
    firstSyncCompleted: true,
    lastSyncAt: toLocalDatabaseTimestamp(new Date()),
    error: null
  })

  return true
}

export async function clearHomeDatabase() {
  releaseReplicationSubscriptions()
  stopResyncPolling()

  if (realtimeChannel) {
    await supabase.removeChannel(realtimeChannel).catch(() => null)
  }

  realtimeChannel = null
  realtimePromise = null

  if (replicationState?.cancel) {
    replicationState.cancel()
  }

  replicationState = null
  replicationPromise = null

  let database = databaseInstance

  if (!database && databasePromise) {
    database = await databasePromise.catch(() => null)
  }

  databaseInstance = null
  databasePromise = null

  if (database) {
    await database.remove()
  }

  resetSyncState()
}

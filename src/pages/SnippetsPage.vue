<template>
  <q-page class="snippets-page q-pa-md">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <q-btn flat round icon="arrow_back" @click="router.back()" class="q-mr-sm" />
      <div>
        <div class="text-h5 text-weight-bold">Biblioteca de Código</div>
        <div class="text-caption text-grey-6">{{ snippets.length }} snippets guardados</div>
      </div>
    </div>

    <!-- Search bar -->
    <q-input
      v-model="search"
      outlined
      dense
      placeholder="Buscar por título, descripción o lenguaje..."
      class="q-mb-md search-input"
      clearable
    >
      <template #prepend>
        <q-icon name="search" />
      </template>
    </q-input>

    <!-- Filter chips -->
    <div class="row q-gutter-xs q-mb-md">
      <q-chip
        v-for="lang in availableLanguages"
        :key="lang"
        :color="selectedLanguage === lang ? 'primary' : 'grey-3'"
        :text-color="selectedLanguage === lang ? 'white' : 'grey-8'"
        clickable
        dense
        @click="toggleLanguageFilter(lang)"
      >
        {{ lang }}
      </q-chip>
      <q-chip
        v-if="showFavoritesOnly"
        color="orange"
        text-color="white"
        clickable
        dense
        icon="star"
        @click="showFavoritesOnly = false"
      >
        Solo favoritos
      </q-chip>
      <q-btn
        flat
        dense
        round
        :icon="showFavoritesOnly ? 'star' : 'star_border'"
        :color="showFavoritesOnly ? 'orange' : 'grey-6'"
        size="sm"
        @click="showFavoritesOnly = !showFavoritesOnly"
      >
        <q-tooltip>{{ showFavoritesOnly ? 'Mostrar todos' : 'Solo favoritos' }}</q-tooltip>
      </q-btn>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center q-py-xl">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredSnippets.length === 0" class="text-center q-py-xl">
      <q-icon name="code_off" size="64px" color="grey-4" />
      <div class="text-grey-6 q-mt-md">
        {{ search || selectedLanguage || showFavoritesOnly ? 'No hay snippets que coincidan' : 'Aún no tienes snippets. ¡Crea uno!' }}
      </div>
    </div>

    <!-- Snippets grid -->
    <div v-else class="snippets-grid">
      <q-card
        v-for="snippet in filteredSnippets"
        :key="snippet.id"
        class="snippet-card q-mb-md"
        flat
        bordered
      >
        <!-- Card header -->
        <q-card-section class="card-header q-py-sm">
          <div class="row items-center no-wrap">
            <div class="col">
              <div class="text-subtitle1 text-weight-bold ellipsis">{{ snippet.title }}</div>
              <div class="row items-center q-gutter-xs">
                <q-badge :color="languageColor(snippet.language)" outline>
                  {{ snippet.language }}
                </q-badge>
                <span v-if="snippet.description" class="text-caption text-grey-6 ellipsis" style="max-width:200px">
                  {{ snippet.description }}
                </span>
              </div>
            </div>
            <div class="row items-center q-gutter-xs">
              <q-btn
                flat round dense
                :icon="snippet.is_favorite ? 'star' : 'star_border'"
                :color="snippet.is_favorite ? 'orange' : 'grey-5'"
                size="sm"
                @click="toggleFavorite(snippet)"
              />
              <q-btn
                flat round dense
                icon="info_outline"
                color="grey-5"
                size="sm"
                @click="openDetails(snippet)"
              >
                <q-tooltip>Ver detalle</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="more_vert" size="sm" color="grey-5">
                <q-menu>
                  <q-list dense role="menu">
                    <q-item clickable v-close-popup @click="openEdit(snippet)">
                      <q-item-section avatar><q-icon name="edit" size="xs"/></q-item-section>
                      <q-item-section>Editar</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="confirmDelete(snippet)">
                      <q-item-section avatar><q-icon name="delete" color="negative" size="xs"/></q-item-section>
                      <q-item-section class="text-negative">Eliminar</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
          </div>
        </q-card-section>

        <!-- Code block -->
        <q-card-section class="code-block q-pa-none">
          <pre class="code-pre q-pa-md"><code>{{ snippet.code }}</code></pre>
        </q-card-section>

        <!-- Card actions -->
        <q-card-actions class="card-actions q-py-xs q-px-sm">
          <span class="text-caption text-grey-6">{{ formatDate(snippet.created_at) }}</span>
          <q-space />
          <q-btn
            flat dense
            icon="content_copy"
            label="Copiar"
            size="sm"
            color="primary"
            @click="copyCode(snippet)"
          />
        </q-card-actions>
      </q-card>
    </div>

    <!-- FAB -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn
        fab
        icon="add"
        color="primary"
        @click="openCreate"
      >
        <q-tooltip>Nuevo snippet</q-tooltip>
      </q-btn>
    </q-page-sticky>

    <!-- Create / Edit Dialog -->
    <q-dialog v-model="dialogOpen" persistent maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="dialog-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ editingSnippet ? 'Editar Snippet' : 'Nuevo Snippet' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="closeDialog" />
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input
            v-model="form.title"
            label="Título *"
            outlined
            dense
            :error="!!formErrors.title"
            :error-message="formErrors.title"
          />

          <q-input
            v-model="form.description"
            label="Descripción"
            outlined
            dense
            type="textarea"
            rows="2"
            autogrow
          />

          <q-select
            v-model="form.language"
            :options="languageOptions"
            label="Lenguaje"
            outlined
            dense
            emit-value
            map-options
          />

          <q-input
            v-model="form.code"
            label="Código *"
            outlined
            type="textarea"
            :rows="12"
            class="code-editor"
            :error="!!formErrors.code"
            :error-message="formErrors.code"
            autogrow
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" @click="closeDialog" />
          <q-btn
            unelevated
            :label="editingSnippet ? 'Guardar cambios' : 'Crear snippet'"
            color="primary"
            :loading="saving"
            @click="saveSnippet"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Confirm Dialog -->
    <q-dialog v-model="deleteDialogOpen">
      <q-card style="min-width:300px">
        <q-card-section>
          <div class="text-h6">Eliminar snippet</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          ¿Estás seguro de que deseas eliminar <strong>"{{ snippetToDelete?.title }}"</strong>?
          Esta acción no se puede deshacer.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn unelevated label="Eliminar" color="negative" :loading="deleting" @click="deleteSnippet" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Detail Dialog -->
    <q-dialog v-model="detailDialogOpen">
      <q-card class="detail-card">
        <q-card-section class="row items-center q-pb-none">
          <div>
            <div class="text-h6">{{ selectedSnippet?.title }}</div>
            <div class="text-caption text-grey-6">
              {{ selectedSnippet?.language }} · {{ formatDate(selectedSnippet?.created_at) }}
            </div>
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="selectedSnippet?.description" class="q-pt-sm">
          <div class="text-subtitle2 q-mb-xs">Descripción</div>
          <div class="detail-description">{{ selectedSnippet.description }}</div>
        </q-card-section>

        <q-card-section class="q-pt-sm">
          <div class="row items-center q-mb-xs">
            <div class="text-subtitle2">Código</div>
            <q-space />
            <q-btn flat dense icon="content_copy" label="Copiar" color="primary" @click="copyCode(selectedSnippet)" />
          </div>
          <pre class="code-pre detail-code"><code>{{ selectedSnippet?.code }}</code></pre>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { notify } from '../utils/notify'
import { useRouter } from 'vue-router'
import { useQuasar, copyToClipboard } from 'quasar'
import { supabase } from '../supabase'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()

// ── Access guard ──────────────────────────────────────────────────────────────
if (!authStore.user || authStore.user.Usuario !== 'Esteban B') {
  notify({ type: 'negative', message: 'No tienes permiso para acceder a esta sección.' })
  router.replace('/config')
}

// ── State ─────────────────────────────────────────────────────────────────────
const snippets = ref([])
const loading = ref(false)
const search = ref('')
const selectedLanguage = ref('')
const showFavoritesOnly = ref(false)

// Dialog state
const dialogOpen = ref(false)
const editingSnippet = ref(null)
const saving = ref(false)
const form = ref({ title: '', description: '', language: 'javascript', code: '' })
const formErrors = ref({})

const detailDialogOpen = ref(false)
const selectedSnippet = ref(null)

// Delete state
const deleteDialogOpen = ref(false)
const snippetToDelete = ref(null)
const deleting = ref(false)

// ── Options ───────────────────────────────────────────────────────────────────
const languageOptions = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Vue', value: 'vue' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'Python', value: 'python' },
  { label: 'SQL', value: 'sql' },
  { label: 'Bash', value: 'bash' },
  { label: 'JSON', value: 'json' },
  { label: 'Otro', value: 'other' },
]

// ── Computed ──────────────────────────────────────────────────────────────────
const availableLanguages = computed(() => {
  const langs = [...new Set(snippets.value.map(s => s.language).filter(Boolean))]
  return langs
})

const filteredSnippets = computed(() => {
  let result = snippets.value
  if (showFavoritesOnly.value) result = result.filter(s => s.is_favorite)
  if (selectedLanguage.value) result = result.filter(s => s.language === selectedLanguage.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(s =>
      s.title.toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q) ||
      (s.language || '').toLowerCase().includes(q)
    )
  }
  return result
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function languageColor(lang) {
  const map = {
    javascript: 'yellow-9', typescript: 'blue', vue: 'green-7',
    html: 'orange', css: 'indigo', python: 'blue-grey',
    sql: 'teal', bash: 'grey-8', json: 'brown', other: 'grey-6',
  }
  return map[lang] || 'grey-6'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function toggleLanguageFilter(lang) {
  selectedLanguage.value = selectedLanguage.value === lang ? '' : lang
}

function openDetails(snippet) {
  selectedSnippet.value = snippet
  detailDialogOpen.value = true
}

// ── Data fetching ─────────────────────────────────────────────────────────────
async function fetchSnippets() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('personal_snippets')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    snippets.value = data || []
  } catch (err) {
    notify({ type: 'negative', message: 'Error al cargar snippets: ' + err.message })
  } finally {
    loading.value = false
  }
}

// ── Copy ──────────────────────────────────────────────────────────────────────
async function copyCode(snippet) {
  try {
    await copyToClipboard(snippet.code)
    notify({ type: 'positive', message: '¡Código copiado al portapapeles!', icon: 'content_copy', timeout: 1500 })
  } catch {
    notify({ type: 'negative', message: 'No se pudo copiar el código.' })
  }
}

// ── Favorites ─────────────────────────────────────────────────────────────────
async function toggleFavorite(snippet) {
  const newVal = !snippet.is_favorite
  snippet.is_favorite = newVal // optimistic
  try {
    const { error } = await supabase
      .from('personal_snippets')
      .update({ is_favorite: newVal })
      .eq('id', snippet.id)
    if (error) throw error
  } catch (err) {
    snippet.is_favorite = !newVal // revert
    notify({ type: 'negative', message: 'Error al actualizar: ' + err.message })
  }
}

// ── Create / Edit ─────────────────────────────────────────────────────────────
function openCreate() {
  editingSnippet.value = null
  form.value = { title: '', description: '', language: 'javascript', code: '' }
  formErrors.value = {}
  dialogOpen.value = true
}

function openEdit(snippet) {
  editingSnippet.value = snippet
  form.value = {
    title: snippet.title,
    description: snippet.description || '',
    language: snippet.language || 'javascript',
    code: snippet.code,
  }
  formErrors.value = {}
  dialogOpen.value = true
}

function closeDialog() {
  dialogOpen.value = false
  editingSnippet.value = null
}

function validateForm() {
  formErrors.value = {}
  if (!form.value.title.trim()) formErrors.value.title = 'El título es obligatorio'
  if (!form.value.code.trim()) formErrors.value.code = 'El código es obligatorio'
  return Object.keys(formErrors.value).length === 0
}

async function saveSnippet() {
  if (!validateForm()) return
  saving.value = true
  try {
    if (editingSnippet.value) {
      const { error } = await supabase
        .from('personal_snippets')
        .update({
          title: form.value.title.trim(),
          description: form.value.description.trim() || null,
          language: form.value.language,
          code: form.value.code.trim(),
        })
        .eq('id', editingSnippet.value.id)
      if (error) throw error
      notify({ type: 'positive', message: 'Snippet actualizado correctamente.' })
    } else {
      const { error } = await supabase
        .from('personal_snippets')
        .insert({
          title: form.value.title.trim(),
          description: form.value.description.trim() || null,
          language: form.value.language,
          code: form.value.code.trim(),
        })
      if (error) throw error
      notify({ type: 'positive', message: '¡Snippet creado exitosamente!' })
    }
    closeDialog()
    await fetchSnippets()
  } catch (err) {
    notify({ type: 'negative', message: 'Error al guardar: ' + err.message })
  } finally {
    saving.value = false
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
function confirmDelete(snippet) {
  snippetToDelete.value = snippet
  deleteDialogOpen.value = true
}

async function deleteSnippet() {
  if (!snippetToDelete.value) return
  deleting.value = true
  try {
    const { error } = await supabase
      .from('personal_snippets')
      .delete()
      .eq('id', snippetToDelete.value.id)
    if (error) throw error
    notify({ type: 'positive', message: 'Snippet eliminado.' })
    deleteDialogOpen.value = false
    snippetToDelete.value = null
    await fetchSnippets()
  } catch (err) {
    notify({ type: 'negative', message: 'Error al eliminar: ' + err.message })
  } finally {
    deleting.value = false
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(fetchSnippets)
</script>

<style scoped>
.snippets-page {
  max-width: 900px;
  margin: 0 auto;
}

.search-input {
  border-radius: 12px;
}

.snippet-card {
  border-radius: 12px;
  overflow: hidden;
  border-color: rgba(0, 0, 0, 0.1);
}

.card-header {
  background: #f8f9fa;
}

.code-block {
  background: #1e1e2e;
  overflow: auto;
  max-height: 320px;
}

.code-pre {
  margin: 0;
  font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #cdd6f4;
  white-space: pre;
  overflow-x: auto;
}

.code-pre code {
  background: transparent;
  padding: 0;
}

.card-actions {
  background: #f8f9fa;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.code-editor :deep(textarea) {
  font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 13px;
}

.dialog-card {
  display: flex;
  flex-direction: column;
}

.detail-card {
  width: min(900px, 96vw);
}

.detail-description {
  white-space: pre-wrap;
  line-height: 1.6;
}

.detail-code {
  max-height: 50vh;
}

/* Dark mode */
.body--dark .card-header,
.body--dark .card-actions {
  background: #1a1a2e;
}

.body--dark .snippet-card {
  border-color: rgba(255, 255, 255, 0.08);
}

.body--dark .code-block {
  background: #13131f;
}
</style>

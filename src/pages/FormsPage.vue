<template>
  <q-page class="forms-page q-pa-md">
    <!-- index view -->
    <div v-if="!currentUrl">
      <div class="forms-header q-mb-lg">
        <div class="text-h4 text-weight-bold">Formularios</div>
        <div class="text-caption text-grey-6 q-mt-xs">Accede a los formularios disponibles</div>
      </div>

      <div class="settings-card">
        <q-item
          clickable
          v-ripple
          class="settings-item"
          @click="goToReportePantallas"
        >
          <q-item-section avatar>
            <div class="settings-icon-wrap bg-red">
              <q-icon name="tv" color="white" size="20px" />
            </div>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-medium">Reporte de pantallas</q-item-label>
            <q-item-label caption>Reportes, movimientos, fotos y PDF</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" color="grey-4" size="18px" />
          </q-item-section>
        </q-item>
        <q-separator inset="72px" />
        <q-item
          clickable
          v-ripple
          class="settings-item"
          @click="openForm('https://docs.google.com/forms/d/e/1FAIpQLSctsgdYAKlqLbAcbb_jkJpL8FHgMOUYnvo2YVbu7LZG_cNgAQ/viewform','Ingreso a casitas')"
        >
          <q-item-section avatar>
            <div class="settings-icon-wrap bg-blue">
              <q-icon name="assignment" color="white" size="20px" />
            </div>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-medium">Ingreso a casitas</q-item-label>
            <q-item-label caption>Formulario de ingreso</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="open_in_new" color="grey-4" size="18px" />
          </q-item-section>
        </q-item>
        <q-separator inset="72px" />
        <q-item
          clickable
          v-ripple
          class="settings-item"
          @click="openForm('https://docs.google.com/forms/d/e/1FAIpQLSdGtxFReFg-fgkZ0ixlSsmUVBciwkCfgb0tqNNTNE-EBniX8A/viewform','Bitacora Puesto 09')"
        >
          <q-item-section avatar>
            <div class="settings-icon-wrap bg-purple">
              <q-icon name="book" color="white" size="20px" />
            </div>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-medium">Bitácora Puesto 09</q-item-label>
            <q-item-label caption>Registro diario - Puesto 09</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="open_in_new" color="grey-4" size="18px" />
          </q-item-section>
        </q-item>
        <q-separator inset="72px" />
        <q-item
          clickable
          v-ripple
          class="settings-item"
          @click="openForm('https://docs.google.com/forms/d/e/1FAIpQLScB6x6ckXbPeqtFOm8VUpllzcuIL7OFstdI3rCChJ7wX1wVNA/viewform','Reporte turno puesto 09')"
        >
          <q-item-section avatar>
            <div class="settings-icon-wrap bg-teal">
              <q-icon name="report" color="white" size="20px" />
            </div>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-medium">Reporte turno Puesto 09</q-item-label>
            <q-item-label caption>Reporte de turno</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="open_in_new" color="grey-4" size="18px" />
          </q-item-section>
        </q-item>
        <q-separator inset="72px" />
        <q-item
          clickable
          v-ripple
          class="settings-item"
          @click="openForm('https://docs.google.com/forms/d/e/1FAIpQLSeEEBGyEX24c8uDPUj3MQniH87oMEtY54iSU322tbIyWH6p6A/viewform','Solicitud de días')"
        >
          <q-item-section avatar>
            <div class="settings-icon-wrap bg-orange">
              <q-icon name="event" color="white" size="20px" />
            </div>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-medium">Solicitud de días</q-item-label>
            <q-item-label caption>Gestión de días/permisos</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="open_in_new" color="grey-4" size="18px" />
          </q-item-section>
        </q-item>
      </div>
    </div>

    <!-- form view -->
    <div v-else>
      <q-toolbar class="bg-primary text-white">
        <q-btn flat dense round icon="arrow_back" @click="closeForm" />
        <q-toolbar-title class="text-weight-bold">{{ currentTitle }}</q-toolbar-title>
      </q-toolbar>

      <div class="q-mt-md">
        <div v-if="iframeBlocked" class="row items-center q-pa-md">
          <div class="col-12">
            <q-banner dense class="bg-yellow-3 text-black">
              No fue posible cargar este recurso dentro de la aplicación por la política de seguridad del sitio.
            </q-banner>
            <div class="q-mt-md">
              <q-btn color="primary" label="Abrir en nueva pestaña" unelevated @click="openExternal(currentUrl)" />
              <q-btn flat label="Volver" class="q-ml-sm" @click="closeForm" />
            </div>
          </div>
        </div>
        <div v-else>
          <iframe ref="formFrame" :src="currentUrl" @load="onIFrameLoad" class="form-iframe"></iframe>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'FormsPage',
  setup() {
    const router = useRouter();

    const goToReportePantallas = () => {
      router.push('/reporte-pantallas');
    };

    const resolvedGoogleForms = {
      'https://forms.gle/1fZvWG1wdY3QB6qz5': 'https://docs.google.com/forms/d/e/1FAIpQLSctsgdYAKlqLbAcbb_jkJpL8FHgMOUYnvo2YVbu7LZG_cNgAQ/viewform',
      'https://forms.gle/QsG9uCh7AtxXet848': 'https://docs.google.com/forms/d/e/1FAIpQLSdGtxFReFg-fgkZ0ixlSsmUVBciwkCfgb0tqNNTNE-EBniX8A/viewform',
      'https://forms.gle/F6ijWiKPJJHgJrVU8': 'https://docs.google.com/forms/d/e/1FAIpQLScB6x6ckXbPeqtFOm8VUpllzcuIL7OFstdI3rCChJ7wX1wVNA/viewform',
      'https://forms.gle/iKGjL6LeGVgp4vyBA': 'https://docs.google.com/forms/d/e/1FAIpQLSeEEBGyEX24c8uDPUj3MQniH87oMEtY54iSU322tbIyWH6p6A/viewform',
    };

    const currentUrl = ref(null);
    const currentTitle = ref('');
    const loadingIframe = ref(false);
    const iframeBlocked = ref(false);
    let iframeTimeout = null;

    const normalizeEmbeddableUrl = (rawUrl) => {
      const mappedUrl = resolvedGoogleForms[rawUrl] || rawUrl;

      try {
        const parsedUrl = new URL(mappedUrl);
        const isGoogleFormView = parsedUrl.hostname === 'docs.google.com' &&
          parsedUrl.pathname.includes('/forms/d/e/') &&
          parsedUrl.pathname.endsWith('/viewform');

        if (isGoogleFormView) {
          parsedUrl.searchParams.delete('usp');
          parsedUrl.searchParams.set('embedded', 'true');
          return parsedUrl.toString();
        }
      } catch (error) {
        return mappedUrl;
      }

      return mappedUrl;
    };

    const openForm = (url, title = '') => {
      // try to load in iframe first
      currentUrl.value = normalizeEmbeddableUrl(url);
      currentTitle.value = title || '';
      loadingIframe.value = true;
      iframeBlocked.value = false;

      clearTimeout(iframeTimeout);
      iframeTimeout = setTimeout(() => {
        if (loadingIframe.value) {
          iframeBlocked.value = true;
          loadingIframe.value = false;
        }
      }, 6000);
    };

    const openExternal = (url) => {
      window.open(url, '_blank');
    };

    const closeForm = () => {
      currentUrl.value = null;
      currentTitle.value = '';
      loadingIframe.value = false;
      iframeBlocked.value = false;
      clearTimeout(iframeTimeout);
    };

    const onIFrameLoad = (event) => {
      loadingIframe.value = false;
      clearTimeout(iframeTimeout);

      try {
        const href = event.target.contentWindow.location.href;
        if (!href || href === 'about:blank') {
          // Likely blocked by CSP
          iframeBlocked.value = true;
        } else {
          iframeBlocked.value = false;
        }
      } catch (err) {
        // Accessing contentWindow.location may throw for cross-origin but that means iframe loaded fine
        iframeBlocked.value = false;
      }
    };

    return {
      currentUrl,
      currentTitle,
      loadingIframe,
      iframeBlocked,
      openForm,
      closeForm,
      openExternal,
      onIFrameLoad,
      goToReportePantallas,
    };
  },
});
</script>

<style scoped>
.forms-page {
  max-width: 600px;
  margin: 0 auto;
}

.forms-header {
  padding-top: 8px;
}

.settings-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.settings-item {
  padding: 12px 16px;
  min-height: 64px;
}

.settings-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.form-iframe {
  width: 100%;
  height: 80vh;
  border: 0;
}

/* Dark mode tweaks */
.body--dark .settings-card {
  background: #1e1e1e;
  border-color: rgba(255, 255, 255, 0.06);
}
</style>

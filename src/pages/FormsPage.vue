<template>
  <q-page padding>
    <div v-if="!currentUrl">
      <div class="row items-center q-gutter-md">
        <div class="col-12">
          <h6>Forms</h6>
          <p>Lista de formularios disponibles.</p>
        </div>

        <div class="col-12">
          <q-list bordered separator>
            <q-item clickable @click="openForm('https://docs.google.com/forms/d/e/1FAIpQLSctsgdYAKlqLbAcbb_jkJpL8FHgMOUYnvo2YVbu7LZG_cNgAQ/viewform','Ingreso a casitas')">
              <q-item-section avatar>
                <q-icon name="assignment" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Ingreso a casitas</q-item-label>
                <q-item-label caption>Formulario de ingreso</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="open_in_new" />
              </q-item-section>
            </q-item>
            <q-item clickable @click="openForm('https://docs.google.com/forms/d/e/1FAIpQLSdGtxFReFg-fgkZ0ixlSsmUVBciwkCfgb0tqNNTNE-EBniX8A/viewform','Bitacora Puesto 09')">
              <q-item-section avatar>
                <q-icon name="book" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Bitacora Puesto 09</q-item-label>
                <q-item-label caption>Registro diario - Puesto 09</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="open_in_new" />
              </q-item-section>
            </q-item>

            <q-item clickable @click="openForm('https://docs.google.com/forms/d/e/1FAIpQLScB6x6ckXbPeqtFOm8VUpllzcuIL7OFstdI3rCChJ7wX1wVNA/viewform','Reporte turno puesto 09')">
              <q-item-section avatar>
                <q-icon name="report" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Reporte turno puesto 09</q-item-label>
                <q-item-label caption>Reporte de turno</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="open_in_new" />
              </q-item-section>
            </q-item>

            <q-item clickable @click="openForm('https://docs.google.com/forms/d/e/1FAIpQLSeEEBGyEX24c8uDPUj3MQniH87oMEtY54iSU322tbIyWH6p6A/viewform','Solicitud de días')">
              <q-item-section avatar>
                <q-icon name="event" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Solicitud de días</q-item-label>
                <q-item-label caption>Gestión de días/permisos</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="open_in_new" />
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>
    </div>

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
            <iframe ref="formFrame" :src="currentUrl" @load="onIFrameLoad" style="width:100%;height:80vh;border:0"></iframe>
          </div>
        </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'FormsPage',
  setup() {
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
    };
  },
});
</script>

<style scoped>
h6 {
  margin: 0 0 8px 0;
}
</style>

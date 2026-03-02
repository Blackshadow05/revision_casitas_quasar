<template>
  <q-page class="cf-list-page q-pa-md">
    <!-- Header -->
    <div class="cf-header q-mb-lg">
      <div class="text-h4 text-weight-bold">Caja Fuerte</div>
      <div class="text-caption text-grey-6 q-mt-xs">Selecciona una casita para ver sus movimientos</div>
    </div>

    <!-- Search bar -->
    <q-input
      v-model="searchTerm"
      rounded
      outlined
      dense
      placeholder="Buscar casita..."
      class="q-mb-md"
      bg-color="white"
    >
      <template v-slot:prepend>
        <q-icon name="search" color="grey-5" />
      </template>
      <template v-slot:append>
        <q-icon
          v-if="searchTerm"
          name="clear"
          class="cursor-pointer"
          color="grey-5"
          @click="searchTerm = ''"
        />
      </template>
    </q-input>

    <!-- All movements highlight card -->
    <div class="all-movements-card q-mb-md" @click="goToAllMovimientos">
      <div class="all-movements-inner">
        <div class="all-icon-wrap">
          <q-icon name="format_list_bulleted" color="white" size="22px" />
        </div>
        <div class="col">
          <div class="text-weight-bold text-white" style="font-size: 15px;">Todos los movimientos</div>
          <div class="text-caption" style="color: rgba(255,255,255,0.75);">Ver historial completo</div>
        </div>
        <q-icon name="chevron_right" color="white" size="20px" style="opacity: 0.8" />
      </div>
    </div>

    <!-- List of casitas -->
    <div class="settings-card">
      <template v-for="n in filteredList" :key="n">
        <q-item
          clickable
          v-ripple
          class="cf-list-item"
          @click="goToCajaFuerteDetail(n)"
        >
          <q-item-section avatar>
            <div class="casita-num-wrap">
              <span class="casita-num-text">{{ n }}</span>
            </div>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-medium">Casita {{ n }}</q-item-label>
            <q-item-label caption>Caja fuerte · movimientos</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" color="grey-4" size="18px" />
          </q-item-section>
        </q-item>
        <q-separator v-if="n !== filteredList[filteredList.length - 1]" inset="72px" />
      </template>

      <!-- Empty search result -->
      <div v-if="filteredList.length === 0" class="text-center q-pa-xl text-grey-5">
        <q-icon name="search_off" size="40px" />
        <div class="q-mt-sm text-body2">Sin resultados para "{{ searchTerm }}"</div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed } from "vue";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "CajaFuerteListPage",
  setup() {
    const router = useRouter();
    const searchTerm = ref("");

    const filteredList = computed(() => {
      const all = Array.from({ length: 50 }, (_, i) => i + 1);
      if (!searchTerm.value) return all;
      return all.filter((n) => String(n).includes(searchTerm.value.trim()));
    });

    const goToCajaFuerteDetail = (numero) => {
      router.push(`/caja-fuerte/${numero}`);
    };

    const goToAllMovimientos = () => {
      router.push("/caja-fuerte/todos");
    };

    return {
      searchTerm,
      filteredList,
      goToCajaFuerteDetail,
      goToAllMovimientos,
    };
  },
});
</script>

<style scoped>
.cf-list-page {
  max-width: 600px;
  margin: 0 auto;
}

.cf-header {
  padding-top: 8px;
}

.all-movements-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.35);
}

.all-movements-card:active {
  transform: scale(0.98);
}

.all-movements-inner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
}

.all-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.settings-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.cf-list-item {
  padding: 10px 16px;
  min-height: 60px;
}

.casita-num-wrap {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.casita-num-text {
  font-size: 13px;
  font-weight: 700;
  color: #555;
}

.body--dark .settings-card {
  background: #1e1e1e;
  border-color: rgba(255, 255, 255, 0.06);
}

.body--dark .casita-num-wrap {
  background: #2a2a2a;
}

.body--dark .casita-num-text {
  color: #aaa;
}
</style>

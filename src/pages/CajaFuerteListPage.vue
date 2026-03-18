<template>
  <q-page class="cf-list-page q-pa-md">
    <div class="cf-header q-mb-lg">
      <div class="cf-header-badge">
        <q-icon name="lock" size="16px" />
        Caja fuerte
      </div>
      <div class="cf-header-main q-mt-sm">
        <div>
          <div class="text-h4 text-weight-bold">Selecciona una casita</div>
          <div class="text-caption text-grey-6 q-mt-xs">
            Accede al historial con menos scroll y cambia de grupo en un toque.
          </div>
        </div>
        <div class="mobile-summary-pill mobile-only">
          {{ filteredList.length }}
        </div>
      </div>
    </div>

    <div class="row q-gutter-md q-mb-md desktop-only">
      <q-card class="col stats-card">
        <q-card-section class="text-center">
          <div class="text-h4 text-weight-bold text-primary">{{ totalCasitas }}</div>
          <div class="text-caption text-grey-6">Total Casitas</div>
        </q-card-section>
      </q-card>
      <q-card class="col stats-card">
        <q-card-section class="text-center">
          <div class="text-h4 text-weight-bold text-secondary">{{ grupos.length }}</div>
          <div class="text-caption text-grey-6">Grupos</div>
        </q-card-section>
      </q-card>
      <q-card class="col stats-card">
        <q-card-section class="text-center">
          <div class="text-h4 text-weight-bold text-accent">{{ filteredList.length }}</div>
          <div class="text-caption text-grey-6">Mostrando</div>
        </q-card-section>
      </q-card>
    </div>

    <div class="search-panel q-mb-md">
      <div class="row items-center q-col-gutter-sm">
        <div class="col">
          <q-input
            v-model="searchTerm"
            rounded
            outlined
            dense
            placeholder="Buscar casita..."
            class="search-input"
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
        </div>
        <div class="col-auto mobile-only">
          <q-btn
            v-if="hasActiveFilters"
            flat
            round
            dense
            icon="restart_alt"
            color="primary"
            @click="resetFilters"
          />
        </div>
      </div>

      <div class="search-panel-footer q-mt-sm">
        <div class="text-caption text-grey-6">{{ filterSummary }}</div>
        <q-btn
          v-if="hasActiveFilters"
          flat
          dense
          no-caps
          color="primary"
          label="Limpiar"
          class="desktop-only"
          @click="resetFilters"
        />
      </div>

      <div class="mobile-chip-row mobile-only q-mt-sm">
        <q-chip
          v-for="option in mobileGroupOptions"
          :key="String(option.value)"
          clickable
          :class="['group-chip', { 'group-chip--active': selectedGroup === option.value }]"
          @click="toggleGroup(option.value)"
        >
          {{ option.label }}
        </q-chip>
      </div>

      <q-select
        v-model="selectedGroup"
        :options="groupOptions"
        label="Filtrar por grupo"
        outlined
        dense
        class="desktop-only q-mt-md"
        emit-value
        map-options
      />
    </div>

    <div class="all-movements-card q-mb-md" @click="goToAllMovimientos">
      <div class="all-movements-inner">
        <div class="all-icon-wrap">
          <q-icon name="format_list_bulleted" color="white" size="22px" />
        </div>
        <div class="col">
          <div class="text-weight-bold text-white all-movements-title">Todos los movimientos</div>
          <div class="text-caption all-movements-caption">Ver el historial completo en una sola vista</div>
        </div>
        <q-icon name="chevron_right" color="white" size="20px" style="opacity: 0.8" />
      </div>
    </div>

    <div class="mobile-results-strip mobile-only q-mb-md">
      <div>
        <div class="text-subtitle2 text-weight-bold">Casitas disponibles</div>
        <div class="text-caption text-grey-6">Toca una tarjeta para abrir su historial.</div>
      </div>
      <div class="results-badge">{{ filteredList.length }}</div>
    </div>

    <div v-if="filteredList.length > 0" class="mobile-casitas-grid mobile-only">
      <q-card
        v-for="n in filteredList"
        :key="n"
        class="mobile-casita-card"
        clickable
        @click="goToCajaFuerteDetail(n)"
      >
        <q-card-section class="mobile-casita-card-section">
          <div class="mobile-casita-card-top">
            <div class="mobile-casita-number">{{ n }}</div>
            <q-icon name="north_east" size="18px" color="primary" />
          </div>
          <div class="text-weight-bold q-mt-md">Casita {{ n }}</div>
          <div class="text-caption text-grey-6 q-mt-xs">Ver movimientos</div>
        </q-card-section>
      </q-card>
    </div>

    <div v-else class="mobile-empty-state mobile-only">
      <q-icon name="search_off" size="40px" color="grey-5" />
      <div class="q-mt-sm text-body1 text-weight-medium">No encontramos casitas</div>
      <div class="q-mt-xs text-body2 text-grey-6">Prueba con otro grupo o limpia la búsqueda.</div>
      <q-btn
        v-if="hasActiveFilters"
        flat
        rounded
        no-caps
        color="primary"
        label="Limpiar filtros"
        class="q-mt-sm"
        @click="resetFilters"
      />
    </div>

    <div class="desktop-only">
      <template v-for="grupo in gruposFiltrados" :key="grupo.nombre">
        <div class="grupo-section q-mb-lg">
          <div class="grupo-header q-mb-md">
            <q-icon name="folder" color="primary" size="20px" class="q-mr-sm" />
            <span class="text-h6 text-weight-medium">{{ grupo.nombre }}</span>
            <q-chip size="sm" color="primary" text-color="white" class="q-ml-sm">
              {{ grupo.casitas.length }} casitas
            </q-chip>
          </div>
          <div class="row q-gutter-md">
            <q-card
              v-for="n in grupo.casitas"
              :key="n"
              class="casita-card col-auto"
              clickable
              @click="goToCajaFuerteDetail(n)"
            >
              <q-card-section class="text-center">
                <div class="casita-num-wrap-lg q-mb-sm">
                  <span class="casita-num-text-lg">{{ n }}</span>
                </div>
                <div class="text-weight-medium">Casita {{ n }}</div>
                <div class="text-caption text-grey-6">Caja fuerte</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </template>

      <div v-if="gruposFiltrados.length === 0" class="text-center q-pa-xl text-grey-5">
        <q-icon name="search_off" size="40px" />
        <div class="q-mt-sm text-body2">Sin resultados para "{{ searchTerm }}"</div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { computed, defineComponent, ref } from "vue";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "CajaFuerteListPage",
  setup() {
    const router = useRouter();
    const searchTerm = ref("");
    const selectedGroup = ref(null);

    const totalCasitas = 50;
    const allCasitas = Array.from({ length: totalCasitas }, (_, index) => index + 1);
    const grupos = [
      { nombre: "Casitas 1-10", inicio: 1, fin: 10, corto: "1-10" },
      { nombre: "Casitas 11-20", inicio: 11, fin: 20, corto: "11-20" },
      { nombre: "Casitas 21-30", inicio: 21, fin: 30, corto: "21-30" },
      { nombre: "Casitas 31-40", inicio: 31, fin: 40, corto: "31-40" },
      { nombre: "Casitas 41-50", inicio: 41, fin: 50, corto: "41-50" },
    ];

    const groupOptions = [
      { label: "Todos los grupos", value: null },
      ...grupos.map((grupo) => ({ label: grupo.nombre, value: grupo.nombre })),
    ];

    const mobileGroupOptions = [
      { label: "Todas", value: null },
      ...grupos.map((grupo) => ({ label: grupo.corto, value: grupo.nombre })),
    ];

    const activeGroup = computed(
      () => grupos.find((grupo) => grupo.nombre === selectedGroup.value) || null
    );

    const hasSearchTerm = computed(() => Boolean(searchTerm.value.trim()));
    const hasActiveFilters = computed(
      () => hasSearchTerm.value || selectedGroup.value !== null
    );

    const filteredList = computed(() => {
      let casitas = [...allCasitas];

      if (activeGroup.value) {
        casitas = casitas.filter(
          (numero) => numero >= activeGroup.value.inicio && numero <= activeGroup.value.fin
        );
      }

      if (hasSearchTerm.value) {
        const term = searchTerm.value.trim();
        casitas = casitas.filter((numero) => String(numero).includes(term));
      }

      return casitas;
    });

    const gruposFiltrados = computed(() => {
      return grupos
        .filter((grupo) => !selectedGroup.value || grupo.nombre === selectedGroup.value)
        .map((grupo) => {
          let casitas = Array.from(
            { length: grupo.fin - grupo.inicio + 1 },
            (_, index) => grupo.inicio + index
          );

          if (hasSearchTerm.value) {
            const term = searchTerm.value.trim();
            casitas = casitas.filter((numero) => String(numero).includes(term));
          }

          return {
            ...grupo,
            casitas,
          };
        })
        .filter((grupo) => grupo.casitas.length > 0);
    });

    const filterSummary = computed(() => {
      if (!hasActiveFilters.value) {
        return `${totalCasitas} casitas disponibles para consultar.`;
      }

      const segments = [`${filteredList.value.length} resultados`];

      if (activeGroup.value) {
        segments.push(activeGroup.value.nombre);
      }

      if (hasSearchTerm.value) {
        segments.push(`búsqueda: ${searchTerm.value.trim()}`);
      }

      return segments.join(" · ");
    });

    const resetFilters = () => {
      searchTerm.value = "";
      selectedGroup.value = null;
    };

    const toggleGroup = (value) => {
      selectedGroup.value = selectedGroup.value === value ? null : value;
    };

    const goToCajaFuerteDetail = (numero) => {
      router.push(`/caja-fuerte/${numero}`);
    };

    const goToAllMovimientos = () => {
      router.push("/caja-fuerte/todos");
    };

    return {
      filterSummary,
      filteredList,
      goToAllMovimientos,
      goToCajaFuerteDetail,
      groupOptions,
      grupos,
      gruposFiltrados,
      hasActiveFilters,
      mobileGroupOptions,
      resetFilters,
      searchTerm,
      selectedGroup,
      toggleGroup,
      totalCasitas,
    };
  },
});
</script>

<style scoped>
.mobile-only {
  display: block;
}

.desktop-only {
  display: none;
}

.cf-list-page {
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 24px;
}

.cf-header {
  padding-top: 8px;
}

.cf-header-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(102, 126, 234, 0.12);
  color: #4c51bf;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.cf-header-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.mobile-summary-pill {
  min-width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  box-shadow: 0 12px 24px rgba(102, 126, 234, 0.26);
  flex-shrink: 0;
}

.search-panel {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 18px;
  padding: 14px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.search-input :deep(.q-field__control) {
  border-radius: 14px;
}

.search-panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.mobile-chip-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin: 0 -2px;
}

.mobile-chip-row::-webkit-scrollbar {
  display: none;
}

.group-chip {
  flex-shrink: 0;
  background: #f3f4f6;
  color: #475467;
  border: 1px solid transparent;
  font-weight: 600;
}

.group-chip--active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.group-chip--active :deep(.q-chip__content) {
  color: white;
}

.all-movements-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 18px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 8px 22px rgba(102, 126, 234, 0.32);
}

.all-movements-card:active {
  transform: scale(0.985);
}

.all-movements-inner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
}

.all-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.all-movements-title {
  font-size: 15px;
}

.all-movements-caption {
  color: rgba(255, 255, 255, 0.75);
}

.mobile-results-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.results-badge {
  min-width: 44px;
  height: 44px;
  border-radius: 14px;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: #344054;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
}

.mobile-casitas-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.mobile-casita-card {
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.mobile-casita-card:active {
  transform: scale(0.98);
}

.mobile-casita-card-section {
  padding: 14px;
}

.mobile-casita-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.mobile-casita-number {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  box-shadow: 0 10px 22px rgba(102, 126, 234, 0.28);
}

.mobile-empty-state {
  background: white;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
  padding: 32px 20px;
  text-align: center;
}

@media (min-width: 480px) and (max-width: 1023px) {
  .mobile-casitas-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .mobile-only {
    display: none !important;
  }

  .desktop-only {
    display: block !important;
  }

  .cf-list-page {
    max-width: 1200px;
  }

  .search-panel {
    padding: 16px 18px;
  }

  .stats-card {
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .stats-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  }

  .grupo-section {
    background: white;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  .grupo-header {
    display: flex;
    align-items: center;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
  }

  .casita-card {
    width: 140px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    cursor: pointer;
  }

  .casita-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  .casita-num-wrap-lg {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  }

  .casita-num-text-lg {
    font-size: 20px;
    font-weight: 700;
    color: white;
  }
}

.body--dark .search-panel,
.body--dark .results-badge,
.body--dark .mobile-casita-card,
.body--dark .mobile-empty-state,
.body--dark .grupo-section {
  background: #1e1e1e;
  border-color: rgba(255, 255, 255, 0.06);
}

.body--dark .group-chip {
  background: #2a2a2a;
  color: #d0d5dd;
}

.body--dark .group-chip--active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.body--dark .results-badge {
  color: #f3f4f6;
}

.body--dark .grupo-header {
  border-bottom-color: #333;
}

.body--dark .casita-card {
  background: #2a2a2a;
  border-color: rgba(255, 255, 255, 0.06);
}
</style>

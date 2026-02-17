<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Caja Fuerte</div>
    <div class="text-subtitle1 q-mb-md">Seleccione una caja fuerte:</div>

    <q-list bordered separator class="rounded-borders">
      <q-item
        clickable
        v-ripple
        @click="goToAllMovimientos"
      >
        <q-item-section avatar>
          <q-icon name="list" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-bold">Todos los movimientos</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" color="grey" />
        </q-item-section>
      </q-item>
      <q-item
        v-for="n in 50"
        :key="n"
        clickable
        v-ripple
        @click="goToCajaFuerteDetail(n)"
      >
        <q-item-section avatar>
          <q-icon name="lock" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Caja fuerte casita {{ n }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" color="grey" />
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "CajaFuerteListPage",
  setup() {
    const router = useRouter();

    const goToCajaFuerteDetail = (numero) => {
      router.push(`/caja-fuerte/${numero}`);
    };

    const goToAllMovimientos = () => {
      router.push("/caja-fuerte/todos");
    };

    return {
      goToCajaFuerteDetail,
      goToAllMovimientos,
    };
  },
});
</script>

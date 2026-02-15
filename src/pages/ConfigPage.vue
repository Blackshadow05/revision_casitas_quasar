<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Configuración</div>

    <q-list bordered separator class="rounded-borders">
      <q-item clickable v-ripple @click="goToAdminUsers">
        <q-item-section avatar>
          <q-icon name="people" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Administrar Usuarios</q-item-label>
          <q-item-label caption>Gestionar usuarios del sistema</q-item-label>
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
  name: "ConfigPage",
  setup() {
    const router = useRouter();

    const goToAdminUsers = () => {
      router.push("/admin-users");
    };

    return {
      goToAdminUsers,
    };
  },
});
</script>

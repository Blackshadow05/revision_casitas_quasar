<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <q-btn flat round icon="arrow_back" @click="goBack" />
      <div class="text-h5 q-ml-sm">Administrar Usuarios</div>
    </div>

    <!-- Sección para cambiar mi propia contraseña (todos los usuarios) -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1">Mi Cuenta</div>
        <div class="text-caption">Cambiar mi propia contraseña</div>
      </q-card-section>
      <q-card-section>
        <div class="row items-center">
          <div class="col">
            <span class="text-weight-bold">{{ currentUser?.Usuario }}</span>
            <q-chip size="sm" color="primary" text-color="white" class="q-ml-sm">
              {{ currentUser?.Rol }}
            </q-chip>
          </div>
          <q-btn
            color="primary"
            icon="lock"
            label="Cambiar mi contraseña"
            @click="openMyPasswordDialog"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Botón para agregar nuevo usuario (solo SuperAdmin) -->
    <q-btn
      v-if="isSuperAdmin"
      color="primary"
      icon="add"
      label="Nuevo Usuario"
      class="full-width q-mb-md"
      @click="showAddDialog = true"
    />

    <!-- Lista de usuarios -->
    <q-list bordered separator class="rounded-borders">
      <q-item v-for="user in users" :key="user.id">
        <q-item-section avatar>
          <q-avatar color="primary" text-color="white">
            {{ user.Usuario.charAt(0).toUpperCase() }}
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ user.Usuario }}</q-item-label>
          <q-item-label caption>{{ user.Rol || 'Sin rol' }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="row q-gutter-xs">
            <!-- Si es SuperAdmin puede editar cualquier usuario -->
            <template v-if="isSuperAdmin">
              <q-btn
                flat
                round
                dense
                icon="edit"
                color="primary"
                @click="openEditDialog(user)"
              >
                <q-tooltip>Cambiar contraseña</q-tooltip>
              </q-btn>
              <!-- Solo Esteban B puede eliminar -->
              <q-btn
                v-if="canDeleteUsers"
                flat
                round
                dense
                icon="delete"
                color="negative"
                @click="confirmDelete(user)"
              >
                <q-tooltip>Eliminar usuario</q-tooltip>
              </q-btn>
            </template>
            <!-- Si no es SuperAdmin, solo puede ver el botón de editar su propia contraseña -->
            <template v-else-if="user.id === currentUser?.id">
              <q-btn
                flat
                round
                dense
                icon="edit"
                color="primary"
                @click="openEditDialog(user)"
              >
                <q-tooltip>Cambiar mi contraseña</q-tooltip>
              </q-btn>
            </template>
          </div>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Diálogo para agregar nuevo usuario -->
    <q-dialog v-model="showAddDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Nuevo Usuario</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="newUser.Usuario"
            label="Nombre de usuario"
            filled
            class="q-mb-md"
          />
          <q-input
            v-model="newUser.password_hash"
            label="Contraseña"
            :type="showPassword ? 'text' : 'password'"
            filled
            class="q-mb-md"
          >
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility' : 'visibility_off'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>
          <q-select
            v-model="newUser.Rol"
            :options="rolOptions"
            label="Rol"
            filled
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            color="primary"
            label="Agregar"
            @click="addUser"
            :loading="loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Diálogo para editar contraseña -->
    <q-dialog v-model="showEditDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">
            {{ isEditingSelf ? 'Cambiar Mi Contraseña' : 'Cambiar Contraseña' }}
          </div>
          <div class="text-caption">Usuario: {{ editingUser?.Usuario }}</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="editingUser.password_hash"
            label="Nueva contraseña"
            :type="showPassword ? 'text' : 'password'"
            filled
          >
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility' : 'visibility_off'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            color="primary"
            label="Guardar"
            @click="updatePassword"
            :loading="loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Diálogo de confirmación para eliminar -->
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Eliminar Usuario</div>
        </q-card-section>
        <q-card-section>
          ¿Está seguro que desea eliminar al usuario "{{ userToDelete?.Usuario }}"?
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            color="negative"
            label="Eliminar"
            @click="deleteUser"
            :loading="loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../supabase";
import { useQuasar } from "quasar";
import { useAuthStore } from "../stores/auth";

export default defineComponent({
  name: "AdminUsersPage",
  setup() {
    const router = useRouter();
    const $q = useQuasar();
    const authStore = useAuthStore();

    const users = ref([]);
    const loading = ref(false);
    const showAddDialog = ref(false);
    const showEditDialog = ref(false);
    const showDeleteDialog = ref(false);
    const showPassword = ref(false);

    const newUser = ref({
      Usuario: "",
      password_hash: "",
      Rol: null,
    });

    const editingUser = ref(null);
    const userToDelete = ref(null);

    const rolOptions = ["Admin", "Usuario", "Revisor", "SuperAdmin"];

    // Obtener el usuario actual del store
    const currentUser = computed(() => authStore.user);

    // Verificar si el usuario actual es SuperAdmin
    const isSuperAdmin = computed(() => {
      return currentUser.value?.Rol === "SuperAdmin";
    });

    // Verificar si es el usuario Esteban B (puede eliminar usuarios)
    const canDeleteUsers = computed(() => {
      return currentUser.value?.Usuario === "Esteban B";
    });

    // Verificar si está editando su propia contraseña
    const isEditingSelf = computed(() => {
      return editingUser.value && editingUser.value.id === currentUser.value?.id;
    });

    const loadUsers = async () => {
      loading.value = true;
      try {
        const { data, error } = await supabase
          .from("Usuarios")
          .select("*")
          .order("Usuario", { ascending: true });

        if (error) throw error;
        users.value = data || [];
      } catch (error) {
        console.error("Error loading users:", error);
        $q.notify({
          color: "negative",
          message: "Error al cargar usuarios",
        });
      } finally {
        loading.value = false;
      }
    };

    const addUser = async () => {
      if (!newUser.value.Usuario || !newUser.value.password_hash) {
        $q.notify({
          color: "warning",
          message: "El nombre de usuario y contraseña son obligatorios",
        });
        return;
      }

      loading.value = true;
      try {
        const { error } = await supabase.from("Usuarios").insert({
          Usuario: newUser.value.Usuario,
          password_hash: newUser.value.password_hash,
          Rol: newUser.value.Rol,
        });

        if (error) throw error;

        $q.notify({
          color: "positive",
          message: "Usuario agregado correctamente",
        });

        showAddDialog.value = false;
        newUser.value = { Usuario: "", password_hash: "", Rol: null };
        loadUsers();
      } catch (error) {
        console.error("Error adding user:", error);
        $q.notify({
          color: "negative",
          message: "Error al agregar usuario: " + error.message,
        });
      } finally {
        loading.value = false;
      }
    };

    const openEditDialog = (user) => {
      editingUser.value = { ...user };
      showEditDialog.value = true;
    };

    // Abrir diálogo para cambiar mi propia contraseña
    const openMyPasswordDialog = () => {
      if (currentUser.value) {
        editingUser.value = { ...currentUser.value };
        showEditDialog.value = true;
      }
    };

    const updatePassword = async () => {
      if (!editingUser.value.password_hash) {
        $q.notify({
          color: "warning",
          message: "La contraseña no puede estar vacía",
        });
        return;
      }

      loading.value = true;
      try {
        const { error } = await supabase
          .from("Usuarios")
          .update({ password_hash: editingUser.value.password_hash })
          .eq("id", editingUser.value.id);

        if (error) throw error;

        $q.notify({
          color: "positive",
          message: "Contraseña actualizada correctamente",
        });

        showEditDialog.value = false;
        editingUser.value = null;
        loadUsers();
      } catch (error) {
        console.error("Error updating password:", error);
        $q.notify({
          color: "negative",
          message: "Error al actualizar contraseña",
        });
      } finally {
        loading.value = false;
      }
    };

    const confirmDelete = (user) => {
      userToDelete.value = user;
      showDeleteDialog.value = true;
    };

    const deleteUser = async () => {
      loading.value = true;
      try {
        const { error } = await supabase
          .from("Usuarios")
          .delete()
          .eq("id", userToDelete.value.id);

        if (error) throw error;

        $q.notify({
          color: "positive",
          message: "Usuario eliminado correctamente",
        });

        showDeleteDialog.value = false;
        userToDelete.value = null;
        loadUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        $q.notify({
          color: "negative",
          message: "Error al eliminar usuario",
        });
      } finally {
        loading.value = false;
      }
    };

    const goBack = () => {
      router.back();
    };

    onMounted(() => {
      loadUsers();
    });

    return {
      users,
      loading,
      showAddDialog,
      showEditDialog,
      showDeleteDialog,
      showPassword,
      newUser,
      editingUser,
      userToDelete,
      rolOptions,
      currentUser,
      isSuperAdmin,
      canDeleteUsers,
      isEditingSelf,
      addUser,
      openEditDialog,
      openMyPasswordDialog,
      updatePassword,
      confirmDelete,
      deleteUser,
      goBack,
    };
  },
});
</script>

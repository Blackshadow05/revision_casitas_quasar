<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <q-btn flat round icon="arrow_back" @click="goBack" />
      <div class="text-h5 q-ml-sm">Administrar Usuarios</div>
    </div>

    <q-btn
      color="primary"
      icon="add"
      label="Nuevo Usuario"
      class="full-width q-mb-md desktop-btn"
      @click="openAddDialog"
    />

    <!-- Vista Móvil: Lista de usuarios -->
    <q-list bordered separator class="rounded-borders mobile-only">
      <q-item v-for="user in users" :key="user.id" class="q-py-md">
        <q-item-section avatar>
          <q-avatar color="primary" text-color="white">
            {{ user.Usuario.charAt(0).toUpperCase() }}
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ user.Usuario }}</q-item-label>
          <q-item-label caption>
            <q-chip
              :color="getRolColor(user.Rol)"
              text-color="white"
              size="sm"
              dense
              class="q-mt-xs"
            >
              {{ user.Rol || 'Sin rol' }}
            </q-chip>
          </q-item-label>
          <q-item-label caption class="q-mt-sm row items-center no-wrap">
            <q-icon name="lock" size="14px" class="q-mr-xs" />
            <span class="password-text">
              {{ isPasswordVisible(user.id) ? (user.password_hash || 'Sin contraseña') : '••••••••' }}
            </span>
            <q-btn
              flat
              round
              dense
              size="sm"
              :icon="isPasswordVisible(user.id) ? 'visibility_off' : 'visibility'"
              @click="togglePassword(user.id)"
            >
              <q-tooltip>{{ isPasswordVisible(user.id) ? 'Ocultar contraseña' : 'Ver contraseña' }}</q-tooltip>
            </q-btn>
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="row q-gutter-xs">
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="primary"
              @click="openEditDialog(user)"
            >
              <q-tooltip>Editar contraseña y rol</q-tooltip>
            </q-btn>
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
          </div>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Vista Desktop: Tabla de usuarios -->
    <q-card class="desktop-only">
      <q-table
        :rows="users"
        :columns="columns"
        row-key="id"
        flat
        bordered
        :pagination="{ rowsPerPage: 15 }"
        class="users-table"
      >
        <template v-slot:body-cell-avatar="props">
          <q-td :props="props">
            <q-avatar color="primary" text-color="white" size="md">
              {{ props.row.Usuario.charAt(0).toUpperCase() }}
            </q-avatar>
          </q-td>
        </template>

        <template v-slot:body-cell-rol="props">
          <q-td :props="props">
            <q-chip
              :color="getRolColor(props.row.Rol)"
              text-color="white"
              size="sm"
            >
              {{ props.row.Rol || 'Sin rol' }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-password="props">
          <q-td :props="props">
            <div class="row items-center no-wrap">
              <span class="password-text">
                {{ isPasswordVisible(props.row.id) ? (props.row.password_hash || 'Sin contraseña') : '••••••••' }}
              </span>
              <q-btn
                flat
                round
                dense
                size="sm"
                :icon="isPasswordVisible(props.row.id) ? 'visibility_off' : 'visibility'"
                @click="togglePassword(props.row.id)"
              >
                <q-tooltip>{{ isPasswordVisible(props.row.id) ? 'Ocultar contraseña' : 'Ver contraseña' }}</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <div class="row q-gutter-xs justify-center">
              <q-btn
                flat
                round
                dense
                icon="edit"
                color="primary"
                @click="openEditDialog(props.row)"
              >
                <q-tooltip>Editar contraseña y rol</q-tooltip>
              </q-btn>
              <q-btn
                v-if="canDeleteUsers"
                flat
                round
                dense
                icon="delete"
                color="negative"
                @click="confirmDelete(props.row)"
              >
                <q-tooltip>Eliminar usuario</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

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

    <!-- Diálogo para editar contraseña y rol -->
    <q-dialog v-model="showEditDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Editar usuario</div>
          <div class="text-caption">Usuario: {{ editingUser?.Usuario }}</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="editingUser.password_hash"
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
            v-model="editingUser.Rol"
            :options="rolOptions"
            label="Rol"
            filled
            class="q-mb-md"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            color="primary"
            label="Guardar"
            @click="updateUser"
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
import { notify } from '../utils/notify'
import { useRouter } from "vue-router";
import { supabase } from "../supabase";
import { useAuthStore } from "../stores/auth";

export default defineComponent({
  name: "AdminUsersPage",
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();

    const users = ref([]);
    const loading = ref(false);
    const showAddDialog = ref(false);
    const showEditDialog = ref(false);
    const showDeleteDialog = ref(false);
    const showPassword = ref(false);
    const visiblePasswords = ref({});

    const newUser = ref({
      Usuario: "",
      password_hash: "",
      Rol: "user",
    });

    const editingUser = ref(null);
    const userToDelete = ref(null);

    const rolOptions = ["SuperAdmin", "admin", "user", "inactivo"];

    const columns = [
      {
        name: "avatar",
        label: "",
        field: "Usuario",
        align: "center",
        style: "width: 60px",
      },
      {
        name: "usuario",
        label: "Usuario",
        field: "Usuario",
        align: "left",
        sortable: true,
      },
      {
        name: "rol",
        label: "Rol",
        field: "Rol",
        align: "center",
        sortable: true,
      },
      {
        name: "password",
        label: "Contraseña",
        field: "password_hash",
        align: "left",
      },
      {
        name: "actions",
        label: "Acciones",
        field: "actions",
        align: "center",
        style: "width: 120px",
      },
    ];

    const currentUser = computed(() => authStore.user);
    const canManageUsers = computed(() => authStore.canManageUsers);
    const canDeleteUsers = computed(() => currentUser.value?.Usuario === "Esteban B");

    const isPasswordVisible = (userId) => Boolean(visiblePasswords.value[userId]);

    const togglePassword = (userId) => {
      visiblePasswords.value = {
        ...visiblePasswords.value,
        [userId]: !visiblePasswords.value[userId],
      };
    };

    const loadUsers = async () => {
      loading.value = true;
      try {
        const { data, error } = await supabase
          .from("Usuarios")
          .select("id, Usuario, Rol, password_hash")
          .order("Usuario", { ascending: true });

        if (error) throw error;
        users.value = data || [];
      } catch (error) {
        console.error("Error loading users:", error);
        notify({
          color: "negative",
          message: "Error al cargar usuarios",
        });
      } finally {
        loading.value = false;
      }
    };

    const openAddDialog = () => {
      showPassword.value = false;
      newUser.value = { Usuario: "", password_hash: "", Rol: "user" };
      showAddDialog.value = true;
    };

    const addUser = async () => {
      if (!newUser.value.Usuario || !newUser.value.password_hash || !newUser.value.Rol) {
        notify({
          color: "warning",
          message: "El nombre de usuario, contraseña y rol son obligatorios",
        });
        return;
      }

      loading.value = true;
      try {
        const { error } = await supabase.from("Usuarios").insert({
          Usuario: newUser.value.Usuario.trim(),
          password_hash: newUser.value.password_hash,
          Rol: newUser.value.Rol,
        });

        if (error) throw error;

        notify({
          color: "positive",
          message: "Usuario agregado correctamente",
        });

        showAddDialog.value = false;
        newUser.value = { Usuario: "", password_hash: "", Rol: "user" };
        loadUsers();
      } catch (error) {
        console.error("Error adding user:", error);
        notify({
          color: "negative",
          message: "Error al agregar usuario: " + error.message,
        });
      } finally {
        loading.value = false;
      }
    };

    const openEditDialog = (user) => {
      editingUser.value = { ...user };
      showPassword.value = true;
      showEditDialog.value = true;
    };

    const updateUser = async () => {
      if (!editingUser.value.password_hash) {
        notify({
          color: "warning",
          message: "La contraseña no puede estar vacía",
        });
        return;
      }

      if (!editingUser.value.Rol) {
        notify({
          color: "warning",
          message: "Debe asignar un rol",
        });
        return;
      }

      loading.value = true;
      try {
        const { error } = await supabase
          .from("Usuarios")
          .update({
            password_hash: editingUser.value.password_hash,
            Rol: editingUser.value.Rol,
          })
          .eq("id", editingUser.value.id);

        if (error) throw error;

        notify({
          color: "positive",
          message: "Usuario actualizado correctamente",
        });

        showEditDialog.value = false;
        editingUser.value = null;
        loadUsers();
      } catch (error) {
        console.error("Error updating user:", error);
        notify({
          color: "negative",
          message: "Error al actualizar usuario: " + error.message,
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

        notify({
          color: "positive",
          message: "Usuario eliminado correctamente",
        });

        showDeleteDialog.value = false;
        userToDelete.value = null;
        loadUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        notify({
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

    const getRolColor = (rol) => {
      const colors = {
        SuperAdmin: "red",
        admin: "orange",
        user: "blue",
        inactivo: "grey",
      };
      return colors[rol] || "grey";
    };

    onMounted(() => {
      if (!canManageUsers.value) {
        notify({
          type: "negative",
          message: "No tienes permiso para acceder a esta sección.",
        });
        router.replace("/config");
        return;
      }

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
      columns,
      canDeleteUsers,
      isPasswordVisible,
      togglePassword,
      addUser,
      openAddDialog,
      openEditDialog,
      updateUser,
      confirmDelete,
      deleteUser,
      goBack,
      getRolColor,
    };
  },
});
</script>

<style scoped>
.password-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  letter-spacing: 0.04em;
}

.mobile-only {
  display: block;
}

.desktop-only {
  display: none;
}

@media (min-width: 1024px) {
  .mobile-only {
    display: none !important;
  }

  .desktop-only {
    display: block !important;
  }

  .q-page {
    max-width: 1000px;
    margin-left: auto;
    margin-right: auto;
    padding: 32px 40px !important;
  }

  .q-card {
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  .q-list.bordered {
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  .q-item {
    padding: 16px 20px;
  }

  .text-h5 {
    font-size: 1.75rem;
  }

  .desktop-btn {
    width: auto !important;
    max-width: 200px;
  }

  .users-table {
    border-radius: 16px;
    overflow: hidden;
  }

  .users-table .q-table__top {
    padding: 16px 20px;
  }

  .users-table .q-table__bottom {
    padding: 16px 20px;
  }
}
</style>

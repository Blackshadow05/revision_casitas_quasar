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
          <q-item-label caption class="q-mt-xs">
            <q-chip
              dense
              size="sm"
              :color="isGoogleLogin(user) ? 'blue-1' : 'grey-2'"
              :text-color="isGoogleLogin(user) ? 'blue-9' : 'grey-8'"
              :icon="isGoogleLogin(user) ? 'login' : 'lock'"
            >
              {{ loginMethodLabel(user) }}
            </q-chip>
          </q-item-label>
          <q-item-label v-if="isGoogleLogin(user)" caption class="q-mt-xs">
            {{ user.email || 'Sin correo de Google' }}
          </q-item-label>
          <q-item-label v-else caption class="q-mt-sm row items-center no-wrap">
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
          <q-item-label v-if="!isGoogleLogin(user)" caption class="q-mt-sm">
            <q-chip
              dense
              size="sm"
              :color="getAuthStatus(user).color"
              text-color="white"
            >
              {{ getAuthStatus(user).label }}
            </q-chip>
            <span v-if="user.email" class="q-ml-sm">{{ user.email }}</span>
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
              <q-tooltip>Editar acceso y rol</q-tooltip>
            </q-btn>
            <q-btn
              v-if="!isGoogleLogin(user)"
              flat
              round
              dense
              icon="security"
              color="teal"
              @click="openAuthDialog(user)"
            >
              <q-tooltip>Google Authenticator</q-tooltip>
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

        <template v-slot:body-cell-acceso="props">
          <q-td :props="props">
            <div>
              <q-chip
                dense
                size="sm"
                :color="isGoogleLogin(props.row) ? 'blue-1' : 'grey-2'"
                :text-color="isGoogleLogin(props.row) ? 'blue-9' : 'grey-8'"
              >
                {{ loginMethodLabel(props.row) }}
              </q-chip>
              <div v-if="isGoogleLogin(props.row)" class="text-caption text-grey-7">
                {{ props.row.email || 'Sin correo' }}
              </div>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-password="props">
          <q-td :props="props">
            <div class="row items-center no-wrap">
              <span class="password-text">
                {{ isGoogleLogin(props.row)
                  ? '—'
                  : (isPasswordVisible(props.row.id) ? (props.row.password_hash || 'Sin contraseña') : '••••••••') }}
              </span>
              <q-btn
                v-if="!isGoogleLogin(props.row)"
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

        <template v-slot:body-cell-auth="props">
          <q-td :props="props">
            <div v-if="isGoogleLogin(props.row)" class="text-caption text-grey-6">
              No aplica
            </div>
            <div v-else class="column">
              <q-chip dense size="sm" :color="getAuthStatus(props.row).color" text-color="white">
                {{ getAuthStatus(props.row).label }}
              </q-chip>
              <div v-if="props.row.email" class="text-caption text-grey-7 q-mt-xs">
                {{ props.row.email }}
              </div>
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
                <q-tooltip>Editar acceso y rol</q-tooltip>
              </q-btn>
              <q-btn
                v-if="!isGoogleLogin(props.row)"
                flat
                round
                dense
                icon="security"
                color="teal"
                @click="openAuthDialog(props.row)"
              >
                <q-tooltip>Google Authenticator</q-tooltip>
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
          <q-select
            v-model="newUser.metodo_login"
            :options="loginMethodOptions"
            label="Cómo inicia sesión"
            emit-value
            map-options
            filled
            class="q-mb-md"
          />
          <q-input
            v-if="newUser.metodo_login === 'google'"
            v-model="newUser.email"
            label="Correo de Google"
            type="email"
            filled
            class="q-mb-md"
            hint="El Gmail con el que va a entrar"
          />
          <q-input
            v-else
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

        <q-card-section v-if="editingUser">
          <q-select
            v-model="editingUser.metodo_login"
            :options="loginMethodOptions"
            label="Cómo inicia sesión"
            emit-value
            map-options
            filled
            class="q-mb-md"
          />
          <q-input
            v-if="editingUser.metodo_login === 'google'"
            v-model="editingUser.email"
            label="Correo de Google"
            type="email"
            filled
            class="q-mb-md"
            hint="El Gmail con el que va a entrar"
          />
          <q-input
            v-else
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

    <q-dialog v-model="showAuthDialog">
      <q-card style="min-width: 360px">
        <q-card-section>
          <div class="text-h6">Google Authenticator</div>
          <div class="text-caption">Usuario: {{ authForm.usuario }}</div>
        </q-card-section>

        <q-card-section>
          <q-banner v-if="authForm.totp_enrolled" rounded class="bg-teal-1 text-teal-10 q-mb-md">
            Esta cuenta ya tiene Authenticator activo. El login de usuario y contraseña queda bloqueado.
          </q-banner>
          <q-banner v-else-if="authForm.auth_user_id" rounded class="bg-orange-1 text-orange-10 q-mb-md">
            La cuenta de Auth está creada. Falta que la persona escanee el QR en su primer acceso.
          </q-banner>
          <q-banner v-else rounded class="bg-grey-2 text-grey-8 q-mb-md">
            Mientras no actives Authenticator, esta persona sigue usando el login actual.
          </q-banner>

          <q-input
            v-model="authForm.email"
            label="Correo"
            filled
            class="q-mb-md"
            type="email"
          />
          <q-input
            v-model="authForm.authPassword"
            label="Contraseña de Auth"
            filled
            class="q-mb-md"
            :type="showAuthPassword ? 'text' : 'password'"
            hint="Mínimo 6 caracteres. Es independiente de la contraseña actual."
          >
            <template v-slot:append>
              <q-icon
                :name="showAuthPassword ? 'visibility' : 'visibility_off'"
                class="cursor-pointer"
                @click="showAuthPassword = !showAuthPassword"
              />
            </template>
          </q-input>
          <q-input
            v-if="needsManagerPassword"
            v-model="authForm.managerPassword"
            label="Tu contraseña de administrador"
            filled
            :type="showManagerPassword ? 'text' : 'password'"
            hint="Confirma que eres tú para crear la cuenta en Auth"
          >
            <template v-slot:append>
              <q-icon
                :name="showManagerPassword ? 'visibility' : 'visibility_off'"
                class="cursor-pointer"
                @click="showManagerPassword = !showManagerPassword"
              />
            </template>
          </q-input>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cerrar" v-close-popup />
          <q-btn
            v-if="authForm.auth_user_id"
            flat
            color="orange"
            label="Resetear Authenticator"
            :loading="authLoading"
            @click="resetUserAuthenticator"
          />
          <q-btn
            color="teal"
            :label="authForm.auth_user_id ? 'Actualizar Auth' : 'Activar Authenticator'"
            :loading="authLoading"
            @click="inviteUserAuthenticator"
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
import { useAuthStore, LOGIN_METHODS, normalizeEmail } from "../stores/auth";
import { inviteAuthenticatorUser, resetAuthenticatorFactor } from "../services/manageAuthUser";

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
    const showAuthDialog = ref(false);
    const showPassword = ref(false);
    const showAuthPassword = ref(false);
    const showManagerPassword = ref(false);
    const authLoading = ref(false);
    const visiblePasswords = ref({});

    const newUser = ref({
      Usuario: "",
      password_hash: "",
      Rol: "user",
      metodo_login: LOGIN_METHODS.password,
      email: "",
    });

    const editingUser = ref(null);
    const userToDelete = ref(null);
    const authForm = ref({
      usuario: "",
      email: "",
      authPassword: "",
      managerPassword: "",
      auth_user_id: null,
      totp_enrolled: false,
    });

    const rolOptions = ["SuperAdmin", "admin", "user", "inactivo"];

    const loginMethodOptions = [
      { label: "Usuario y contraseña", value: LOGIN_METHODS.password },
      { label: "Iniciar sesión con Google", value: LOGIN_METHODS.google },
    ];

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
        name: "acceso",
        label: "Inicio de sesión",
        field: "metodo_login",
        align: "left",
      },
      {
        name: "password",
        label: "Contraseña",
        field: "password_hash",
        align: "left",
      },
      {
        name: "auth",
        label: "Authenticator",
        field: "email",
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
    const needsManagerPassword = computed(() => authStore.authMode === "legacy" || !authStore.authMode);

    const isPasswordVisible = (userId) => Boolean(visiblePasswords.value[userId]);

    const isGoogleLogin = (user) => user?.metodo_login === LOGIN_METHODS.google;

    const loginMethodLabel = (user) => {
      return isGoogleLogin(user) ? "Google" : "Usuario y contraseña";
    };

    const emptyUserForm = () => ({
      Usuario: "",
      password_hash: "",
      Rol: "user",
      metodo_login: LOGIN_METHODS.password,
      email: "",
    });

    const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));

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
          .select("id, Usuario, Rol, password_hash, metodo_login, email, auth_user_id, totp_enrolled")
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
      newUser.value = emptyUserForm();
      showAddDialog.value = true;
    };

    const addUser = async () => {
      if (!newUser.value.Usuario || !newUser.value.Rol) {
        notify({
          color: "warning",
          message: "El nombre de usuario y el rol son obligatorios",
        });
        return;
      }

      if (newUser.value.metodo_login === LOGIN_METHODS.google) {
        if (!isValidEmail(newUser.value.email)) {
          notify({
            color: "warning",
            message: "Indica el correo de Google de este usuario",
          });
          return;
        }
      } else if (!newUser.value.password_hash) {
        notify({
          color: "warning",
          message: "El nombre de usuario, contraseña y rol son obligatorios",
        });
        return;
      }

      loading.value = true;
      try {
        const payload = {
          Usuario: newUser.value.Usuario.trim(),
          Rol: newUser.value.Rol,
          metodo_login: newUser.value.metodo_login || LOGIN_METHODS.password,
        };

        if (newUser.value.metodo_login === LOGIN_METHODS.google) {
          payload.email = normalizeEmail(newUser.value.email);
        } else {
          payload.password_hash = newUser.value.password_hash;
        }

        const { error } = await supabase.from("Usuarios").insert(payload);

        if (error) throw error;

        notify({
          color: "positive",
          message: "Usuario agregado correctamente",
        });

        showAddDialog.value = false;
        newUser.value = emptyUserForm();
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
      editingUser.value = {
        ...user,
        metodo_login: user.metodo_login || LOGIN_METHODS.password,
        email: user.email || "",
      };
      showPassword.value = true;
      showEditDialog.value = true;
    };

    const updateUser = async () => {
      if (!editingUser.value.Rol) {
        notify({
          color: "warning",
          message: "Debe asignar un rol",
        });
        return;
      }

      if (editingUser.value.metodo_login === LOGIN_METHODS.google) {
        if (!isValidEmail(editingUser.value.email)) {
          notify({
            color: "warning",
            message: "Indica el correo de Google de este usuario",
          });
          return;
        }
      } else if (!editingUser.value.password_hash) {
        notify({
          color: "warning",
          message: "La contraseña no puede estar vacía",
        });
        return;
      }

      loading.value = true;
      try {
        const payload = {
          Rol: editingUser.value.Rol,
          metodo_login: editingUser.value.metodo_login || LOGIN_METHODS.password,
        };

        if (editingUser.value.metodo_login === LOGIN_METHODS.google) {
          payload.email = normalizeEmail(editingUser.value.email);
        } else {
          payload.password_hash = editingUser.value.password_hash;
        }

        const { error } = await supabase
          .from("Usuarios")
          .update(payload)
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

    const getAuthStatus = (user) => {
      if (user?.totp_enrolled) {
        return { label: "Authenticator activo", color: "teal" };
      }
      if (user?.auth_user_id) {
        return { label: "QR pendiente", color: "orange" };
      }
      return { label: "Login actual", color: "grey" };
    };

    const openAuthDialog = (user) => {
      showAuthPassword.value = false;
      showManagerPassword.value = false;
      authForm.value = {
        usuario: user.Usuario,
        email: user.email || "",
        authPassword: "",
        managerPassword: "",
        auth_user_id: user.auth_user_id || null,
        totp_enrolled: Boolean(user.totp_enrolled),
      };
      showAuthDialog.value = true;
    };

    const inviteUserAuthenticator = async () => {
      if (!authForm.value.email || !authForm.value.authPassword) {
        notify({
          color: "warning",
          message: "El correo y la contraseña de Auth son obligatorios",
        });
        return;
      }

      if (needsManagerPassword.value && !authForm.value.managerPassword) {
        notify({
          color: "warning",
          message: "Confirma tu contraseña de administrador",
        });
        return;
      }

      authLoading.value = true;
      try {
        const result = await inviteAuthenticatorUser({
          usuario: authForm.value.usuario,
          email: authForm.value.email,
          authPassword: authForm.value.authPassword,
          managerPassword: authForm.value.managerPassword,
        });
        notify({
          color: "positive",
          message: result.message || "Authenticator activado",
        });
        showAuthDialog.value = false;
        loadUsers();
      } catch (error) {
        notify({
          color: "negative",
          message: error.message || "No se pudo activar Authenticator",
        });
      } finally {
        authLoading.value = false;
      }
    };

    const resetUserAuthenticator = async () => {
      if (needsManagerPassword.value && !authForm.value.managerPassword) {
        notify({
          color: "warning",
          message: "Confirma tu contraseña de administrador",
        });
        return;
      }

      authLoading.value = true;
      try {
        const result = await resetAuthenticatorFactor({
          usuario: authForm.value.usuario,
          managerPassword: authForm.value.managerPassword,
        });
        notify({
          color: "positive",
          message: result.message || "Authenticator restablecido",
        });
        showAuthDialog.value = false;
        loadUsers();
      } catch (error) {
        notify({
          color: "negative",
          message: error.message || "No se pudo restablecer Authenticator",
        });
      } finally {
        authLoading.value = false;
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
      showAuthDialog,
      showPassword,
      showAuthPassword,
      showManagerPassword,
      authLoading,
      newUser,
      editingUser,
      userToDelete,
      authForm,
      rolOptions,
      loginMethodOptions,
      columns,
      canDeleteUsers,
      needsManagerPassword,
      isGoogleLogin,
      loginMethodLabel,
      isPasswordVisible,
      togglePassword,
      addUser,
      openAddDialog,
      openEditDialog,
      openAuthDialog,
      updateUser,
      confirmDelete,
      deleteUser,
      inviteUserAuthenticator,
      resetUserAuthenticator,
      goBack,
      getRolColor,
      getAuthStatus,
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

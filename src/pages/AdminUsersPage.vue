<template>
  <q-page class="admin-users-page">
    <header class="users-hero">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        class="users-back"
        aria-label="Volver"
        @click="goBack"
      />
      <div class="users-hero__copy">
        <h1 class="users-hero__title">Usuarios</h1>
        <p class="users-hero__subtitle">{{ userStats.total }} personas con acceso al sistema</p>
      </div>
      <q-btn
        v-if="isSuperAdmin"
        unelevated
        round
        dense
        icon="history"
        class="users-logs-btn"
        aria-label="Ver ingresos"
        @click="goToIngresos"
      >
        <q-tooltip>Ingresos</q-tooltip>
      </q-btn>
      <q-btn
        unelevated
        no-caps
        icon="add"
        label="Nuevo"
        class="users-add-btn"
        @click="openAddDialog"
      />
    </header>

    <div class="users-toolbar">
      <q-input
        v-model="searchQuery"
        outlined
        rounded
        dense
        clearable
        debounce="80"
        placeholder="Buscar por nombre, correo o rol"
        class="users-search"
        hide-bottom-space
      >
        <template v-slot:prepend>
          <q-icon name="search" color="grey-6" />
        </template>
      </q-input>
      <div class="users-stats">
        <span>{{ userStats.google }} Google</span>
        <span>{{ userStats.password }} contraseña</span>
        <span>{{ userStats.mfa }} con Authenticator</span>
      </div>
    </div>

    <div v-if="loading && !users.length" class="users-empty">
      <q-spinner color="primary" size="28px" />
      <p class="users-empty__title q-mt-md">Cargando usuarios</p>
    </div>

    <div v-else-if="!filteredUsers.length" class="users-empty">
      <div class="users-empty__mark">
        <q-icon name="group_off" size="28px" />
      </div>
      <p class="users-empty__title">Sin coincidencias</p>
      <p class="users-empty__copy">Prueba con otro nombre, correo o rol.</p>
    </div>

    <template v-else>
    <div class="users-mobile">
      <article v-for="user in filteredUsers" :key="user.id" class="user-card">
        <div class="user-card__top">
          <div class="user-avatar" :style="{ background: getAvatarColor(user.Usuario) }">
            {{ user.Usuario.charAt(0).toUpperCase() }}
          </div>
          <div class="user-card__identity">
            <div class="user-card__name">{{ user.Usuario }}</div>
            <span class="role-pill" :class="`role-pill--${getRolTone(user.Rol)}`">
              {{ user.Rol || 'Sin rol' }}
            </span>
          </div>
          <div class="user-actions">
            <q-btn
              unelevated
              round
              dense
              icon="badge"
              class="user-action"
              @click="openEditDialog(user)"
            >
              <q-tooltip>Editar rol</q-tooltip>
            </q-btn>
            <q-btn
              unelevated
              round
              dense
              icon="verified_user"
              class="user-action user-action--secure"
              @click="openAuthDialog(user)"
            >
              <q-tooltip>Acceso</q-tooltip>
            </q-btn>
            <q-btn
              v-if="canDeleteUsers"
              unelevated
              round
              dense
              icon="delete"
              class="user-action user-action--danger"
              @click="confirmDelete(user)"
            >
              <q-tooltip>Eliminar usuario</q-tooltip>
            </q-btn>
          </div>
        </div>

        <div class="user-card__meta">
          <span class="access-pill">
            <qn-google-mark v-if="isGoogleLogin(user)" class="access-pill__mark" />
            <q-icon v-else name="lock" size="13px" />
            {{ isGoogleLogin(user) ? 'Google' : 'Contraseña' }}
          </span>
          <span
            class="mfa-pill"
            :class="`mfa-pill--${getAuthStatus(user).tone}`"
          >
            {{ getAuthStatus(user).label }}
          </span>
        </div>

        <div class="user-card__secret">
          <template v-if="isGoogleLogin(user)">
            {{ user.email || 'Sin correo de Google' }}
          </template>
          <template v-else>
            <span class="password-text">
              {{ isPasswordVisible(user.id) ? (user.password_hash || 'Sin contraseña') : '••••••••' }}
            </span>
            <q-btn
              flat
              round
              dense
              size="sm"
              class="user-eye"
              :icon="isPasswordVisible(user.id) ? 'visibility_off' : 'visibility'"
              @click="togglePassword(user.id)"
            >
              <q-tooltip>{{ isPasswordVisible(user.id) ? 'Ocultar contraseña' : 'Ver contraseña' }}</q-tooltip>
            </q-btn>
          </template>
        </div>

        <button
          v-if="isSuperAdmin"
          type="button"
          class="user-card__login"
          @click="openLoginHistory(user)"
        >
          <q-icon name="schedule" size="14px" />
          <span class="user-card__login-copy">
            <strong>{{ formatLoginDateTime(user.ultimo_login_at) }}</strong>
            <span>{{ user.ultimo_login_ip || 'Sin IP registrada' }}</span>
          </span>
          <q-icon name="history" size="16px" class="user-card__login-more" />
        </button>
      </article>
    </div>

    <div class="users-desktop">
      <q-table
        :rows="filteredUsers"
        :columns="columns"
        row-key="id"
        flat
        :loading="loading"
        v-model:pagination="tablePagination"
        class="users-table"
        :rows-per-page-options="[12, 24, 48]"
      >
        <template v-slot:body-cell-usuario="props">
          <q-td :props="props">
            <div class="table-person">
              <div class="user-avatar user-avatar--sm" :style="{ background: getAvatarColor(props.row.Usuario) }">
                {{ props.row.Usuario.charAt(0).toUpperCase() }}
              </div>
              <div class="table-person__copy">
                <div class="table-person__name">{{ props.row.Usuario }}</div>
                <div v-if="isGoogleLogin(props.row) && props.row.email" class="table-person__email">
                  {{ props.row.email }}
                </div>
              </div>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-rol="props">
          <q-td :props="props">
            <span class="role-pill" :class="`role-pill--${getRolTone(props.row.Rol)}`">
              {{ props.row.Rol || 'Sin rol' }}
            </span>
          </q-td>
        </template>

        <template v-slot:body-cell-acceso="props">
          <q-td :props="props">
            <div class="table-access">
              <span class="access-pill">
                <qn-google-mark v-if="isGoogleLogin(props.row)" class="access-pill__mark" />
                <q-icon v-else name="lock" size="13px" />
                {{ isGoogleLogin(props.row) ? 'Google' : 'Contraseña' }}
              </span>
              <div v-if="!isGoogleLogin(props.row)" class="table-secret">
                <span class="password-text">
                  {{ isPasswordVisible(props.row.id) ? (props.row.password_hash || 'Sin contraseña') : '••••••••' }}
                </span>
                <q-btn
                  flat
                  round
                  dense
                  size="sm"
                  class="user-eye"
                  :icon="isPasswordVisible(props.row.id) ? 'visibility_off' : 'visibility'"
                  @click="togglePassword(props.row.id)"
                >
                  <q-tooltip>{{ isPasswordVisible(props.row.id) ? 'Ocultar contraseña' : 'Ver contraseña' }}</q-tooltip>
                </q-btn>
              </div>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-auth="props">
          <q-td :props="props">
            <span
              class="mfa-pill"
              :class="`mfa-pill--${getAuthStatus(props.row).tone}`"
            >
              {{ getAuthStatus(props.row).label }}
            </span>
          </q-td>
        </template>

        <template v-slot:body-cell-login="props">
          <q-td :props="props">
            <button
              type="button"
              class="table-login"
              @click="openLoginHistory(props.row)"
            >
              <span class="table-login__time">{{ formatLoginDateTime(props.row.ultimo_login_at) }}</span>
              <span class="table-login__ip">{{ props.row.ultimo_login_ip || 'Sin IP' }}</span>
            </button>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <div class="user-actions user-actions--table">
              <q-btn
                unelevated
                round
                dense
                icon="badge"
                class="user-action"
                @click="openEditDialog(props.row)"
              >
                <q-tooltip>Editar rol</q-tooltip>
              </q-btn>
              <q-btn
                unelevated
                round
                dense
                icon="verified_user"
                class="user-action user-action--secure"
                @click="openAuthDialog(props.row)"
              >
                <q-tooltip>Acceso</q-tooltip>
              </q-btn>
              <q-btn
                v-if="canDeleteUsers"
                unelevated
                round
                dense
                icon="delete"
                class="user-action user-action--danger"
                @click="confirmDelete(props.row)"
              >
                <q-tooltip>Eliminar usuario</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>

        <template v-slot:no-data>
          <div class="users-empty users-empty--table">
            <p class="users-empty__title">Sin coincidencias</p>
          </div>
        </template>
      </q-table>
    </div>
    </template>

    <q-dialog v-model="showAddDialog" backdrop-filter="blur(12px)">
      <q-card class="auth-access-card">
        <header class="auth-access-head">
          <div class="auth-access-head__mark" aria-hidden="true">
            <q-icon name="person_add" size="22px" />
          </div>
          <div class="auth-access-head__copy">
            <div class="auth-access-title">Nuevo usuario</div>
            <div class="auth-access-user">Crea el acceso y el rol</div>
          </div>
          <q-btn flat round dense icon="close" class="auth-access-close" v-close-popup aria-label="Cerrar" />
        </header>

        <div class="auth-access-body">
          <q-input
            v-model="newUser.Usuario"
            label="Nombre de usuario"
            outlined
            rounded
            dense
            hide-bottom-space
            class="q-mb-md"
          >
            <template v-slot:prepend>
              <q-icon name="person_outline" color="primary" />
            </template>
          </q-input>

          <p class="auth-section-label">Cómo inicia sesión</p>
          <div class="method-grid" role="radiogroup" aria-label="Método de inicio de sesión">
            <button
              type="button"
              class="method-card"
              :class="{ 'is-selected': !isNewUserGoogle }"
              role="radio"
              :aria-checked="(!isNewUserGoogle).toString()"
              @click="setNewLoginMethod(LOGIN_METHODS.password)"
            >
              <span class="method-card__check" aria-hidden="true">
                <q-icon name="check" size="14px" />
              </span>
              <span class="method-card__icon">
                <q-icon name="lock" size="20px" />
              </span>
              <span class="method-card__title">Contraseña</span>
              <span class="method-card__hint">Usuario y clave</span>
            </button>
            <button
              type="button"
              class="method-card"
              :class="{ 'is-selected': isNewUserGoogle }"
              role="radio"
              :aria-checked="isNewUserGoogle.toString()"
              @click="setNewLoginMethod(LOGIN_METHODS.google)"
            >
              <span class="method-card__check" aria-hidden="true">
                <q-icon name="check" size="14px" />
              </span>
              <span class="method-card__icon method-card__icon--google">
                <qn-google-mark />
              </span>
              <span class="method-card__title">Google</span>
              <span class="method-card__hint">Correo de Gmail</span>
            </button>
          </div>

          <div class="auth-fields">
            <q-input
              v-if="isNewUserGoogle"
              v-model="newUser.email"
              label="Correo de Google"
              type="email"
              outlined
              rounded
              dense
              hide-bottom-space
            >
              <template v-slot:prepend>
                <q-icon name="mail_outline" color="primary" />
              </template>
            </q-input>
            <q-input
              v-else
              v-model="newUser.password_hash"
              label="Contraseña"
              :type="showPassword ? 'text' : 'password'"
              outlined
              rounded
              dense
              hide-bottom-space
            >
              <template v-slot:prepend>
                <q-icon name="lock" color="primary" />
              </template>
              <template v-slot:append>
                <password-visibility-toggle v-model="showPassword" />
              </template>
            </q-input>
            <q-select
              v-model="newUser.Rol"
              :options="rolOptions"
              label="Rol"
              outlined
              rounded
              dense
              hide-bottom-space
            />
          </div>
        </div>

        <footer class="auth-access-footer">
          <q-btn flat no-caps unelevated label="Cancelar" class="auth-btn-ghost" v-close-popup />
          <q-btn unelevated no-caps label="Agregar" class="auth-btn-save" :loading="loading" @click="addUser" />
        </footer>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showEditDialog" backdrop-filter="blur(12px)">
      <q-card class="auth-access-card">
        <header class="auth-access-head">
          <div class="auth-access-head__mark" aria-hidden="true">
            <q-icon name="badge" size="22px" />
          </div>
          <div class="auth-access-head__copy">
            <div class="auth-access-title">Rol</div>
            <div class="auth-access-user">{{ editingUser?.Usuario }}</div>
          </div>
          <q-btn flat round dense icon="close" class="auth-access-close" v-close-popup aria-label="Cerrar" />
        </header>

        <div class="auth-access-body" v-if="editingUser">
          <q-select
            v-model="editingUser.Rol"
            :options="rolOptions"
            label="Rol"
            outlined
            rounded
            dense
            hide-bottom-space
          />
        </div>

        <footer class="auth-access-footer">
          <q-btn flat no-caps unelevated label="Cancelar" class="auth-btn-ghost" v-close-popup />
          <q-btn unelevated no-caps label="Guardar" class="auth-btn-save" :loading="loading" @click="updateUser" />
        </footer>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showDeleteDialog" backdrop-filter="blur(12px)">
      <q-card class="auth-access-card">
        <header class="auth-access-head">
          <div class="auth-access-head__mark auth-access-head__mark--danger" aria-hidden="true">
            <q-icon name="delete" size="22px" />
          </div>
          <div class="auth-access-head__copy">
            <div class="auth-access-title">Eliminar usuario</div>
            <div class="auth-access-user">{{ userToDelete?.Usuario }}</div>
          </div>
          <q-btn flat round dense icon="close" class="auth-access-close" v-close-popup aria-label="Cerrar" />
        </header>
        <div class="auth-access-body">
          <p class="delete-copy">
            Esta persona perderá el acceso de inmediato. Esta acción no se puede deshacer.
          </p>
        </div>
        <footer class="auth-access-footer">
          <q-btn flat no-caps unelevated label="Cancelar" class="auth-btn-ghost" v-close-popup />
          <q-btn unelevated no-caps label="Eliminar" class="auth-btn-danger" :loading="loading" @click="deleteUser" />
        </footer>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showAuthDialog" backdrop-filter="blur(12px)" class="auth-access-dialog">
      <q-card class="auth-access-card">
        <header class="auth-access-head">
          <div class="auth-access-head__mark" aria-hidden="true">
            <q-icon name="verified_user" size="22px" />
          </div>
          <div class="auth-access-head__copy">
            <div class="auth-access-title">Acceso</div>
            <div class="auth-access-user">{{ authForm.usuario }}</div>
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            class="auth-access-close"
            v-close-popup
            aria-label="Cerrar"
          />
        </header>

        <div class="auth-access-body">
          <p class="auth-section-label">Cómo inicia sesión</p>
          <div class="method-grid" role="radiogroup" aria-label="Método de inicio de sesión">
            <button
              type="button"
              class="method-card"
              :class="{ 'is-selected': !isAuthGoogle }"
              role="radio"
              :aria-checked="(!isAuthGoogle).toString()"
              @click="setLoginMethod(LOGIN_METHODS.password)"
            >
              <span class="method-card__check" aria-hidden="true">
                <q-icon name="check" size="14px" />
              </span>
              <span class="method-card__icon">
                <q-icon name="lock" size="20px" />
              </span>
              <span class="method-card__title">Contraseña</span>
              <span class="method-card__hint">Usuario y clave</span>
            </button>
            <button
              type="button"
              class="method-card"
              :class="{ 'is-selected': isAuthGoogle }"
              role="radio"
              :aria-checked="isAuthGoogle.toString()"
              @click="setLoginMethod(LOGIN_METHODS.google)"
            >
              <span class="method-card__check" aria-hidden="true">
                <q-icon name="check" size="14px" />
              </span>
              <span class="method-card__icon method-card__icon--google">
                <qn-google-mark />
              </span>
              <span class="method-card__title">Google</span>
              <span class="method-card__hint">Correo de Gmail</span>
            </button>
          </div>

          <div v-if="isAuthGoogle" class="auth-fields">
            <q-input
              v-model="authForm.email"
              label="Correo de Google"
              type="email"
              outlined
              rounded
              dense
              hide-bottom-space
              autocomplete="off"
            >
              <template v-slot:prepend>
                <q-icon name="mail_outline" color="primary" />
              </template>
            </q-input>
            <p class="auth-field-hint">El Gmail con el que va a entrar.</p>
          </div>

          <div v-else class="auth-fields">
            <q-input
              v-model="authForm.password_hash"
              label="Contraseña"
              :type="showPassword ? 'text' : 'password'"
              outlined
              rounded
              dense
              hide-bottom-space
              autocomplete="off"
            >
              <template v-slot:prepend>
                <q-icon name="lock" color="primary" />
              </template>
              <template v-slot:append>
                <password-visibility-toggle v-model="showPassword" />
              </template>
            </q-input>
          </div>

          <section class="mfa-panel">
              <div class="mfa-panel__head">
                <div class="mfa-panel__intro">
                  <div class="mfa-panel__title">Google Authenticator</div>
                  <p class="mfa-panel__copy">{{ authStatusCopy }}</p>
                </div>
                <span class="mfa-pill" :class="`mfa-pill--${authDialogStatus.tone}`">
                  {{ authDialogStatus.label }}
                </span>
              </div>

              <div
                v-if="!isAuthGoogle || (needsManagerPassword && authForm.auth_user_id)"
                class="mfa-panel__fields"
              >
                <q-input
                  v-if="!isAuthGoogle"
                  v-model="authForm.email"
                  label="Correo"
                  type="email"
                  outlined
                  rounded
                  dense
                  hide-bottom-space
                  autocomplete="off"
                >
                  <template v-slot:prepend>
                    <q-icon name="mail_outline" color="primary" />
                  </template>
                </q-input>
                <q-input
                  v-if="!isAuthGoogle"
                  v-model="authForm.authPassword"
                  label="Contraseña de Auth"
                  :type="showAuthPassword ? 'text' : 'password'"
                  outlined
                  rounded
                  dense
                  hide-bottom-space
                  autocomplete="new-password"
                >
                  <template v-slot:prepend>
                    <q-icon name="vpn_key" color="primary" />
                  </template>
                  <template v-slot:append>
                    <password-visibility-toggle v-model="showAuthPassword" />
                  </template>
                </q-input>
                <p v-if="!isAuthGoogle" class="auth-field-hint">
                  Mínimo 6 caracteres. Independiente de la contraseña de arriba.
                </p>
                <q-input
                  v-if="needsManagerPassword && (!isAuthGoogle || authForm.auth_user_id)"
                  v-model="authForm.managerPassword"
                  label="Tu contraseña de administrador"
                  :type="showManagerPassword ? 'text' : 'password'"
                  outlined
                  rounded
                  dense
                  hide-bottom-space
                  autocomplete="off"
                >
                  <template v-slot:prepend>
                    <q-icon name="admin_panel_settings" color="primary" />
                  </template>
                  <template v-slot:append>
                    <password-visibility-toggle v-model="showManagerPassword" />
                  </template>
                </q-input>
              </div>

              <div v-if="!isAuthGoogle || authForm.auth_user_id" class="mfa-panel__actions">
                <q-btn
                  v-if="authForm.auth_user_id"
                  flat
                  no-caps
                  unelevated
                  color="orange-9"
                  label="Resetear"
                  class="auth-btn-ghost"
                  :loading="authLoading"
                  @click="resetUserAuthenticator"
                />
                <q-btn
                  v-if="!isAuthGoogle"
                  unelevated
                  no-caps
                  class="auth-btn-mfa"
                  :label="authForm.auth_user_id ? 'Actualizar Auth' : 'Activar Authenticator'"
                  :loading="authLoading"
                  @click="inviteUserAuthenticator"
                />
              </div>
            </section>
        </div>

        <footer class="auth-access-footer">
          <q-btn
            flat
            no-caps
            unelevated
            label="Cerrar"
            class="auth-btn-ghost"
            v-close-popup
          />
          <q-btn
            unelevated
            no-caps
            label="Guardar"
            class="auth-btn-save"
            :loading="loading"
            @click="saveLoginMethod"
          />
        </footer>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, ref, onMounted, computed, watch } from "vue";
import { notify } from '../utils/notify'
import { useRouter } from "vue-router";
import { supabase } from "../supabase";
import { useAuthStore, LOGIN_METHODS, normalizeEmail } from "../stores/auth";
import { inviteAuthenticatorUser, resetAuthenticatorFactor } from "../services/manageAuthUser";
import { formatLoginDateTime } from "../utils/loginLogs";
import QnGoogleMark from "../components/QnGoogleMark.vue";
import PasswordVisibilityToggle from "../components/auth/PasswordVisibilityToggle.vue";

export default defineComponent({
  name: "AdminUsersPage",
  components: { QnGoogleMark, PasswordVisibilityToggle },
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();

    const users = ref([]);
    const loading = ref(true);
    const showAddDialog = ref(false);
    const showEditDialog = ref(false);
    const showDeleteDialog = ref(false);
    const showAuthDialog = ref(false);
    const showPassword = ref(false);
    const showAuthPassword = ref(false);
    const showManagerPassword = ref(false);
    const authLoading = ref(false);
    const searchQuery = ref("");
    const tablePagination = ref({
      page: 1,
      rowsPerPage: 12,
    });
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
      id: null,
      usuario: "",
      email: "",
      password_hash: "",
      metodo_login: LOGIN_METHODS.password,
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

    const currentUser = computed(() => authStore.user);
    const canManageUsers = computed(() => authStore.canManageUsers);
    const isSuperAdmin = computed(() => authStore.isSuperAdmin);
    const canDeleteUsers = computed(() => currentUser.value?.Usuario === "Esteban B");
    const needsManagerPassword = computed(() => authStore.authMode === "legacy" || !authStore.authMode);

    const columns = computed(() => {
      const base = [
        {
          name: "usuario",
          label: "Persona",
          field: "Usuario",
          align: "left",
          sortable: true,
        },
        {
          name: "rol",
          label: "Rol",
          field: "Rol",
          align: "left",
          sortable: true,
        },
        {
          name: "acceso",
          label: "Acceso",
          field: "metodo_login",
          align: "left",
        },
        {
          name: "auth",
          label: "Authenticator",
          field: "totp_enrolled",
          align: "left",
        },
      ];

      if (isSuperAdmin.value) {
        base.push({
          name: "login",
          label: "Último acceso",
          field: "ultimo_login_at",
          align: "left",
          sortable: true,
        });
      }

      base.push({
        name: "actions",
        label: "",
        field: "actions",
        align: "right",
        style: "width: 140px",
      });

      return base;
    });

    const isPasswordVisible = (userId) => Boolean(visiblePasswords.value[userId]);

    const isGoogleLogin = (user) => user?.metodo_login === LOGIN_METHODS.google;
    const isAuthGoogle = computed(() => authForm.value.metodo_login === LOGIN_METHODS.google);
    const isNewUserGoogle = computed(() => newUser.value.metodo_login === LOGIN_METHODS.google);

    const loginMethodLabel = (user) => {
      return isGoogleLogin(user) ? "Google" : "Usuario y contraseña";
    };

    const setLoginMethod = (method) => {
      authForm.value.metodo_login = method;
    };

    const setNewLoginMethod = (method) => {
      newUser.value.metodo_login = method;
    };

    const filteredUsers = computed(() => {
      const query = searchQuery.value.trim().toLowerCase();
      if (!query) return users.value;
      return users.value.filter((user) => {
        const haystack = [
          user.Usuario,
          user.Rol,
          user.email,
          user.metodo_login,
          isSuperAdmin.value ? user.ultimo_login_ip : null,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      });
    });

    watch(searchQuery, () => {
      tablePagination.value = { ...tablePagination.value, page: 1 };
    });

    const userStats = computed(() => {
      const list = users.value;
      return {
        total: list.length,
        google: list.filter((user) => isGoogleLogin(user)).length,
        password: list.filter((user) => !isGoogleLogin(user)).length,
        mfa: list.filter((user) => user.totp_enrolled).length,
      };
    });

    const authDialogStatus = computed(() => {
      if (authForm.value.totp_enrolled) {
        return { label: "Activo", tone: "ok" };
      }
      if (authForm.value.auth_user_id) {
        return { label: "QR pendiente", tone: "warn" };
      }
      return { label: "Sin activar", tone: "muted" };
    });

    const authStatusCopy = computed(() => {
      if (authForm.value.totp_enrolled) {
        return "Authenticator activo. El segundo factor queda exigido al entrar.";
      }
      if (authForm.value.auth_user_id) {
        return "La cuenta está lista. Falta escanear el QR en el primer acceso.";
      }
      if (authForm.value.metodo_login === LOGIN_METHODS.google) {
        return "Solo guarda el Gmail. En el primer acceso con Google se pedirá el QR de Authenticator.";
      }
      return "Después de la contraseña, esta persona también deberá usar Authenticator.";
    });

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
        const profileColumns = isSuperAdmin.value
          ? "id, Usuario, Rol, password_hash, metodo_login, email, auth_user_id, totp_enrolled, ultimo_login_at, ultimo_login_ip"
          : "id, Usuario, Rol, password_hash, metodo_login, email, auth_user_id, totp_enrolled";

        const { data, error } = await supabase
          .from("Usuarios")
          .select(profileColumns)
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
        id: user.id,
        Usuario: user.Usuario,
        Rol: user.Rol,
      };
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

      loading.value = true;
      try {
        const { error } = await supabase
          .from("Usuarios")
          .update({ Rol: editingUser.value.Rol })
          .eq("id", editingUser.value.id);

        if (error) throw error;

        notify({
          color: "positive",
          message: "Rol actualizado correctamente",
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

    const goToIngresos = () => {
      router.push("/ingresos");
    };

    const openLoginHistory = (user) => {
      router.push({
        path: "/ingresos",
        query: user?.Usuario ? { usuario: user.Usuario } : {},
      });
    };

    const getAuthStatus = (user) => {
      if (user?.totp_enrolled) {
        return { label: "Activo", tone: "ok" };
      }
      if (user?.auth_user_id) {
        return { label: "QR pendiente", tone: "warn" };
      }
      return { label: "Sin activar", tone: "muted" };
    };

    const openAuthDialog = (user) => {
      showPassword.value = false;
      showAuthPassword.value = false;
      showManagerPassword.value = false;
      authForm.value = {
        id: user.id,
        usuario: user.Usuario,
        email: user.email || "",
        password_hash: user.password_hash || "",
        metodo_login: user.metodo_login || LOGIN_METHODS.password,
        authPassword: "",
        managerPassword: "",
        auth_user_id: user.auth_user_id || null,
        totp_enrolled: Boolean(user.totp_enrolled),
      };
      showAuthDialog.value = true;
    };

    const saveLoginMethod = async () => {
      if (authForm.value.metodo_login === LOGIN_METHODS.google) {
        if (!isValidEmail(authForm.value.email)) {
          notify({
            color: "warning",
            message: "Indica el correo de Google de este usuario",
          });
          return;
        }
      } else if (!authForm.value.password_hash) {
        notify({
          color: "warning",
          message: "La contraseña no puede estar vacía",
        });
        return;
      }

      loading.value = true;
      try {
        const payload = {
          metodo_login: authForm.value.metodo_login || LOGIN_METHODS.password,
        };

        if (authForm.value.metodo_login === LOGIN_METHODS.google) {
          payload.email = normalizeEmail(authForm.value.email);
        } else {
          payload.password_hash = authForm.value.password_hash;
        }

        const { error } = await supabase
          .from("Usuarios")
          .update(payload)
          .eq("id", authForm.value.id);

        if (error) throw error;

        notify({
          color: "positive",
          message: "Inicio de sesión actualizado",
        });

        loadUsers();
      } catch (error) {
        console.error("Error updating login method:", error);
        notify({
          color: "negative",
          message: "Error al actualizar el inicio de sesión: " + error.message,
        });
      } finally {
        loading.value = false;
      }
    };

    const inviteUserAuthenticator = async () => {
      if (isAuthGoogle.value) {
        notify({
          color: "warning",
          message: "Con Google solo guarda el correo. Authenticator se pide al entrar.",
        });
        return;
      }

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

    const getRolTone = (rol) => {
      const tones = {
        SuperAdmin: "lead",
        admin: "warn",
        user: "info",
        inactivo: "muted",
      };
      return tones[rol] || "muted";
    };

    const getAvatarColor = (name) => {
      const palette = ["#0f766e", "#1d4ed8", "#6d28d9", "#9f1239", "#c2410c", "#0e7490", "#4338ca"];
      const code = [...String(name || "")].reduce((sum, char) => sum + char.charCodeAt(0), 0);
      return palette[code % palette.length];
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
      filteredUsers,
      userStats,
      searchQuery,
      tablePagination,
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
      isSuperAdmin,
      needsManagerPassword,
      isGoogleLogin,
      isAuthGoogle,
      isNewUserGoogle,
      loginMethodLabel,
      LOGIN_METHODS,
      setLoginMethod,
      setNewLoginMethod,
      authDialogStatus,
      authStatusCopy,
      isPasswordVisible,
      togglePassword,
      addUser,
      openAddDialog,
      openEditDialog,
      openAuthDialog,
      saveLoginMethod,
      updateUser,
      confirmDelete,
      deleteUser,
      inviteUserAuthenticator,
      resetUserAuthenticator,
      goBack,
      goToIngresos,
      getRolTone,
      getAvatarColor,
      getAuthStatus,
      formatLoginDateTime,
      openLoginHistory,
    };
  },
});
</script>

<style scoped>
.password-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  letter-spacing: 0.04em;
}

.auth-access-card {
  width: min(440px, calc(100vw - 32px));
  max-height: min(90vh, 780px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 24px !important;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.18) !important;
  background: #fff;
}

.auth-access-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--apple-separator);
}

.auth-access-head__mark {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #0f766e;
  background: linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
}

.auth-access-head__copy {
  min-width: 0;
  flex: 1;
}

.auth-access-title {
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--apple-text-primary);
  line-height: 1.2;
}

.auth-access-user {
  margin-top: 2px;
  font-size: 0.8rem;
  color: var(--apple-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.auth-access-close {
  color: #86868b;
}

.auth-access-body {
  padding: 18px 20px 8px;
  overflow-y: auto;
  min-height: 0;
}

.auth-section-label {
  margin: 0 0 10px;
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #86868b;
}

.method-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 18px;
}

.method-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 14px 14px 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  background: #fafafa;
  color: inherit;
  font: inherit;
  line-height: 1.2;
  appearance: none;
  -webkit-appearance: none;
  text-align: left;
  cursor: pointer;
  user-select: none;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.method-card:focus-visible {
  outline: 2px solid #0f766e;
  outline-offset: 2px;
}

.method-card:hover {
  background: #fff;
  border-color: rgba(0, 0, 0, 0.14);
}

.method-card.is-selected {
  background: #fff;
  border-color: #0f766e;
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
}

.method-card__check {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #fff;
  background: #0f766e;
  opacity: 0;
  transform: scale(0.7);
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}

.method-card.is-selected .method-card__check {
  opacity: 1;
  transform: scale(1);
}

.method-card__icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #fff;
  color: #334155;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.method-card__icon--google {
  background: #fff;
}

.method-card__title {
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--apple-text-primary);
}

.method-card__hint {
  font-size: 0.72rem;
  color: #86868b;
  margin-top: -4px;
}

.auth-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.auth-field-hint {
  margin: -4px 2px 0;
  font-size: 0.75rem;
  line-height: 1.35;
  color: #86868b;
}

.mfa-panel {
  margin-top: 16px;
  padding: 14px;
  border-radius: 18px;
  background: #f5f5f7;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.mfa-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.mfa-panel__intro {
  min-width: 0;
}

.mfa-panel__title {
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--apple-text-primary);
}

.mfa-panel__copy {
  margin: 4px 0 0;
  font-size: 0.75rem;
  line-height: 1.4;
  color: #6e6e73;
}

.mfa-pill {
  flex-shrink: 0;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.mfa-pill--ok {
  background: #dcfce7;
  color: #166534;
}

.mfa-pill--warn {
  background: #ffedd5;
  color: #9a3412;
}

.mfa-pill--muted {
  background: #e8e8ed;
  color: #6e6e73;
}

.mfa-panel__fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mfa-panel__actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.auth-access-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px 18px;
  border-top: 1px solid var(--apple-separator);
  background: #fff;
}

.auth-btn-ghost {
  min-height: 40px;
  padding: 0 14px;
  border-radius: 12px !important;
  font-weight: 600 !important;
  color: #424245 !important;
}

.auth-btn-save,
.auth-btn-mfa {
  min-height: 40px;
  padding: 0 18px;
  border-radius: 12px !important;
  font-weight: 650 !important;
  letter-spacing: -0.01em;
  box-shadow: none !important;
}

.auth-btn-save {
  background: var(--apple-blue) !important;
  color: #fff !important;
}

.auth-btn-save:hover {
  background: var(--apple-blue-hover) !important;
}

.auth-btn-mfa {
  background: #0f766e !important;
  color: #fff !important;
}

.auth-access-card :deep(.q-field--outlined .q-field__control) {
  border-radius: 14px;
  background: #fff;
}

.auth-access-card :deep(.q-field--outlined.q-field--focused .q-field__control::before) {
  border-color: #0f766e;
}

.mfa-panel :deep(.q-field--outlined .q-field__control) {
  background: #fff;
}

.auth-access-head__mark--danger {
  color: #b91c1c;
  background: linear-gradient(180deg, #fff1f2 0%, #ffe4e6 100%);
}

.delete-copy {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #3f3f46;
}

.auth-btn-danger {
  min-height: 40px;
  padding: 0 18px;
  border-radius: 12px !important;
  font-weight: 650 !important;
  background: #dc2626 !important;
  color: #fff !important;
  box-shadow: none !important;
}

.admin-users-page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 16px 16px 32px;
}

.users-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.users-back {
  color: #3f3f46;
}

.users-hero__copy {
  min-width: 0;
  flex: 1;
}

.users-hero__title {
  margin: 0;
  font-size: 1.55rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1.1;
  color: var(--apple-text-primary);
}

.users-hero__subtitle {
  margin: 4px 0 0;
  font-size: 0.82rem;
  color: var(--apple-text-secondary);
}

.users-add-btn {
  min-height: 40px;
  padding: 0 16px;
  border-radius: 12px !important;
  font-weight: 650 !important;
  background: var(--apple-blue) !important;
  color: #fff !important;
  box-shadow: none !important;
}

.users-logs-btn {
  width: 40px;
  height: 40px;
  background: #f5f5f7 !important;
  color: #3f3f46 !important;
  box-shadow: none !important;
}

.users-toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.users-search {
  width: 100%;
}

.users-search :deep(.q-field__control) {
  border-radius: 14px;
  background: #fff;
}

.users-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: #6e6e73;
  font-size: 0.75rem;
}

.users-stats span {
  padding: 4px 10px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid var(--apple-separator);
}

.users-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 20px;
  border-radius: 22px;
  background: #fff;
  border: 1px solid var(--apple-separator);
}

.users-empty--table {
  padding: 28px 12px;
  border: 0;
}

.users-empty__mark {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: #f5f5f7;
  color: #86868b;
  margin-bottom: 12px;
}

.users-empty__title {
  margin: 0;
  font-weight: 700;
  color: var(--apple-text-primary);
}

.users-empty__copy {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: #6e6e73;
}

.users-mobile {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.users-desktop {
  display: none;
}

.user-card {
  padding: 14px 14px 12px;
  border-radius: 20px;
  background: #fff;
  border: 1px solid var(--apple-separator);
  box-shadow: var(--apple-card-shadow);
  transition: box-shadow 0.2s ease;
}

.user-card:hover {
  box-shadow: var(--apple-card-shadow-hover);
}

.user-action:hover {
  background: #ececee !important;
}

.user-card__top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  flex-shrink: 0;
}

.user-avatar--sm {
  width: 34px;
  height: 34px;
  border-radius: 11px;
  font-size: 0.8rem;
}

.user-card__identity {
  min-width: 0;
  flex: 1;
}

.user-card__name {
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--apple-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0 8px;
}

.user-card__secret {
  display: flex;
  align-items: center;
  min-height: 28px;
  font-size: 0.8rem;
  color: #6e6e73;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.user-actions--table {
  justify-content: flex-end;
}

.user-action {
  width: 34px;
  height: 34px;
  background: #f5f5f7 !important;
  color: #3f3f46 !important;
  box-shadow: none !important;
}

.user-action--secure {
  color: #0f766e !important;
}

.user-action--danger {
  color: #dc2626 !important;
}

.user-eye {
  color: #86868b;
}

.role-pill,
.access-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 650;
  line-height: 1.3;
}

.role-pill--lead {
  background: #111827;
  color: #fff;
}

.role-pill--warn {
  background: #ffedd5;
  color: #9a3412;
}

.role-pill--info {
  background: #dbeafe;
  color: #1d4ed8;
}

.role-pill--muted {
  background: #e8e8ed;
  color: #6e6e73;
}

.access-pill {
  background: #f5f5f7;
  color: #3f3f46;
}

.access-pill__mark,
.access-pill :deep(svg) {
  width: 13px;
  height: 13px;
  display: block;
}

.table-person {
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-person__name {
  font-weight: 650;
  letter-spacing: -0.01em;
}

.table-person__email {
  font-size: 0.75rem;
  color: #6e6e73;
}

.table-access {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.table-secret {
  display: flex;
  align-items: center;
}

.user-card__login,
.table-login {
  appearance: none;
  -webkit-appearance: none;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: #f8fafc;
  border: 1px solid transparent;
}

.user-card__login {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 12px;
  color: #3f3f46;
}

.user-card__login:hover,
.table-login:hover {
  background: #eef6ff;
  border-color: rgba(0, 113, 227, 0.12);
}

.user-card__login-copy {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-size: 0.75rem;
  line-height: 1.3;
}

.user-card__login-copy strong {
  font-weight: 650;
  color: var(--apple-text-primary);
}

.user-card__login-more {
  color: #86868b;
}

.table-login {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 4px 6px;
  border-radius: 10px;
}

.table-login__time {
  font-size: 0.82rem;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--apple-text-primary);
}

.table-login__ip {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.72rem;
  color: #6e6e73;
}

.users-desktop :deep(.q-table__container) {
  background: #fff;
  border-radius: 22px;
  border: 1px solid var(--apple-separator);
  box-shadow: var(--apple-card-shadow);
  overflow: hidden;
}

.users-table :deep(thead tr) {
  background: #fafafa;
}

.users-table :deep(th) {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #86868b;
}

.users-table :deep(td) {
  border-color: var(--apple-separator) !important;
}

.users-table :deep(tbody tr:hover) {
  background: #f8fafc;
}

.users-table :deep(.q-table__bottom) {
  border-top: 1px solid var(--apple-separator);
  color: #6e6e73;
}

@media (min-width: 1024px) {
  .admin-users-page {
    padding: 28px 32px 48px;
  }

  .users-hero__title {
    font-size: 1.85rem;
  }

  .users-toolbar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .users-search {
    max-width: 360px;
  }

  .users-mobile {
    display: none;
  }

  .users-desktop {
    display: block;
  }
}
</style>

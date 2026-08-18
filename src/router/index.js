import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";
import routes from "./routes";
import { useAuthStore } from "../stores/auth";
import { getAppScrollTarget } from "../utils/appScroll";

const pageScrollByPath = new Map();

export default function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === "history"
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: (to, from, savedPosition) => {
      const page = typeof document !== "undefined" ? getAppScrollTarget() : null;
      if (from?.fullPath && page) {
        pageScrollByPath.set(from.fullPath, page.scrollTop);
      }

      if (page && document.body.classList.contains("mobile-app-shell")) {
        const top = savedPosition
          ? (pageScrollByPath.get(to.fullPath) || 0)
          : 0;
        page.scrollTo(0, top);
        return { left: 0, top: 0 };
      }

      if (savedPosition) {
        return new Promise((resolve) => {
          let attempts = 0
          const check = () => {
            const height = document.documentElement.scrollHeight || document.body.scrollHeight
            if (height >= savedPosition.top + 100 || attempts++ > 60) {
              resolve(savedPosition)
              return true
            }
            return false
          }
          if (check()) return
          const timer = setInterval(() => {
            if (check()) clearInterval(timer)
          }, 25)
        })
      }
      return { left: 0, top: 0 }
    },
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach((to) => {
    const authStore = useAuthStore()

    if (to.meta.requiresAuth && !authStore.isLoggedIn) {
      return { path: "/" };
    }

    if (to.meta.requiresUserManager && !authStore.canManageUsers) {
      return { path: "/config" };
    }

    return true;
  });

  return Router;
}

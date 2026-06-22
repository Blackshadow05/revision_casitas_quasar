import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";
import routes from "./routes";
import { useAuthStore } from "../stores/auth";

export default function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === "history"
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: (to, from, savedPosition) => {
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
    if (to.meta.requiresAuth && !useAuthStore().isLoggedIn) {
      return { path: "/" };
    }

    return true;
  });

  return Router;
}

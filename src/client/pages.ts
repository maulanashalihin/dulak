/**
 * Explicit page registry (Bun 1.3 removed import.meta.glob). Shared by the
 * client bundle and the SSR renderer.
 */
import type { Component, DefineComponent } from "vue";
import Admin from "./pages/Admin.vue";
import Dashboard from "./pages/Dashboard.vue";
import ForgotPassword from "./pages/ForgotPassword.vue";
import Login from "./pages/Login.vue";
import NotFound from "./pages/NotFound.vue";
import Profile from "./pages/Profile.vue";
import Register from "./pages/Register.vue";
import ResetPassword from "./pages/ResetPassword.vue";

/** `Component` (not bare `DefineComponent`): SFC default exports carry their
 *  props as generics, which are not assignable to the parameterless form. */
type PageModule = { default: Component };

export const pages: Record<string, PageModule> = {
	"./pages/Admin.vue": { default: Admin },
	"./pages/Dashboard.vue": { default: Dashboard },
	"./pages/ForgotPassword.vue": { default: ForgotPassword },
	"./pages/Login.vue": { default: Login },
	"./pages/NotFound.vue": { default: NotFound },
	"./pages/Profile.vue": { default: Profile },
	"./pages/Register.vue": { default: Register },
	"./pages/ResetPassword.vue": { default: ResetPassword },
};

export const notFoundPage = pages["./pages/NotFound.vue"]?.default as
	DefineComponent;


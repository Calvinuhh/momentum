import { createRouter, createWebHistory } from 'vue-router'
import { authQueryOptions, queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresGuest?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: () => import('@/views/LandingView.vue') },
    {
      path: '/register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/confirm-account',
      component: () => import('@/views/ConfirmAccountView.vue'),
      meta: { requiresGuest: true },
    },
    { path: '/invitations/accept', component: () => import('@/views/AcceptInvitationView.vue') },
    {
      path: '/workspaces',
      component: () => import('@/views/WorkspacesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/workspaces/:id',
      component: () => import('@/views/WorkspaceDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true },
    },
    { path: '/:pathMatch(.*)*', component: () => import('@/views/NotFoundView.vue') },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth && !to.meta.requiresGuest) return
  const user = await queryClient.query(authQueryOptions)
  useAuthStore().setUser(user)

  if (to.meta.requiresGuest && user) return '/'
  if (to.meta.requiresAuth && !user) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})

export default router

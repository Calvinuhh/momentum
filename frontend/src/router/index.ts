import { createRouter, createWebHistory } from 'vue-router'
import { queryClient } from '@/lib/queryClient'
import { getMe } from '@/api/auth'

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
    { path: '/register', component: () => import('@/views/RegisterView.vue'), meta: { requiresGuest: true } },
    { path: '/login', component: () => import('@/views/LoginView.vue'), meta: { requiresGuest: true } },
    { path: '/confirm-account', component: () => import('@/views/ConfirmAccountView.vue'), meta: { requiresGuest: true } },
    { path: '/workspaces', component: () => import('@/views/WorkspacesView.vue'), meta: { requiresAuth: true } },
    { path: '/workspaces/:id', component: () => import('@/views/WorkspaceDetailView.vue'), meta: { requiresAuth: true } },
    { path: '/:pathMatch(.*)*', component: () => import('@/views/NotFoundView.vue') },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth && !to.meta.requiresGuest) return
  try {
    const user = await queryClient.query({
      queryKey: ['auth', 'me'],
      queryFn: getMe,
      staleTime: 5 * 60 * 1000,
      retry: false,
    })

    if (to.meta.requiresGuest && user) return '/'
  } catch (e: unknown) {
    if ((e as { status?: number }).status === 401) {
      if (to.meta.requiresAuth) return { path: '/login', query: { redirect: to.fullPath } }
      return
    }
    throw e
  }
})

export default router

import { createRouter, createWebHistory } from 'vue-router'
import { queryClient } from '@/lib/queryClient'
import { apiFetch } from '@/api/client'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: () => import('@/views/LandingView.vue') },
    { path: '/register', component: () => import('@/views/RegisterView.vue') },
    { path: '/login', component: () => import('@/views/LoginView.vue') },
    { path: '/workspaces', component: () => import('@/views/WorkspacesView.vue'), meta: { requiresAuth: true } },
    { path: '/workspaces/:id', component: () => import('@/views/WorkspaceDetailView.vue'), meta: { requiresAuth: true } },
    { path: '/:pathMatch(.*)*', component: () => import('@/views/NotFoundView.vue') },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return
  try {
    await queryClient.fetchQuery({
      queryKey: ['auth', 'me'],
      queryFn: () => apiFetch<{ user: { id: string; email: string } }>('/api/v1/auth/me').then((r) => r.user),
      staleTime: 5 * 60 * 1000,
      retry: false,
    })
  } catch (e: unknown) {
    if ((e as { status?: number }).status === 401) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
    throw e
  }
})

export default router

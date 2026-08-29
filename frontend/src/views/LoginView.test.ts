import { afterEach, describe, expect, test, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createMemoryHistory, createRouter } from 'vue-router'
import { getSession, login } from '@/api/auth'
import { authQueryKey } from '@/lib/queryClient'
import { useAuthStore } from '@/stores/auth'
import LoginView from './LoginView.vue'

vi.mock('@/api/auth', () => ({
  getSession: vi.fn<typeof getSession>(),
  login: vi.fn<typeof login>(),
}))

afterEach(() => vi.clearAllMocks())

describe('LoginView', () => {
  test('stores the login response without refetching the session', async () => {
    vi.mocked(login).mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(authQueryKey, null)
    const pinia = createPinia()
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/login', component: LoginView },
        { path: '/register', component: { template: '<div>Register</div>' } },
        { path: '/workspaces', component: { template: '<div>Workspaces</div>' } },
      ],
    })
    await router.push('/login')
    await router.isReady()
    const wrapper = mount(LoginView, {
      global: { plugins: [pinia, [VueQueryPlugin, { queryClient }], router] },
    })

    await wrapper.get('input[type="email"]').setValue('user@example.com')
    await wrapper.get('input[type="password"]').setValue('Password!')
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/workspaces'))

    expect(vi.mocked(login).mock.calls[0]?.[0]).toEqual({
      email: 'user@example.com',
      password: 'Password!',
    })
    expect(getSession).not.toHaveBeenCalled()
    expect(queryClient.getQueryData(authQueryKey)).toEqual({
      id: 'user-1',
      email: 'user@example.com',
    })
    expect(useAuthStore(pinia).user).toEqual({ id: 'user-1', email: 'user@example.com' })
    wrapper.unmount()
  })
})

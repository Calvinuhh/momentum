import { afterEach, describe, expect, test, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createMemoryHistory, createRouter } from 'vue-router'
import { getMe } from '@/api/auth'
import { acceptInvitation, previewInvitation } from '@/api/invitations'
import { ApiError } from '@/api/client'
import AcceptInvitationView from './AcceptInvitationView.vue'

vi.mock('@/api/auth', () => ({
  getMe: vi.fn<typeof getMe>(),
}))

vi.mock('@/api/invitations', () => ({
  acceptInvitation: vi.fn<typeof acceptInvitation>(),
  previewInvitation: vi.fn<typeof previewInvitation>(),
}))

const invitationId = 'a'.repeat(24)
const invitationToken = 'A'.repeat(43)

afterEach(() => {
  sessionStorage.clear()
  vi.clearAllMocks()
})

async function mountView(target = `/invitations/accept?invitation=${invitationId}`) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/invitations/accept', component: AcceptInvitationView },
      { path: '/login', component: { template: '<div>Login</div>' } },
      { path: '/register', component: { template: '<div>Register</div>' } },
      { path: '/workspaces', component: { template: '<div>Workspaces</div>' } },
      { path: '/workspaces/:id', component: { template: '<div>Workspace</div>' } },
    ],
  })
  await router.push(target)
  await router.isReady()
  const wrapper = mount(AcceptInvitationView, {
    global: { plugins: [createPinia(), [VueQueryPlugin, { queryClient }], router] },
  })
  return { wrapper, router }
}

describe('AcceptInvitationView', () => {
  test('blocks an invitation that belongs to another account', async () => {
    vi.mocked(getMe).mockResolvedValue({ id: 'owner-1', email: 'owner@example.com' })
    vi.mocked(previewInvitation).mockRejectedValue(
      new ApiError(403, {
        error: {
          code: 'INVITATION_EMAIL_MISMATCH',
          message: 'This invitation belongs to another email',
        },
      }),
    )

    const { wrapper } = await mountView()
    await vi.waitFor(() => expect(wrapper.text()).toContain('This invitation is unavailable for this account'))

    expect(wrapper.text()).not.toContain('owner@example.com')
    expect(wrapper.text()).not.toContain('Sign in with another account')
    expect(wrapper.text()).toContain('Back to workspaces')
    expect(wrapper.text()).not.toContain('Accept invitation')
    expect(previewInvitation).toHaveBeenCalledWith({ invitationId })
    wrapper.unmount()
  })

  test('shows details and accepts by invitation ID for the recipient', async () => {
    vi.mocked(getMe).mockResolvedValue({ id: 'member-1', email: 'member@example.com' })
    vi.mocked(previewInvitation).mockResolvedValue({
      invitation: {
        workspace: { id: 'workspace-1', name: 'Development Tasks' },
        inviterEmail: 'owner@example.com',
        role: 'MEMBER',
        expiresAt: '2026-09-04T15:15:10.471Z',
        eligibility: 'accept',
      },
    })
    vi.mocked(acceptInvitation).mockResolvedValue({
      workspace: { id: 'workspace-1', name: 'Development Tasks' },
    })

    const { wrapper, router } = await mountView()
    await vi.waitFor(() => expect(wrapper.text()).toContain('owner@example.com'))
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/workspaces/workspace-1'))

    expect(acceptInvitation).toHaveBeenCalledWith({ invitationId })
    wrapper.unmount()
  })

  test('redirects an unauthenticated invitation recipient to registration without previewing details', async () => {
    const unauthorized = new ApiError(401, {
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    })
    vi.mocked(getMe).mockRejectedValue(unauthorized)
    sessionStorage.setItem('momentum:invitation', `#token=${invitationToken}`)

    const { wrapper, router } = await mountView('/invitations/accept')
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/register'))

    expect(router.currentRoute.value.query.redirect).toBe('/invitations/accept')
    expect(sessionStorage.getItem('momentum:invitation')).toBe(`#token=${invitationToken}`)
    expect(previewInvitation).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})

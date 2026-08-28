import { afterEach, describe, expect, test, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '@/api/notifications'
import NotificationBell from '../NotificationBell.vue'

vi.mock('@/api/notifications', () => ({
  listNotifications: vi.fn<typeof listNotifications>(),
  markNotificationRead: vi.fn<typeof markNotificationRead>(),
  markAllNotificationsRead: vi.fn<typeof markAllNotificationsRead>(),
}))

afterEach(() => {
  sessionStorage.clear()
  vi.clearAllMocks()
})

function mountBell() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return mount(NotificationBell, {
    props: { userId: 'user-1' },
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
      stubs: { RouterLink: RouterLinkStub },
    },
  })
}

describe('NotificationBell', () => {
  test('shows unread notifications and the summary once per tab', async () => {
    vi.mocked(listNotifications).mockResolvedValue({
      notifications: [
        {
          id: 'notification-1',
          type: 'WORKSPACE_INVITATION',
          invitationId: 'invitation-1',
          title: 'Workspace invitation',
          body: 'owner@example.com invited you to join Momentum Team.',
          readAt: null,
          createdAt: '2026-08-27T15:39:03.000Z',
        },
      ],
      unreadCount: 1,
      nextCursor: null,
    })
    vi.mocked(markAllNotificationsRead).mockResolvedValue(undefined)
    vi.mocked(markNotificationRead).mockResolvedValue(undefined)

    const wrapper = mountBell()
    await vi.waitFor(() => expect(wrapper.text()).toContain('You have 1 new notification'))

    await wrapper.get('button[aria-controls="notifications-panel"]').trigger('click')
    expect(wrapper.text()).toContain('Workspace invitation')
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toEqual({
      path: '/invitations/accept',
      query: { invitation: 'invitation-1' },
    })
    const markAllButton = wrapper.findAll('button').find((button) => button.text() === 'Mark all read')
    expect(markAllButton).toBeDefined()
    await markAllButton!.trigger('click')
    await vi.waitFor(() => expect(markAllNotificationsRead).toHaveBeenCalled())
    await wrapper.get('button[aria-label="Mark Workspace invitation as read"]').trigger('click')
    await vi.waitFor(() => expect(vi.mocked(markNotificationRead).mock.calls[0]?.[0]).toBe('notification-1'))

    wrapper.unmount()
    const remounted = mountBell()
    await vi.waitFor(() => expect(listNotifications).toHaveBeenCalled())
    expect(remounted.text()).not.toContain('You have 1 new notification')
    remounted.unmount()
  })
})

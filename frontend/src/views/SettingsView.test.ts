import { afterEach, describe, expect, test, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import SettingsView from './SettingsView.vue'

const mocks = vi.hoisted(() => ({
  getState: vi.fn<(userId: string) => Promise<string>>(),
  enable: vi.fn<(userId: string) => Promise<string>>(),
  disable: vi.fn<(userId: string) => Promise<string>>(),
}))

vi.mock('@/lib/browserNotifications', () => ({
  getBrowserNotificationState: mocks.getState,
  enableBrowserNotifications: mocks.enable,
  disableBrowserNotifications: mocks.disable,
}))

afterEach(() => {
  vi.clearAllMocks()
})

async function mountSettings(state: 'unsupported' | 'denied' | 'inactive' | 'active') {
  mocks.getState.mockResolvedValue(state)
  const pinia = createPinia()
  useAuthStore(pinia).setUser({ id: 'a'.repeat(24), email: 'member@example.com' })
  const wrapper = mount(SettingsView, { global: { plugins: [pinia] } })
  await vi.waitFor(() => expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe(String(state === 'active')))
  return wrapper
}

describe('SettingsView', () => {
  test.each([
    ['unsupported', 'Browser notifications are unavailable'],
    ['denied', 'Permission is blocked'],
    ['inactive', 'Enable notifications for this browser'],
    ['active', 'This browser can notify you'],
  ] as const)('shows the %s browser notification state', async (state, message) => {
    const wrapper = await mountSettings(state)

    expect(wrapper.text()).toContain(message)
    expect(wrapper.get('[role="switch"]').attributes('disabled')).toBe(
      state === 'unsupported' || state === 'denied' ? '' : undefined,
    )
    wrapper.unmount()
  })

  test('enables an inactive browser from the switch', async () => {
    mocks.enable.mockResolvedValue('active')
    const wrapper = await mountSettings('inactive')

    await wrapper.get('[role="switch"]').trigger('click')

    expect(mocks.enable).toHaveBeenCalledWith('a'.repeat(24))
    expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe('true')
    wrapper.unmount()
  })
})

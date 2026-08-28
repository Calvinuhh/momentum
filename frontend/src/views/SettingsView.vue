<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  disableBrowserNotifications,
  enableBrowserNotifications,
  getBrowserNotificationState,
  type BrowserNotificationState,
} from '@/lib/browserNotifications'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const state = ref<BrowserNotificationState>()
const isUpdating = ref(false)
const error = ref('')
const isActive = computed(() => state.value === 'active')
const isDisabled = computed(
  () => isUpdating.value || !state.value || state.value === 'unsupported' || state.value === 'denied',
)
const description = computed(() => {
  if (!state.value) return 'Checking browser support...'
  if (state.value === 'unsupported') return 'Browser notifications are unavailable in this browser or environment.'
  if (state.value === 'denied') return 'Permission is blocked. Enable notifications in your browser site settings.'
  if (state.value === 'active') return 'This browser can notify you when Momentum is not in the foreground.'
  return 'Enable notifications for this browser. Your in-app notifications remain available either way.'
})

watch(
  () => auth.user?.id,
  async (userId) => {
    if (!userId) {
      state.value = undefined
      return
    }
    const resolved = await getBrowserNotificationState(userId)
    if (auth.user?.id === userId) state.value = resolved
  },
  { immediate: true },
)

async function toggle() {
  const userId = auth.user?.id
  if (!userId || isDisabled.value) return
  isUpdating.value = true
  error.value = ''
  try {
    state.value = isActive.value
      ? await disableBrowserNotifications(userId)
      : await enableBrowserNotifications(userId)
  } catch {
    state.value = await getBrowserNotificationState(userId)
    error.value = 'Could not update browser notifications. Please try again.'
  } finally {
    isUpdating.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-6 py-12">
    <h1 class="text-2xl font-semibold">Settings</h1>
    <p class="mt-1 text-sm text-neutral-400">Manage preferences for this browser.</p>

    <section class="mt-8 rounded border border-neutral-800 bg-neutral-900 p-5" aria-labelledby="browser-notifications-title">
      <div class="flex items-start justify-between gap-6">
        <div>
          <h2 id="browser-notifications-title" class="font-medium">Browser notifications on this device</h2>
          <p class="mt-2 text-sm leading-6 text-neutral-400">{{ description }}</p>
        </div>
        <button
          type="button"
          role="switch"
          :aria-checked="isActive"
          :aria-label="isActive ? 'Disable browser notifications' : 'Enable browser notifications'"
          :disabled="isDisabled"
          class="relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          :class="isActive ? 'bg-brand-500' : 'bg-neutral-700'"
          @click="toggle"
        >
          <span
            class="absolute top-1 h-4 w-4 rounded-full bg-white transition-transform"
            :class="isActive ? 'translate-x-5' : 'translate-x-1'"
          />
        </button>
      </div>
      <p v-if="error" role="alert" class="mt-4 text-sm text-red-400">{{ error }}</p>
    </section>
  </div>
</template>

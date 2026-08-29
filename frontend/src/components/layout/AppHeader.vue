<script setup lang="ts">
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { logout } from '@/api/auth'
import { setSessionHint } from '@/api/client'
import NotificationBell from '@/components/notifications/NotificationBell.vue'
import { authQueryKey, removeAccountQueries } from '@/lib/queryClient'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const qc = useQueryClient()
const auth = useAuthStore()

watch(
  () => auth.user,
  (value) => {
    if (value) {
      void import('@/lib/browserNotifications')
        .then(({ startBrowserNotifications }) => startBrowserNotifications(value.id))
        .catch(() => undefined)
    }
  },
  { immediate: true },
)

const { mutate: doLogout, isPending: isLogoutPending } = useMutation({
  mutationFn: () => {
    const userId = auth.user?.id
    if (userId) {
      void import('@/lib/browserNotifications')
        .then(({ unregisterBrowserNotificationsForLogout }) =>
          unregisterBrowserNotificationsForLogout(userId),
        )
        .catch(() => undefined)
    }
    return logout()
  },
  onSettled: () => {
    if (auth.user) sessionStorage.removeItem(`momentum:notifications-summary:${auth.user.id}`)
    setSessionHint(false, false)
    qc.setQueryData(authQueryKey, null)
    removeAccountQueries(qc)
    auth.reset()
    router.push('/')
  },
})
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
      <RouterLink to="/" class="flex items-center gap-2 font-semibold tracking-tight">
        <span
          class="h-7 w-7 rounded bg-brand-500 grid place-items-center text-sm font-bold text-white"
          >M</span
        >
        <span class="hidden sm:inline">Momentum</span>
      </RouterLink>
      <nav v-if="auth.isReady" class="flex items-center gap-1 text-sm sm:gap-3">
        <template v-if="auth.isAuthed">
          <NotificationBell v-if="auth.user" :user-id="auth.user.id" />
          <RouterLink to="/workspaces" class="rounded px-3 py-1.5 hover:bg-neutral-900"
            >Workspaces</RouterLink
          >
          <RouterLink to="/settings" class="rounded px-2 py-1.5 hover:bg-neutral-900 sm:px-3"
            >Settings</RouterLink
          >
          <button
            :disabled="isLogoutPending"
            class="rounded border border-neutral-800 px-3 py-1.5 hover:bg-neutral-900 disabled:opacity-50"
            @click="doLogout()"
          >
            Log out
          </button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="rounded px-3 py-1.5 hover:bg-neutral-900"
            >Log in</RouterLink
          >
          <RouterLink
            to="/register"
            class="rounded bg-brand-600 px-4 py-1.5 text-white hover:bg-brand-700"
            >Sign up</RouterLink
          >
        </template>
      </nav>
    </div>
  </header>
</template>

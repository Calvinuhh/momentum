<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notifications'

const props = defineProps<{ userId: string }>()
const queryClient = useQueryClient()
const isOpen = ref(false)
const summary = ref('')
const queryKey = computed(() => ['notifications', props.userId] as const)
let summaryTimeout: number | undefined

const { data, isPending, isError, refetch } = useQuery({
  queryKey,
  queryFn: () => listNotifications(),
  refetchInterval: 60_000,
  refetchOnWindowFocus: true,
})

const { mutate: markRead, isPending: isMarkingRead } = useMutation({
  mutationFn: markNotificationRead,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey.value }),
})

const { mutate: markAllRead, isPending: isMarkingAll } = useMutation({
  mutationFn: markAllNotificationsRead,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey.value }),
})

const unreadCount = computed(() => data.value?.unreadCount ?? 0)
const badgeText = computed(() => (unreadCount.value > 99 ? '99+' : String(unreadCount.value)))
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function updateAppBadge(count: number) {
  const update = count > 0 ? navigator.setAppBadge?.(count) : navigator.clearAppBadge?.()
  void update?.catch(() => undefined)
}

watch(
  () => [props.userId, data.value?.unreadCount] as const,
  ([userId, count]) => {
    if (count === undefined) return
    updateAppBadge(count)
    if (count === 0) return

    const summaryKey = `momentum:notifications-summary:${userId}`
    if (sessionStorage.getItem(summaryKey)) return

    sessionStorage.setItem(summaryKey, 'shown')
    summary.value = `You have ${count} new notification${count === 1 ? '' : 's'}`
    window.clearTimeout(summaryTimeout)
    summaryTimeout = window.setTimeout(() => (summary.value = ''), 5_000)
  },
  { immediate: true },
)

onUnmounted(() => {
  window.clearTimeout(summaryTimeout)
  updateAppBadge(0)
})
</script>

<template>
  <div class="relative" @keydown.esc="isOpen = false">
    <button
      type="button"
      class="relative grid h-9 w-9 place-items-center rounded hover:bg-neutral-900"
      :aria-label="unreadCount ? `Notifications (${unreadCount} unread)` : 'Notifications'"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      aria-controls="notifications-panel"
      @click="isOpen = !isOpen"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" class="h-5 w-5 fill-none stroke-current" stroke-width="1.8">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
      <span
        v-if="unreadCount"
        class="absolute -right-1 -top-1 min-w-4 rounded-full bg-brand-500 px-1 text-[10px] font-semibold leading-4 text-white"
      >
        {{ badgeText }}
      </span>
    </button>

    <section
      v-if="isOpen"
      id="notifications-panel"
      role="dialog"
      aria-label="Recent notifications"
      class="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 shadow-2xl"
    >
      <div class="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
        <h2 class="font-semibold">Notifications</h2>
        <button
          v-if="unreadCount"
          type="button"
          :disabled="isMarkingAll"
          class="text-xs text-brand-400 hover:text-brand-300 disabled:opacity-50"
          @click="markAllRead()"
        >
          {{ isMarkingAll ? 'Marking...' : 'Mark all read' }}
        </button>
      </div>

      <p v-if="isPending" class="px-4 py-8 text-center text-sm text-neutral-400">Loading notifications...</p>
      <div v-else-if="isError" class="px-4 py-8 text-center text-sm text-red-300">
        <p>Could not load notifications.</p>
        <button type="button" class="mt-2 text-brand-400 hover:underline" @click="refetch()">Try again</button>
      </div>
      <p
        v-else-if="!data?.notifications.length"
        class="px-4 py-8 text-center text-sm text-neutral-400"
      >
        No notifications yet.
      </p>
      <ul v-else class="max-h-96 divide-y divide-neutral-800 overflow-y-auto">
        <li
          v-for="notification in data.notifications"
          :key="notification.id"
          class="px-4 py-3"
          :class="notification.readAt ? 'bg-neutral-950' : 'bg-brand-900/20'"
        >
          <div class="flex gap-3">
            <span
              class="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              :class="notification.readAt ? 'bg-neutral-700' : 'bg-brand-400'"
              aria-hidden="true"
            />
            <div class="min-w-0 flex-1">
              <p class="font-medium text-neutral-100">{{ notification.title }}</p>
              <p class="mt-1 text-xs leading-5 text-neutral-400">{{ notification.body }}</p>
              <div class="mt-2 flex items-center justify-between gap-3">
                <time :datetime="notification.createdAt" class="text-[11px] text-neutral-500">
                  {{ dateFormatter.format(new Date(notification.createdAt)) }}
                </time>
                <div class="flex shrink-0 gap-3">
                  <button
                    v-if="!notification.readAt"
                    type="button"
                    :disabled="isMarkingRead"
                    :aria-label="`Mark ${notification.title} as read`"
                    class="text-xs text-brand-400 hover:text-brand-300 disabled:opacity-50"
                    @click="markRead(notification.id)"
                  >
                    Mark read
                  </button>
                  <RouterLink
                    :to="{ path: '/invitations/accept', query: { invitation: notification.invitationId } }"
                    class="text-xs font-medium text-brand-400 hover:text-brand-300"
                    @click="!notification.readAt && markRead(notification.id)"
                  >
                    Review invitation
                  </RouterLink>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </section>

    <p
      v-if="summary"
      role="status"
      aria-live="polite"
      class="fixed bottom-6 right-6 z-50 rounded-lg border border-brand-800 bg-neutral-900 px-4 py-3 text-sm shadow-2xl"
    >
      {{ summary }}
    </p>
  </div>
</template>

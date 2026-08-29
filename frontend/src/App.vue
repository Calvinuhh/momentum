<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import AppHeader from '@/components/layout/AppHeader.vue'
import {
  hasSessionHint,
  SESSION_CLEARED_EVENT,
  SESSION_GENERATION_KEY,
  SESSION_HINT_KEY,
} from '@/api/client'
import { authQueryKey, authQueryOptions, removeAccountQueries } from '@/lib/queryClient'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const queryClient = useQueryClient()
const { data: user, status } = useQuery(authQueryOptions)

watch(
  [user, status],
  ([value, queryStatus]) => {
    if (queryStatus === 'success') auth.setUser(value ?? null)
    else if (queryStatus === 'error') auth.setError()
  },
  { immediate: true },
)

async function clearSession() {
  await queryClient.cancelQueries({ queryKey: authQueryKey })
  queryClient.setQueryData(authQueryKey, null)
  removeAccountQueries(queryClient)
  if (router.currentRoute.value.meta.requiresAuth) {
    void router.replace({
      path: '/login',
      query: { redirect: router.currentRoute.value.fullPath },
    })
  }
}

function onSessionChange(event: StorageEvent) {
  if (event.key === SESSION_HINT_KEY && event.newValue !== 'true') {
    void clearSession()
    return
  }
  if (event.key === SESSION_GENERATION_KEY && hasSessionHint()) {
    void (async () => {
      await queryClient.cancelQueries({ queryKey: authQueryKey })
      removeAccountQueries(queryClient)
      queryClient.setQueryData(authQueryKey, null)
      await queryClient.invalidateQueries({ queryKey: authQueryKey })
    })()
  }
}

onMounted(() => {
  window.addEventListener('storage', onSessionChange)
  window.addEventListener(SESSION_CLEARED_EVENT, clearSession)
})
onUnmounted(() => {
  window.removeEventListener('storage', onSessionChange)
  window.removeEventListener(SESSION_CLEARED_EVENT, clearSession)
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <main class="flex-1">
      <RouterView />
    </main>
    <footer class="border-t border-neutral-800 py-6 text-center text-sm text-neutral-500">
      Momentum — build small like a real product.
    </footer>
  </div>
</template>

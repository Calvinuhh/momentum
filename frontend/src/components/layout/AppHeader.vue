<script setup lang="ts">
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { getMe, logout } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const qc = useQueryClient()
const auth = useAuthStore()

const { data: user, isPending: isAuthPending } = useQuery({
  queryKey: ['auth', 'me'],
  queryFn: getMe,
  staleTime: 5 * 60 * 1000,
  retry: false,
})

watch(user, (value) => auth.setUser(value ?? null), { immediate: true })

const { mutate: doLogout, isPending: isLogoutPending } = useMutation({
  mutationFn: logout,
  onSettled: () => {
    auth.reset()
    qc.removeQueries({ queryKey: ['auth', 'me'] })
    qc.removeQueries({ queryKey: ['workspaces'] })
    router.push('/')
  },
})
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
      <RouterLink to="/" class="flex items-center gap-2 font-semibold tracking-tight">
        <span
          class="h-7 w-7 rounded bg-brand-500 grid place-items-center text-sm font-bold text-white"
          >M</span
        >
        Momentum
      </RouterLink>
      <nav v-if="!isAuthPending" class="flex items-center gap-3 text-sm">
        <template v-if="auth.isAuthed">
          <RouterLink to="/workspaces" class="rounded px-3 py-1.5 hover:bg-neutral-900"
            >Workspaces</RouterLink
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

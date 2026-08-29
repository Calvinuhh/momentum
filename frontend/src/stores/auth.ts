import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type AuthUser = { id: string; email: string }
export type AuthStatus = 'unknown' | 'anonymous' | 'authenticated' | 'error'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const status = ref<AuthStatus>('unknown')
  const isAuthed = computed(() => !!user.value)
  const isReady = computed(() => status.value !== 'unknown')

  function setUser(u: AuthUser | null) {
    user.value = u
    status.value = u ? 'authenticated' : 'anonymous'
  }

  function reset() {
    setUser(null)
  }

  function setError() {
    user.value = null
    status.value = 'error'
  }

  return { user, status, isAuthed, isReady, setUser, reset, setError }
})

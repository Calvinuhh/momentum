import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type AuthUser = { id: string; email: string }

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const isAuthed = computed(() => !!user.value)

  function setUser(u: AuthUser | null) {
    user.value = u
  }

  function reset() {
    user.value = null
  }

  return { user, isAuthed, setUser, reset }
})

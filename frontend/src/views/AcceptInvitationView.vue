<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { acceptInvitation, claimInvitation } from '@/api/invitations'
import { getMe } from '@/api/auth'
import { ApiError } from '@/api/client'
import { claimInvitationSchema } from '@/schemas/invitation'
import { useFormErrors } from '@/composables/useFormErrors'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const auth = useAuthStore()
const invitationHashKey = 'momentum:invitation'
const invitationHash = ref(sessionStorage.getItem(invitationHashKey) ?? '')
const hash = computed(() => new URLSearchParams(invitationHash.value.slice(1)))
const token = computed(() => hash.value.get('token') ?? '')
const mode = computed(() => (hash.value.get('mode') === 'accept' ? 'accept' : 'claim'))
const tokenIsValid = computed(() => /^[A-Za-z0-9_-]{43}$/.test(token.value))
const form = reactive({ password: '' })
const showPassword = ref(false)
const { errors, serverError, clear, applyZod, applyApi } = useFormErrors()

const { data: user, isPending: isAuthPending, error: authError } = useQuery({
  queryKey: ['auth', 'me'],
  queryFn: getMe,
  retry: false,
})
const isGuest = computed(() => authError.value instanceof ApiError && authError.value.status === 401)
const loginTarget = { path: '/login', query: { redirect: '/invitations/accept' } }

watch(
  () => route.hash,
  (value) => {
    if (!value) return
    invitationHash.value = value
    sessionStorage.setItem(invitationHashKey, value)
    clear()
    form.password = ''
    window.history.replaceState(window.history.state, '', route.path)
  },
  { immediate: true },
)

const clearInvitationToken = () => sessionStorage.removeItem(invitationHashKey)

const { mutate: accept, isPending: isAcceptPending } = useMutation({
  mutationFn: () => acceptInvitation(token.value),
  onSuccess: async ({ workspace }) => {
    clearInvitationToken()
    await queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    router.push(`/workspaces/${workspace.id}`)
  },
  onError: applyApi,
})

const { mutate: claim, isPending: isClaimPending } = useMutation({
  mutationFn: claimInvitation,
  onSuccess: async ({ user: claimedUser, workspace }) => {
    clearInvitationToken()
    auth.setUser(claimedUser)
    queryClient.setQueryData(['auth', 'me'], claimedUser)
    await queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    router.push(`/workspaces/${workspace.id}`)
  },
  onError: applyApi,
})

function onClaim() {
  clear()
  const parsed = claimInvitationSchema.safeParse({ token: token.value, password: form.password })
  if (!parsed.success) {
    applyZod(parsed.error)
    return
  }
  claim(parsed.data)
}
</script>

<template>
  <div class="mx-auto max-w-md px-6 py-12">
    <h1 class="text-2xl font-semibold">Join a workspace</h1>

    <p v-if="!tokenIsValid" class="mt-4 rounded bg-red-950/50 px-3 py-2 text-sm text-red-300">
      This invitation link is invalid.
    </p>

    <template v-else>
      <p class="mt-1 text-sm text-neutral-400">
        {{ mode === 'claim' ? 'Create your password to join Momentum.' : 'Accept your workspace invitation.' }}
      </p>

      <p v-if="serverError" class="mt-4 rounded bg-red-950/50 px-3 py-2 text-sm text-red-300">
        {{ serverError }}
      </p>

      <p v-if="isAuthPending" class="mt-6 text-sm text-neutral-400">Checking your session...</p>

      <div v-else-if="user" class="mt-6">
        <p class="text-sm text-neutral-300">Signed in as {{ user.email }}</p>
        <button
          type="button"
          :disabled="isAcceptPending"
          class="mt-4 w-full rounded bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          @click="accept()"
        >
          {{ isAcceptPending ? 'Accepting...' : 'Accept invitation' }}
        </button>
      </div>

      <form v-else-if="isGuest && mode === 'claim'" class="mt-6 space-y-4" @submit.prevent="onClaim">
        <div>
          <label for="invitation-password" class="text-sm text-neutral-300">Create a password</label>
          <div class="relative">
            <input
              id="invitation-password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              class="mt-1 w-full rounded border bg-neutral-900 px-3 py-2 pr-16 text-sm outline-none focus:border-brand-600"
              :class="errors.password ? 'border-red-800' : 'border-neutral-800'"
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-neutral-400 hover:text-white"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              :aria-pressed="showPassword"
              aria-controls="invitation-password"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
          <p v-if="errors.password" class="mt-1 text-xs text-red-400">{{ errors.password }}</p>
          <p class="mt-1 text-xs text-neutral-500">
            Use 8-128 characters, including an uppercase letter, a lowercase letter, and a symbol.
          </p>
        </div>
        <button
          type="submit"
          :disabled="isClaimPending"
          class="w-full rounded bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {{ isClaimPending ? 'Joining...' : 'Create account and join' }}
        </button>
        <p class="text-center text-sm text-neutral-400">
          Already have an account?
          <RouterLink :to="loginTarget" class="text-brand-400 hover:underline">Log in</RouterLink>
        </p>
      </form>

      <div v-else-if="isGuest" class="mt-6">
        <RouterLink
          :to="loginTarget"
          class="block w-full rounded bg-brand-600 py-2.5 text-center text-sm font-medium text-white hover:bg-brand-700"
        >
          Log in to accept
        </RouterLink>
      </div>

      <p v-else class="mt-6 rounded bg-red-950/50 px-3 py-2 text-sm text-red-300">
        Could not check your session. Please try again.
      </p>
    </template>
  </div>
</template>

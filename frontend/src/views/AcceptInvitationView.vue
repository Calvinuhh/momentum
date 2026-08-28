<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { acceptInvitation, previewInvitation, type InvitationReference } from '@/api/invitations'
import { getMe } from '@/api/auth'
import { ApiError } from '@/api/client'
import { useFormErrors } from '@/composables/useFormErrors'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const auth = useAuthStore()
const invitationHashKey = 'momentum:invitation'
const invitationHash = ref(sessionStorage.getItem(invitationHashKey) ?? '')
const emailPreviewKey = ref(crypto.randomUUID())
const isRedirecting = ref(false)
const token = computed(() => new URLSearchParams(invitationHash.value.slice(1)).get('token') ?? '')
const invitationId = computed(() =>
  typeof route.query.invitation === 'string' ? route.query.invitation : '',
)
const reference = computed<InvitationReference | undefined>(() => {
  if (/^[a-z0-9]{24}$/.test(invitationId.value)) return { invitationId: invitationId.value }
  if (/^[A-Za-z0-9_-]{43}$/.test(token.value)) return { token: token.value }
  return undefined
})
const { serverError, clear, applyApi } = useFormErrors()

const { data: user, isPending: isAuthPending, error: authError } = useQuery({
  queryKey: ['auth', 'me'],
  queryFn: getMe,
  retry: false,
})
const isGuest = computed(() => authError.value instanceof ApiError && authError.value.status === 401)
const registerTarget = computed(() => ({
  path: '/register',
  query: { redirect: invitationId.value ? route.fullPath : '/invitations/accept' },
}))

watch(
  () => route.hash,
  (value) => {
    if (!value) return
    invitationHash.value = value
    emailPreviewKey.value = crypto.randomUUID()
    sessionStorage.setItem(invitationHashKey, value)
    clear()
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
  },
  { immediate: true },
)

watch(
  invitationId,
  (value) => {
    if (!value) return
    invitationHash.value = ''
    sessionStorage.removeItem(invitationHashKey)
  },
  { immediate: true },
)

const {
  data: previewData,
  isPending: isPreviewPending,
  error: previewError,
} = useQuery({
  queryKey: computed(() => [
    'invitations',
    'preview',
    invitationId.value || emailPreviewKey.value,
    user.value?.id ?? 'guest',
  ]),
  queryFn: () => previewInvitation(reference.value!),
  enabled: computed(() => !!reference.value && !!user.value && !isAuthPending.value),
  retry: false,
})

const invitation = computed(() => previewData.value?.invitation)
const isEmailMismatch = computed(
  () => previewError.value instanceof ApiError && previewError.value.code === 'INVITATION_EMAIL_MISMATCH',
)
const isPreviewUnauthorized = computed(
  () => previewError.value instanceof ApiError && previewError.value.status === 401,
)

watch(
  [isGuest, isPreviewUnauthorized, reference],
  ([guest, unauthorized, invitationReference]) => {
    if (isRedirecting.value || !(invitationReference && (guest || unauthorized))) return
    isRedirecting.value = true
    if (unauthorized) {
      auth.reset()
      queryClient.removeQueries({ queryKey: ['auth', 'me'] })
    }
    void router.replace(registerTarget.value)
  },
  { immediate: true },
)

const { mutate: accept, isPending: isAcceptPending } = useMutation({
  mutationFn: () => acceptInvitation(reference.value!),
  onSuccess: async ({ workspace }) => {
    sessionStorage.removeItem(invitationHashKey)
    await queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    await queryClient.invalidateQueries({ queryKey: ['notifications'] })
    router.push(`/workspaces/${workspace.id}`)
  },
  onError: applyApi,
})
</script>

<template>
  <div class="mx-auto max-w-md px-6 py-12">
    <h1 class="text-2xl font-semibold">Join a workspace</h1>

    <p v-if="!reference" class="mt-4 rounded bg-red-950/50 px-3 py-2 text-sm text-red-300">
      This invitation link is invalid.
    </p>

    <p v-else-if="isRedirecting || isGuest || isPreviewUnauthorized" class="mt-6 text-sm text-neutral-400">
      Redirecting to registration...
    </p>

    <p v-else-if="isAuthPending || (user && isPreviewPending)" class="mt-6 text-sm text-neutral-400">
      Checking your invitation...
    </p>

    <div v-else-if="isEmailMismatch" class="mt-6">
      <div class="rounded border border-red-900 bg-red-950/40 p-4">
        <h2 class="font-semibold text-red-200">This invitation is unavailable for this account</h2>
        <p class="mt-2 text-sm text-red-300">Return to your workspaces to continue.</p>
      </div>
      <RouterLink to="/workspaces" class="mt-3 block text-center text-sm text-neutral-400 hover:text-white">
        Back to workspaces
      </RouterLink>
    </div>

    <p
      v-else-if="previewError || (!user && !isGuest)"
      class="mt-4 rounded bg-red-950/50 px-3 py-2 text-sm text-red-300"
    >
      {{ previewError instanceof ApiError ? previewError.message : 'Could not check your invitation. Please try again.' }}
    </p>

    <template v-else-if="invitation">
      <p class="mt-1 text-sm text-neutral-400">Invitation to {{ invitation.workspace.name }}</p>
      <div class="mt-6 rounded border border-neutral-800 bg-neutral-900 p-4">
        <p class="text-sm text-neutral-200">
          <strong>{{ invitation.inviterEmail }}</strong> invited you to join
          <strong>{{ invitation.workspace.name }}</strong> as a {{ invitation.role.toLowerCase() }}.
        </p>
        <p class="mt-2 text-xs text-neutral-500">
          Expires {{ new Date(invitation.expiresAt).toLocaleString() }}
        </p>
      </div>

      <p v-if="serverError" class="mt-4 rounded bg-red-950/50 px-3 py-2 text-sm text-red-300">
        {{ serverError }}
      </p>

      <div v-if="user && invitation.eligibility === 'accept'" class="mt-6">
        <p class="text-sm text-neutral-300">Signed in as {{ user.email }}</p>
        <button
          type="button"
          :disabled="isAcceptPending"
          class="mt-4 w-full rounded bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          @click="clear(); accept()"
        >
          {{ isAcceptPending ? 'Accepting...' : 'Accept invitation' }}
        </button>
      </div>

      <div v-else-if="user && invitation.eligibility === 'accepted'" class="mt-6">
        <p class="text-sm text-neutral-300">You have already joined this workspace.</p>
        <RouterLink
          :to="`/workspaces/${invitation.workspace.id}`"
          class="mt-4 block w-full rounded bg-brand-600 py-2.5 text-center text-sm font-medium text-white hover:bg-brand-700"
        >
          Open workspace
        </RouterLink>
      </div>
    </template>
  </div>
</template>

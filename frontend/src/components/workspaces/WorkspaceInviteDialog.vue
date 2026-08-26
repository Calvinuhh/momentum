<script setup lang="ts">
import { reactive } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { createWorkspaceInvitation } from '@/api/invitations'
import { createInvitationSchema } from '@/schemas/invitation'
import { useFormErrors } from '@/composables/useFormErrors'

const props = defineProps<{ workspaceId: string }>()
const emit = defineEmits<{ close: []; invited: [] }>()
const form = reactive<{ email: string; role: 'ADMIN' | 'MEMBER' }>({ email: '', role: 'MEMBER' })
const { errors, serverError, clear, applyZod, applyApi } = useFormErrors()

const { mutate, isPending } = useMutation({
  mutationFn: (data: { email: string; role: 'ADMIN' | 'MEMBER' }) =>
    createWorkspaceInvitation(props.workspaceId, data),
  onSuccess: () => emit('invited'),
  onError: (error: unknown) =>
    applyApi(error, { USER_ALREADY_MEMBER: 'email', INVITATION_ALREADY_PENDING: 'email' }),
})

function onSubmit() {
  clear()
  const parsed = createInvitationSchema.safeParse(form)
  if (!parsed.success) {
    applyZod(parsed.error)
    return
  }
  mutate(parsed.data)
}
</script>

<template>
  <div class="fixed inset-0 z-50 grid place-items-center bg-black/60 p-6" @click.self="emit('close')">
    <div class="w-full max-w-md rounded border border-neutral-800 bg-neutral-900 p-6">
      <h2 class="font-semibold">Invite a member</h2>
      <p class="mt-1 text-sm text-neutral-400">They will receive an email valid for 7 days.</p>

      <p v-if="serverError" class="mt-3 rounded bg-red-950/50 px-3 py-2 text-sm text-red-300">
        {{ serverError }}
      </p>

      <form class="mt-4 space-y-3" @submit.prevent="onSubmit">
        <div>
          <label for="invitation-email" class="text-sm text-neutral-300">Email</label>
          <input
            id="invitation-email"
            v-model.trim="form.email"
            type="email"
            autocomplete="email"
            class="mt-1 w-full rounded border bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-brand-600"
            :class="errors.email ? 'border-red-800' : 'border-neutral-800'"
          />
          <p v-if="errors.email" class="mt-1 text-xs text-red-400">{{ errors.email }}</p>
        </div>
        <div>
          <label for="invitation-role" class="text-sm text-neutral-300">Role</label>
          <select
            id="invitation-role"
            v-model="form.role"
            class="mt-1 w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-brand-600"
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="rounded border border-neutral-800 px-4 py-2 text-sm hover:bg-neutral-800"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isPending"
            class="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {{ isPending ? 'Sending...' : 'Send invitation' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

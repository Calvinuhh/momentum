<script setup lang="ts">
import { reactive } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { createWorkspaceSchema } from '@/schemas/workspace'
import { createWorkspace } from '@/api/workspaces'
import { useFormErrors } from '@/composables/useFormErrors'

const emit = defineEmits<{ (e: 'close'): void }>()
const form = reactive({ name: '', description: '' })
const { errors, serverError, clear, applyZod, applyApi } = useFormErrors()
const qc = useQueryClient()

const { mutate, isPending } = useMutation({
  mutationFn: (data: { name: string; description: string | null }) => createWorkspace(data),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['workspaces'] })
    emit('close')
  },
  onError: (e: unknown) => {
    applyApi(e)
  },
})

function onSubmit() {
  clear()
  const parsed = createWorkspaceSchema.safeParse({ name: form.name, description: form.description })
  if (!parsed.success) {
    applyZod(parsed.error)
    return
  }
  mutate({ name: parsed.data.name, description: parsed.data.description })
}
</script>

<template>
  <div class="fixed inset-0 z-50 grid place-items-center bg-black/60 p-6" @click.self="emit('close')">
    <div class="w-full max-w-md rounded border border-neutral-800 bg-neutral-900 p-6">
      <h2 class="font-semibold">Create workspace</h2>
      <p class="mt-1 text-sm text-neutral-400">Workspaces isolate your goals and tasks.</p>

      <p v-if="serverError" class="mt-3 rounded bg-red-950/50 px-3 py-2 text-sm text-red-300">{{ serverError }}</p>

      <form class="mt-4 space-y-3" @submit.prevent="onSubmit">
        <div>
          <label class="text-sm text-neutral-300">Name</label>
          <input
            v-model.trim="form.name"
            class="mt-1 w-full rounded border bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-brand-600"
            :class="errors.name ? 'border-red-800' : 'border-neutral-800'"
            placeholder="e.g. Acme Inc."
          />
          <p v-if="errors.name" class="mt-1 text-xs text-red-400">{{ errors.name }}</p>
        </div>
        <div>
          <label class="text-sm text-neutral-300">Description <span class="text-neutral-500">(optional)</span></label>
          <textarea
            v-model="form.description"
            rows="3"
            class="mt-1 w-full rounded border bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-brand-600"
            :class="errors.description ? 'border-red-800' : 'border-neutral-800'"
            placeholder="What is this workspace for?"
          />
          <p v-if="errors.description" class="mt-1 text-xs text-red-400">{{ errors.description }}</p>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="rounded border border-neutral-800 px-4 py-2 text-sm hover:bg-neutral-800" @click="emit('close')">
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isPending"
            class="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {{ isPending ? 'Creating...' : 'Create' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

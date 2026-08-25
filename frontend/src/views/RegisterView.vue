<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation } from '@tanstack/vue-query'
import { registerSchema } from '@/schemas/auth'
import { register } from '@/api/auth'
import { useFormErrors } from '@/composables/useFormErrors'

const router = useRouter()
const form = reactive({ email: '', password: '' })
const { errors, serverError, clear, applyZod, applyApi } = useFormErrors()

const { mutate, isPending } = useMutation({
  mutationFn: register,
  onSuccess: () => router.push('/login'),
  onError: (e: unknown) => {
    applyApi(e, { EMAIL_ALREADY_REGISTERED: 'email' })
  },
})

function onSubmit() {
  clear()
  const parsed = registerSchema.safeParse(form)
  if (!parsed.success) {
    applyZod(parsed.error)
    return
  }
  mutate(parsed.data)
}
</script>

<template>
  <div class="mx-auto max-w-md px-6 py-12">
    <h1 class="text-2xl font-semibold">Create your account</h1>
    <p class="mt-1 text-sm text-neutral-400">Join Momentum — start shipping.</p>

    <p v-if="serverError" class="mt-4 rounded bg-red-950/50 px-3 py-2 text-sm text-red-300">{{ serverError }}</p>

    <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
      <div>
        <label class="text-sm text-neutral-300">Email</label>
        <input
          v-model.trim="form.email"
          type="email"
          autocomplete="email"
          class="mt-1 w-full rounded border bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-brand-600"
          :class="errors.email ? 'border-red-800' : 'border-neutral-800'"
        />
        <p v-if="errors.email" class="mt-1 text-xs text-red-400">{{ errors.email }}</p>
      </div>
      <div>
        <label class="text-sm text-neutral-300">Password</label>
        <input
          v-model="form.password"
          type="password"
          autocomplete="new-password"
          class="mt-1 w-full rounded border bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-brand-600"
          :class="errors.password ? 'border-red-800' : 'border-neutral-800'"
        />
        <p v-if="errors.password" class="mt-1 text-xs text-red-400">{{ errors.password }}</p>
        <p class="mt-1 text-xs text-neutral-500">8-128 printable ASCII, lower + upper + special char.</p>
      </div>
      <button
        type="submit"
        :disabled="isPending"
        class="w-full rounded bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {{ isPending ? 'Creating...' : 'Create account' }}
      </button>
    </form>

    <p class="mt-4 text-center text-sm text-neutral-400">
      Already have an account?
      <RouterLink to="/login" class="text-brand-400 hover:underline">Log in</RouterLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMutation } from '@tanstack/vue-query'
import { verifyEmail } from '@/api/auth'
import { verifyEmailSchema } from '@/schemas/auth'
import { useFormErrors } from '@/composables/useFormErrors'

const route = useRoute()
const router = useRouter()
const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
const loginTarget = redirect ? { path: '/login', query: { redirect } } : '/login'
const form = reactive({ email: typeof route.query.email === 'string' ? route.query.email : '', code: '' })
const { errors, serverError, clear, applyZod, applyApi } = useFormErrors()

const { mutate, isPending } = useMutation({
  mutationFn: verifyEmail,
  onSuccess: () =>
    router.push({
      path: '/login',
      query: { email: form.email, verified: '1', ...(redirect ? { redirect } : {}) },
    }),
  onError: applyApi,
})

function onSubmit() {
  clear()
  const parsed = verifyEmailSchema.safeParse(form)
  if (!parsed.success) {
    applyZod(parsed.error)
    return
  }
  mutate(parsed.data)
}
</script>

<template>
  <div class="mx-auto max-w-md px-6 py-12">
    <h1 class="text-2xl font-semibold">Confirm your account</h1>
    <p class="mt-1 text-sm text-neutral-400">Enter the code we sent to your email.</p>

    <p v-if="serverError" class="mt-4 rounded bg-red-950/50 px-3 py-2 text-sm text-red-300">
      {{ serverError }}
    </p>

    <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
      <div>
        <label for="confirm-email" class="text-sm text-neutral-300">Email</label>
        <input
          id="confirm-email"
          v-model.trim="form.email"
          type="email"
          autocomplete="email"
          class="mt-1 w-full rounded border bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-brand-600"
          :class="errors.email ? 'border-red-800' : 'border-neutral-800'"
        />
        <p v-if="errors.email" class="mt-1 text-xs text-red-400">{{ errors.email }}</p>
      </div>
      <div>
        <label for="verification-code" class="text-sm text-neutral-300">Verification code</label>
        <input
          id="verification-code"
          v-model.trim="form.code"
          type="text"
          inputmode="text"
          autocomplete="one-time-code"
          maxlength="6"
          class="mt-1 w-full rounded border bg-neutral-900 px-3 py-2 text-sm tracking-[0.35em] outline-none focus:border-brand-600"
          :class="errors.code ? 'border-red-800' : 'border-neutral-800'"
        />
        <p v-if="errors.code" class="mt-1 text-xs text-red-400">{{ errors.code }}</p>
      </div>
      <button
        type="submit"
        :disabled="isPending"
        class="w-full rounded bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {{ isPending ? 'Confirming...' : 'Confirm account' }}
      </button>
    </form>

    <p class="mt-4 text-center text-sm text-neutral-400">
      Already confirmed?
      <RouterLink :to="loginTarget" class="text-brand-400 hover:underline">Log in</RouterLink>
    </p>
  </div>
</template>

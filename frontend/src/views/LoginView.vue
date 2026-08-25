<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { loginSchema } from '@/schemas/auth'
import { login } from '@/api/auth'
import { useFormErrors } from '@/composables/useFormErrors'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const qc = useQueryClient()
const auth = useAuthStore()
const form = reactive({ email: '', password: '' })
const showPassword = ref(false)
const { errors, serverError, clear, applyZod, applyApi } = useFormErrors()

const { mutate, isPending } = useMutation({
  mutationFn: login,
  onSuccess: async (data) => {
    auth.setUser(data.user)
    await qc.invalidateQueries({ queryKey: ['auth', 'me'] })
    await qc.invalidateQueries({ queryKey: ['workspaces'] })
    const redirect = (route.query.redirect as string) || '/workspaces'
    router.push(redirect)
  },
  onError: applyApi,
})

function onSubmit() {
  clear()
  const parsed = loginSchema.safeParse(form)
  if (!parsed.success) {
    applyZod(parsed.error)
    return
  }
  mutate(parsed.data)
}
</script>

<template>
  <div class="mx-auto max-w-md px-6 py-12">
    <h1 class="text-2xl font-semibold">Welcome back</h1>
    <p class="mt-1 text-sm text-neutral-400">Log in to Momentum.</p>

    <p v-if="serverError" class="mt-4 rounded bg-red-950/50 px-3 py-2 text-sm text-red-300">
      {{ serverError }}
    </p>

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
        <div class="relative">
          <input
            id="login-password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            class="mt-1 w-full rounded border bg-neutral-900 px-3 py-2 pr-16 text-sm outline-none focus:border-brand-600"
            :class="errors.password ? 'border-red-800' : 'border-neutral-800'"
          />
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-neutral-400 hover:text-white"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            :aria-pressed="showPassword"
            aria-controls="login-password"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? 'Hide' : 'Show' }}
          </button>
        </div>
        <p v-if="errors.password" class="mt-1 text-xs text-red-400">{{ errors.password }}</p>
      </div>
      <button
        type="submit"
        :disabled="isPending"
        class="w-full rounded bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {{ isPending ? 'Signing in...' : 'Log in' }}
      </button>
    </form>

    <p class="mt-4 text-center text-sm text-neutral-400">
      No account yet?
      <RouterLink to="/register" class="text-brand-400 hover:underline">Sign up</RouterLink>
    </p>
  </div>
</template>

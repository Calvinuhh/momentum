<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div>
    <section class="mx-auto max-w-6xl px-6 py-20">
      <div class="max-w-2xl">
        <p class="mb-3 text-sm font-medium tracking-widest text-brand-400">MOMENTUM</p>
        <h1 class="text-4xl font-bold tracking-tight sm:text-5xl">
          Collaborative goals and tasks,<br />
          <span class="text-brand-400">built small like a real product.</span>
        </h1>
        <p class="mt-4 max-w-xl text-neutral-400">
          Create workspaces, set goals, assign tasks and keep your team aligned — without bloat.
        </p>
        <div v-if="auth.isReady" class="mt-8 flex gap-3">
          <template v-if="auth.isAuthed">
            <RouterLink
              to="/workspaces"
              class="rounded bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Open workspaces
            </RouterLink>
          </template>
          <template v-else>
            <RouterLink
              to="/register"
              class="rounded bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Get started
            </RouterLink>
            <RouterLink
              to="/login"
              class="rounded border border-neutral-800 px-6 py-2.5 text-sm hover:bg-neutral-900"
            >
              Log in
            </RouterLink>
          </template>
        </div>
        <ul class="mt-10 grid grid-cols-1 gap-3 text-sm text-neutral-400 sm:grid-cols-3">
          <li class="rounded border border-neutral-800 bg-neutral-900/40 p-4">
            Workspaces as isolation boundary
          </li>
          <li class="rounded border border-neutral-800 bg-neutral-900/40 p-4">
            Goals → Tasks → Subtasks
          </li>
          <li class="rounded border border-neutral-800 bg-neutral-900/40 p-4">
            Roles OWNER / ADMIN / MEMBER
          </li>
        </ul>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-6 pb-16">
      <div class="rounded border border-neutral-800 bg-neutral-900/30 p-6">
        <h2 class="font-semibold">How it works</h2>
        <ol class="mt-3 grid gap-4 text-sm text-neutral-400 sm:grid-cols-3">
          <li><span class="text-white">1. Create a workspace</span> — your team’s home base.</li>
          <li><span class="text-white">2. Set goals & tasks</span> — assign, prioritize, track.</li>
          <li><span class="text-white">3. Ship</span> — keep momentum, not noise.</li>
        </ol>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { listWorkspaces } from '@/api/workspaces'
import WorkspaceCreateDialog from '@/components/workspaces/WorkspaceCreateDialog.vue'

const showCreate = ref(false)
const activeTab = ref<'overview' | 'goals' | 'tasks' | 'members' | 'settings'>('overview')

const { data, isPending, isError, error } = useQuery({
  queryKey: ['workspaces'],
  queryFn: () => listWorkspaces().then((r) => r.workspaces),
})

const mockStats = [
  { label: 'Goals', value: '—' },
  { label: 'Tasks', value: '—' },
  { label: 'Members', value: '—' },
]
</script>

<template>
  <div class="mx-auto max-w-6xl px-6 py-8">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Workspaces</h1>
      <button class="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700" @click="showCreate = true">
        New workspace
      </button>
    </div>

    <div v-if="isPending" class="mt-6 text-sm text-neutral-400">Loading workspaces...</div>
    <div v-else-if="isError" class="mt-6 rounded bg-red-950/40 px-4 py-3 text-sm text-red-300">
      {{ (error as Error).message }}
    </div>

    <div v-else-if="!data || data.length === 0" class="mt-8 rounded border border-dashed border-neutral-800 p-10 text-center">
      <h2 class="font-medium">Create your first workspace</h2>
      <p class="mt-1 text-sm text-neutral-400">Workspaces keep your goals and tasks isolated per team.</p>
      <button class="mt-4 rounded bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700" @click="showCreate = true">
        Create workspace
      </button>
    </div>

    <div v-else class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="ws in data"
        :key="ws.id"
        :to="`/workspaces/${ws.id}`"
        class="rounded border border-neutral-800 bg-neutral-900/40 p-4 hover:bg-neutral-900"
      >
        <h3 class="font-medium">{{ ws.name }}</h3>
        <p class="mt-1 line-clamp-2 text-sm text-neutral-400">{{ ws.description || 'No description' }}</p>
        <p class="mt-3 text-xs text-neutral-500">ID {{ ws.id.slice(0, 8) }} · Owner {{ ws.ownerId.slice(0, 8) }}</p>
      </RouterLink>
    </div>

    <div v-if="data && data.length > 0" class="mt-10">
      <div class="flex gap-2 border-b border-neutral-800">
        <button
          v-for="tab in (['overview','goals','tasks','members','settings'] as const)"
          :key="tab"
          class="px-3 py-2 text-sm capitalize"
          :class="activeTab === tab ? 'border-b-2 border-brand-500 text-white' : 'text-neutral-400 hover:text-white'"
          @click="activeTab = tab"
        >
          {{ tab }}
        </button>
      </div>
      <div class="mt-6 rounded border border-neutral-800 bg-neutral-900/30 p-6 text-sm text-neutral-400">
        <div v-if="activeTab === 'overview'" class="grid gap-4 sm:grid-cols-3">
          <div v-for="s in mockStats" :key="s.label" class="rounded bg-neutral-950 p-4">
            <p class="text-xs text-neutral-500">{{ s.label }}</p>
            <p class="mt-1 text-lg font-semibold text-white">{{ s.value }}</p>
            <p class="text-xs">Placeholder — coming next</p>
          </div>
        </div>
        <p v-else>Placeholder for {{ activeTab }} — coming in next phases.</p>
      </div>
    </div>

    <WorkspaceCreateDialog v-if="showCreate" @close="showCreate = false" />
  </div>
</template>

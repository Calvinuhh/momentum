<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { getWorkspace } from '@/api/workspaces'
import WorkspaceInviteDialog from '@/components/workspaces/WorkspaceInviteDialog.vue'

const route = useRoute()
const id = route.params.id as string
const showInviteDialog = ref(false)
const invitationSent = ref(false)

const { data, isPending, isError, error } = useQuery({
  queryKey: ['workspace', id],
  queryFn: () => getWorkspace(id).then((r) => r.workspace),
})

function onInvited() {
  showInviteDialog.value = false
  invitationSent.value = true
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-6 py-8">
    <RouterLink to="/workspaces" class="text-sm text-neutral-400 hover:text-white">← Back to workspaces</RouterLink>

    <div v-if="isPending" class="mt-4 text-sm text-neutral-400">Loading workspace...</div>
    <div v-else-if="isError" class="mt-4 rounded bg-red-950/40 px-4 py-3 text-sm text-red-300">{{ (error as Error).message }}</div>

    <div v-else-if="data" class="mt-4">
      <h1 class="text-2xl font-semibold">{{ data.name }}</h1>
      <p class="mt-1 text-sm text-neutral-400">{{ data.description || 'No description' }}</p>
      <p class="mt-2 text-xs text-neutral-500">Role: {{ data.role }} · ID {{ data.id }}</p>
      <p v-if="invitationSent" class="mt-4 rounded bg-green-950/50 px-3 py-2 text-sm text-green-300">
        Invitation sent.
      </p>

      <div class="mt-8 grid gap-4 sm:grid-cols-2">
        <div class="rounded border border-neutral-800 bg-neutral-900/40 p-4">
          <h3 class="font-medium">Goals</h3>
          <p class="mt-1 text-sm text-neutral-400">Placeholder — goals will live here.</p>
        </div>
        <div class="rounded border border-neutral-800 bg-neutral-900/40 p-4">
          <h3 class="font-medium">Tasks</h3>
          <p class="mt-1 text-sm text-neutral-400">Placeholder — tasks will live here.</p>
        </div>
        <div class="rounded border border-neutral-800 bg-neutral-900/40 p-4">
          <h3 class="font-medium">Members</h3>
          <p class="mt-1 text-sm text-neutral-400">Invite teammates as members or admins.</p>
          <button
            v-if="data.role === 'OWNER' || data.role === 'ADMIN'"
            type="button"
            class="mt-3 rounded bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
            @click="showInviteDialog = true"
          >
            Invite member
          </button>
        </div>
        <div class="rounded border border-neutral-800 bg-neutral-900/40 p-4">
          <h3 class="font-medium">Settings</h3>
          <p class="mt-1 text-sm text-neutral-400">Placeholder — rename / trash (Phase 2).</p>
        </div>
      </div>
    </div>

    <WorkspaceInviteDialog
      v-if="showInviteDialog"
      :workspace-id="id"
      @close="showInviteDialog = false"
      @invited="onInvited"
    />
  </div>
</template>

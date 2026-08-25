import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

export const useWorkspaceStore = defineStore('workspace', () => {
  const selectedId = ref<string | null>(localStorage.getItem('momentum:workspaceId'))

  watch(selectedId, (v) => (v ? localStorage.setItem('momentum:workspaceId', v) : localStorage.removeItem('momentum:workspaceId')))

  function select(id: string | null) {
    selectedId.value = id
  }

  return { selectedId, select }
})

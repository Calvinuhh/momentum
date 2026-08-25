import { apiFetch } from './client'

export type Workspace = {
  id: string
  name: string
  description: string | null
  ownerId: string
  createdAt: string
  updatedAt: string
  role?: string
}

export function listWorkspaces() {
  return apiFetch<{ workspaces: Workspace[] }>('/api/v1/workspaces')
}

export function getWorkspace(id: string) {
  return apiFetch<{ workspace: Workspace }>(`/api/v1/workspaces/${id}`)
}

export function createWorkspace(data: { name: string; description?: string | null }) {
  return apiFetch<{ workspace: Workspace }>('/api/v1/workspaces', {
    method: 'POST',
    body: JSON.stringify({ name: data.name, description: data.description ?? null }),
  })
}

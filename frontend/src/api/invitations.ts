import { apiFetch } from './client'
import type { User } from './auth'

export type Invitation = {
  id: string
  email: string
  role: 'ADMIN' | 'MEMBER'
  expiresAt: string
  createdAt: string
}

type InvitationWorkspace = { id: string; name: string }

export function createWorkspaceInvitation(
  workspaceId: string,
  data: { email: string; role: 'ADMIN' | 'MEMBER' },
) {
  return apiFetch<{ invitation: Invitation }>(`/api/v1/workspaces/${workspaceId}/invitations`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function acceptInvitation(token: string) {
  return apiFetch<{ workspace: InvitationWorkspace }>('/api/v1/invitations/accept', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

export function claimInvitation(data: { token: string; password: string }) {
  return apiFetch<{ user: User; workspace: InvitationWorkspace }>('/api/v1/invitations/claim', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

import { apiFetch } from './client'

export type Invitation = {
  id: string
  email: string
  role: 'ADMIN' | 'MEMBER'
  expiresAt: string
  createdAt: string
}

type InvitationWorkspace = { id: string; name: string }

export type InvitationReference = { token: string } | { invitationId: string }

export type InvitationPreview = {
  workspace: InvitationWorkspace
  inviterEmail: string
  role: 'ADMIN' | 'MEMBER'
  expiresAt: string
  eligibility: 'accept' | 'accepted'
}

export function createWorkspaceInvitation(
  workspaceId: string,
  data: { email: string; role: 'ADMIN' | 'MEMBER' },
) {
  return apiFetch<{ invitation: Invitation }>(`/api/v1/workspaces/${workspaceId}/invitations`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function previewInvitation(reference: InvitationReference) {
  return apiFetch<{ invitation: InvitationPreview }>('/api/v1/invitations/preview', {
    method: 'POST',
    body: JSON.stringify(reference),
  })
}

export function acceptInvitation(reference: InvitationReference) {
  return apiFetch<{ workspace: InvitationWorkspace }>('/api/v1/invitations/accept', {
    method: 'POST',
    body: JSON.stringify(reference),
  })
}

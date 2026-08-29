import { QueryClient, queryOptions } from '@tanstack/vue-query'
import { getSession } from '@/api/auth'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export const authQueryKey = ['auth', 'me'] as const
export const authQueryOptions = queryOptions({
  queryKey: authQueryKey,
  queryFn: getSession,
  staleTime: (query) => (query.state.data === null ? Infinity : 5 * 60 * 1000),
  retry: false,
})

export function removeAccountQueries(client: QueryClient) {
  client.removeQueries({ queryKey: ['invitations', 'preview'] })
  client.removeQueries({ queryKey: ['notifications'] })
  client.removeQueries({ queryKey: ['workspaces'] })
  client.removeQueries({ queryKey: ['workspace'] })
}

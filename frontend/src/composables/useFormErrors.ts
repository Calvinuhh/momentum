import { reactive, ref } from 'vue'
import * as z from 'zod'
import { ApiError } from '@/api/client'

export function useFormErrors() {
  const errors = reactive<Record<string, string>>({})
  const serverError = ref('')

  function clear() {
    for (const k in errors) delete errors[k]
    serverError.value = ''
  }

  function applyZod(error: z.ZodError) {
    const { fieldErrors } = z.flattenError(error as z.ZodError<Record<string, unknown>>)
    for (const [k, v] of Object.entries(fieldErrors as Record<string, string[] | undefined>)) {
      if (v?.[0]) errors[k] = v[0]
    }
  }

  function applyApi(e: unknown, map?: Record<string, string>) {
    if (e instanceof ApiError) {
      if (e.code === 'VALIDATION_ERROR' && e.details) {
        for (const d of e.details) {
          if (d.field && !errors[d.field]) errors[d.field] = d.message
        }
        return true
      }
      if (map?.[e.code]) {
        const field = map[e.code]
        if (field) errors[field] = e.message
        else serverError.value = e.message
        return true
      }
      serverError.value = e.message
      return true
    }
    serverError.value = 'Unexpected error'
    return true
  }

  return { errors, serverError, clear, applyZod, applyApi }
}

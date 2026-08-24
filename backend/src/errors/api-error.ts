import type { ContentfulStatusCode } from "hono/utils/http-status";

export type ApiErrorDetail = {
  field: string;
  message: string;
};

export type ApiErrorData = {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
};

export type ApiError = Error &
  ApiErrorData & {
    status: ContentfulStatusCode;
  };

export function createApiError(
  status: ContentfulStatusCode,
  code: string,
  message: string,
  details?: ApiErrorDetail[],
): ApiError {
  return Object.assign(new Error(message), {
    name: "ApiError",
    status,
    code,
    ...(details ? { details } : {}),
  }) as ApiError;
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && error.name === "ApiError";
}

export function apiErrorBody({ code, message, details }: ApiErrorData) {
  return {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
}

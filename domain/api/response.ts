export type ApiError = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  retryable: boolean;
};

export type ApiResponse<T> = {
  data: T | null;
  error: ApiError | null;
  meta: {
    requestId: string;
    generatedAt: string;
    demoMode: boolean;
  };
};

export function apiSuccess<T>(data: T): ApiResponse<T> {
  return {
    data,
    error: null,
    meta: {
      requestId: crypto.randomUUID(),
      generatedAt: new Date().toISOString(),
      demoMode: true,
    },
  };
}

export function apiFailure(
  code: string,
  message: string,
  retryable = false,
): ApiResponse<never> {
  return {
    data: null,
    error: { code, message, retryable },
    meta: {
      requestId: crypto.randomUUID(),
      generatedAt: new Date().toISOString(),
      demoMode: true,
    },
  };
}

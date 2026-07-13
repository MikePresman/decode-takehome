const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";


export class ApiError extends Error {
  status: number;
  detail: string | null;

  constructor(status: number, detail: string | null = null) {
    super(detail ? `API request failed: ${status} - ${detail}` : `API request failed: ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}


export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}


export async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    let detail: string | null = null;

    try {
      const payload = (await response.json()) as { detail?: string };
      detail = payload.detail ?? null;
    } catch {
      detail = null;
    }

    throw new ApiError(response.status, detail);
  }

  return response.json() as Promise<T>;
}

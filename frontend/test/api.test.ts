import { afterEach, describe, expect, it } from "vitest";

import { getApiBaseUrl } from "../lib/api";


const originalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

describe("getApiBaseUrl", () => {
  afterEach(() => {
    if (originalApiBaseUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
      return;
    }

    process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBaseUrl;
  });

  it("uses the default local backend when the env var is missing", () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;

    expect(getApiBaseUrl()).toBe("http://127.0.0.1:8000");
  });

  it("adds https when the env var is missing a protocol", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "dynamic-essence-production.up.railway.app/";

    expect(getApiBaseUrl()).toBe("https://dynamic-essence-production.up.railway.app");
  });

  it("preserves an explicit protocol", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://backend.internal:8080/";

    expect(getApiBaseUrl()).toBe("http://backend.internal:8080");
  });
});

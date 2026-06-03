import { expect, vi } from "vitest";
import {
  MULTIPOINT_DOWNSAMPLE_RANGE_MESSAGE,
  SmhiSnowApiError,
  SmhiSnowNetworkError,
  SmhiSnowValidationError,
} from "../src/errors";

function createFetchJsonMock(json: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(json),
  });
}

export function stubFetchJson(json: unknown): void {
  vi.stubGlobal("fetch", createFetchJsonMock(json));
}

export function stubFetchJsonMock(json: unknown) {
  const mockFetch = createFetchJsonMock(json);
  vi.stubGlobal("fetch", mockFetch);
  return mockFetch;
}

export function stubFetchError503(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: () => Promise.resolve(""),
    }),
  );
}

export function stubFetchNetworkError(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new Error("Failed to fetch")),
  );
}

export async function expectApiError(
  promise: Promise<unknown>,
  status = 503,
): Promise<void> {
  const rejection = await promise.then(
    () => {
      throw new Error("Expected promise to reject");
    },
    (err) => err,
  );
  expect(rejection).toBeInstanceOf(SmhiSnowApiError);
  expect((rejection as SmhiSnowApiError).status).toBe(status);
  expect(rejection.message).toBe(`SMHI API error: ${status}`);
}

export async function expectNetworkError(
  promise: Promise<unknown>,
  message = "Failed to fetch",
): Promise<void> {
  const rejection = await promise.then(
    () => {
      throw new Error("Expected promise to reject");
    },
    (err) => err,
  );
  expect(rejection).toBeInstanceOf(SmhiSnowNetworkError);
  expect(rejection.message).toBe(`SMHI network error: ${message}`);
}

export async function expectValidationError(
  promise: Promise<unknown>,
  message = MULTIPOINT_DOWNSAMPLE_RANGE_MESSAGE,
): Promise<void> {
  const rejection = await promise.then(
    () => {
      throw new Error("Expected promise to reject");
    },
    (err) => err,
  );
  expect(rejection).toBeInstanceOf(SmhiSnowValidationError);
  expect(rejection).toHaveProperty("message", message);
}

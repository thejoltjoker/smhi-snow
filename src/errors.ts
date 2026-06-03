/** Base class for errors thrown by {@link SmhiSnowClient}. */
export class SmhiSnowError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "SmhiSnowError";
  }
}

/**
 * Thrown when `fetch` fails before a response is received.
 *
 * The original error is available on {@link Error.cause} when provided by the runtime.
 */
export class SmhiSnowNetworkError extends SmhiSnowError {
  constructor(message: string, options?: ErrorOptions) {
    super(`SMHI network error: ${message}`, options);
    this.name = "SmhiSnowNetworkError";
  }
}

/** Thrown when the API returns a non-OK HTTP status (e.g. 400 for coordinates outside the forecast area). */
export class SmhiSnowApiError extends SmhiSnowError {
  /** HTTP status code from the SMHI response. */
  readonly status: number;
  /** Response body text when the server returned one (may be empty). */
  readonly body: string | undefined;

  /**
   * @param status - HTTP status code (e.g. `400`, `503`).
   * @param body - Optional response body for debugging.
   */
  constructor(status: number, body?: string) {
    super(`SMHI API error: ${status}`);
    this.name = "SmhiSnowApiError";
    this.status = status;
    this.body = body;
  }
}

/** Thrown when request parameters fail client-side validation before a network call. */
export class SmhiSnowValidationError extends SmhiSnowError {
  constructor(message: string) {
    super(message);
    this.name = "SmhiSnowValidationError";
  }
}

/** Message used by {@link SmhiSnowValidationError} for invalid multipoint `downsample` values. */
export const MULTIPOINT_DOWNSAMPLE_RANGE_MESSAGE =
  "SMHI multipoint downsample must be an integer between 1 and 20";

/** Message used by {@link SmhiSnowValidationError} for invalid multipoint `time` values. */
export const MULTIPOINT_TIME_FORMAT_MESSAGE =
  "SMHI multipoint time must be compact (YYYYMMDDTHHMMSSZ) or ISO 8601 UTC (YYYY-MM-DDTHH:MM:SSZ)";

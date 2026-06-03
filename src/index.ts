import {
  normalizeMultipointForecastResponse,
  normalizePointForecastResponse,
} from "./normalize";
import {
  type CreatedTimeResponse,
  type GeographicMultipointResponse,
  type GeographicPolygonResponse,
  type GetGeographicMultipointQuery,
  type GetMultipointForecastQuery,
  type ParametersResponse,
  type GetPointForecastQuery,
  type MultipointForecastResponse,
  type MultipointForecastResponseRaw,
  type PointForecastParameter,
  type PointForecastResponse,
  type PointForecastResponseRaw,
  type TimesResponse,
} from "./types";
import {
  MULTIPOINT_DOWNSAMPLE_RANGE_MESSAGE,
  SmhiSnowApiError,
  SmhiSnowNetworkError,
  SmhiSnowValidationError,
} from "./errors";
import { SmhiSnowUrl } from "./url";

/** Error types and validation messages thrown by {@link SmhiSnowClient}. */
export {
  MULTIPOINT_DOWNSAMPLE_RANGE_MESSAGE,
  SmhiSnowApiError,
  SmhiSnowError,
  SmhiSnowNetworkError,
  SmhiSnowValidationError,
} from "./errors";

/** Response and query types for SNOW1gv1 endpoints. */
export type {
  CreatedTimeResponse,
  GeographicMultipointResponse,
  GeographicPolygonResponse,
  GetGeographicMultipointQuery,
  GetMultipointForecastQuery,
  GetPointForecastQuery,
  MultipointForecastResponse,
  MultipointForecastResponseRaw,
  MultipointForecastTimeSeriesData,
  MultipointForecastTimeSeriesDataRaw,
  MultipointForecastTimeSeriesEntry,
  ParameterDefinition,
  ParametersResponse,
  PointForecastGeometry,
  PointForecastParameter,
  PointForecastResponse,
  PointForecastResponseRaw,
  PointForecastTimeSeriesData,
  PointForecastTimeSeriesDataRaw,
  PointForecastTimeSeriesEntry,
  TimesResponse,
} from "./types";

/** URL builders for custom fetch workflows and testing. */
export { BASE_URL, SmhiSnowUrl } from "./url";

const GZIP_HEADERS = { "Accept-Encoding": "gzip" } as const;

function validateMultipointDownsample(downsample: number): void {
  if (!Number.isInteger(downsample) || downsample < 1 || downsample > 20) {
    throw new SmhiSnowValidationError(MULTIPOINT_DOWNSAMPLE_RANGE_MESSAGE);
  }
}

/**
 * HTTP client for the SMHI SNOW1gv1 open forecast API.
 *
 * Uses the platform `fetch` API with no runtime dependencies. Point and
 * multipoint forecast responses normalize SMHI missing values (`9999`) to
 * `null`.
 *
 * @see https://opendata.smhi.se/metfcst/snow1gv1
 */
export class SmhiSnowClient {
  /** Fetches JSON from a URL and maps failures to {@link SmhiSnowNetworkError} or {@link SmhiSnowApiError}. */
  private async get<T>(url: string, init?: RequestInit): Promise<T> {
    let res: Response;
    try {
      res = init !== undefined ? await fetch(url, init) : await fetch(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new SmhiSnowNetworkError(message, { cause: err });
    }
    if (!res.ok) throw new SmhiSnowApiError(res.status);
    return res.json() as Promise<T>;
  }

  /**
   * Returns when the current forecast was produced and its reference time.
   *
   * @param version - API version segment (defaults to `"1"`).
   * @returns Model run timestamp and reference time.
   * @throws {@link SmhiSnowNetworkError} When `fetch` fails before a response.
   * @throws {@link SmhiSnowApiError} When the API returns a non-OK status.
   */
  async getCreatedTime(version?: string): Promise<CreatedTimeResponse> {
    return this.get(SmhiSnowUrl.createdTime(version));
  }

  /**
   * Returns ISO 8601 valid times available for multipoint forecast requests.
   *
   * @param version - API version segment (defaults to `"1"`).
   * @returns List of forecast valid times.
   * @throws {@link SmhiSnowNetworkError} When `fetch` fails before a response.
   * @throws {@link SmhiSnowApiError} When the API returns a non-OK status.
   */
  async getTimes(version?: string): Promise<TimesResponse> {
    return this.get(SmhiSnowUrl.times(version));
  }

  /**
   * Returns the SMHI parameter catalog (names, units, descriptions, missing-value sentinel).
   *
   * @param version - API version segment (defaults to `"1"`).
   * @returns Parameter definitions for point and multipoint forecasts.
   * @throws {@link SmhiSnowNetworkError} When `fetch` fails before a response.
   * @throws {@link SmhiSnowApiError} When the API returns a non-OK status.
   */
  async getParameters(version?: string): Promise<ParametersResponse> {
    return this.get(SmhiSnowUrl.parameter(version));
  }

  /**
   * Returns a point forecast for the nearest SNOW grid cell to a WGS84 coordinate.
   *
   * Longitude and latitude are rounded to six decimal places in the request URL.
   * Missing values (`9999`) in the response are normalized to `null`.
   *
   * @param longitude - WGS84 longitude in degrees.
   * @param latitude - WGS84 latitude in degrees.
   * @param version - API version segment (defaults to `"1"`).
   * @param query - Optional `timeseries` limit and `parameters` subset.
   * @returns Forecast metadata, grid-cell geometry, and time series.
   * @throws {@link SmhiSnowNetworkError} When `fetch` fails before a response.
   * @throws {@link SmhiSnowApiError} When the API returns a non-OK status (e.g. coordinates outside the forecast area).
   */
  async getPointForecast(
    longitude: number,
    latitude: number,
    version?: string,
    query?: GetPointForecastQuery,
  ): Promise<PointForecastResponse> {
    const raw = await this.get<PointForecastResponseRaw>(
      SmhiSnowUrl.getPointForecast(longitude, latitude, version, query),
    );
    return normalizePointForecastResponse(raw);
  }

  /**
   * Returns one forecast parameter for the full Sweden grid at a valid time.
   *
   * Requests gzip compression because responses can be large. `time` accepts
   * ISO 8601 (`2026-06-02T18:00:00Z`) or compact form (`20260602T180000Z`).
   * Missing values (`9999`) are normalized to `null` in each value array.
   *
   * @param time - Forecast valid time from {@link getTimes}.
   * @param parameter - Parameter name (same names as {@link getParameters}).
   * @param version - API version segment (defaults to `"1"`).
   * @param query - Optional `downsample` (1–20) and `withGeo: false` to omit geometry.
   * @returns Forecast metadata and grid-aligned time series for the parameter.
   * @throws {@link SmhiSnowValidationError} When `query.downsample` is not an integer from 1 to 20.
   * @throws {@link SmhiSnowNetworkError} When `fetch` fails before a response.
   * @throws {@link SmhiSnowApiError} When the API returns a non-OK status.
   */
  async getMultipointForecast(
    time: string,
    parameter: PointForecastParameter,
    version?: string,
    query?: GetMultipointForecastQuery,
  ): Promise<MultipointForecastResponse> {
    if (query?.downsample !== undefined) {
      validateMultipointDownsample(query.downsample);
    }
    const raw = await this.get<MultipointForecastResponseRaw>(
      SmhiSnowUrl.getMultipointForecast(time, parameter, version, query),
      { headers: GZIP_HEADERS },
    );
    return normalizeMultipointForecastResponse(raw);
  }

  /**
   * Returns the valid forecast area as a GeoJSON `Polygon`.
   *
   * Point forecasts must use coordinates inside this polygon; otherwise the API
   * returns HTTP 400.
   *
   * @param version - API version segment (defaults to `"1"`).
   * @returns GeoJSON polygon (`coordinates[0]` is the outer ring of `[lon, lat]` pairs).
   * @throws {@link SmhiSnowNetworkError} When `fetch` fails before a response.
   * @throws {@link SmhiSnowApiError} When the API returns a non-OK status.
   */
  async getGeographicPolygon(
    version?: string,
  ): Promise<GeographicPolygonResponse> {
    return this.get(SmhiSnowUrl.geographicPolygon(version));
  }

  /**
   * Returns all SNOW grid points as a GeoJSON `MultiPoint`.
   *
   * The response is static. Each coordinate index matches the value array index
   * from {@link getMultipointForecast}. Requests gzip compression as required by
   * the API for this endpoint.
   *
   * @param version - API version segment (defaults to `"1"`).
   * @param query - Optional `downsample` (1–20): every Nth grid cell horizontally and vertically.
   * @returns GeoJSON multipoint of grid `[lon, lat]` pairs.
   * @throws {@link SmhiSnowValidationError} When `query.downsample` is not an integer from 1 to 20.
   * @throws {@link SmhiSnowNetworkError} When `fetch` fails before a response.
   * @throws {@link SmhiSnowApiError} When the API returns a non-OK status.
   */
  async getGeographicMultipoint(
    version?: string,
    query?: GetGeographicMultipointQuery,
  ): Promise<GeographicMultipointResponse> {
    if (query?.downsample !== undefined) {
      validateMultipointDownsample(query.downsample);
    }
    return this.get(SmhiSnowUrl.geographicMultipoint(version, query), {
      headers: GZIP_HEADERS,
    });
  }
}

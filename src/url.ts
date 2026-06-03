import {
  MULTIPOINT_TIME_FORMAT_MESSAGE,
  SmhiSnowValidationError,
} from "./errors";
import type {
  GetGeographicMultipointQuery,
  GetMultipointForecastQuery,
  GetPointForecastQuery,
  PointForecastParameter,
} from "./types";

/**
 * Base URL for all SNOW1gv1 open-data endpoints.
 *
 * @see https://opendata.smhi.se/metfcst/snow1gv1
 */
export const BASE_URL =
  "https://opendata-download-metfcst.smhi.se/api/category/snow1g";

const DEFAULT_VERSION = "1";

function appendQueryString(
  url: string,
  addParams: (params: URLSearchParams) => void,
): string {
  const params = new URLSearchParams();
  addParams(params);
  const search = params.toString();
  if (!search) return url;
  return `${url}?${search}`;
}

function setDownsampleParam(
  params: URLSearchParams,
  downsample: number | undefined,
): void {
  if (downsample !== undefined) {
    params.set("downsample", String(downsample));
  }
}

function appendGetPointForecastQuery(
  url: string,
  query?: GetPointForecastQuery,
): string {
  if (!query) return url;

  return appendQueryString(url, (params) => {
    if (query.timeseries !== undefined) {
      params.set("timeseries", String(query.timeseries));
    }
    if (query.parameters !== undefined) {
      const value =
        typeof query.parameters === "string"
          ? query.parameters
          : query.parameters.join(",");
      if (value.length > 0) {
        params.set("parameters", value);
      }
    }
  });
}

const MULTIPOINT_TIME_PARAM = /^\d{8}T\d{6}Z$/;
const ISO_TIME_PARAM = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

function toMultipointTimeParam(time: string): string {
  if (MULTIPOINT_TIME_PARAM.test(time)) return time;
  if (ISO_TIME_PARAM.test(time)) return time.replace(/[-:]/g, "");
  throw new SmhiSnowValidationError(MULTIPOINT_TIME_FORMAT_MESSAGE);
}

function appendGetMultipointForecastQuery(
  url: string,
  query?: GetMultipointForecastQuery,
): string {
  if (!query) return url;

  return appendQueryString(url, (params) => {
    setDownsampleParam(params, query.downsample);
    if (query.withGeo === false) {
      params.set("with-geo", "false");
    }
  });
}

/**
 * Builds absolute URLs for SNOW1gv1 endpoints.
 *
 * Use with custom `fetch` logic, caching, or tests. {@link SmhiSnowClient}
 * delegates to these builders internally.
 *
 * @example
 * ```ts
 * const url = SmhiSnowUrl.getPointForecast(18.07, 59.33, "1", {
 *   parameters: ["air_temperature", "wind_speed"],
 * });
 * const data = await fetch(url).then((r) => r.json());
 * ```
 *
 * @see https://opendata.smhi.se/metfcst/snow1gv1
 */
export class SmhiSnowUrl {
  /**
   * URL for `times.json` — valid times for multipoint forecast requests.
   *
   * @param version - API version segment (defaults to `"1"`).
   * @returns Absolute URL to the times resource.
   * @see https://opendata.smhi.se/metfcst/snow1gv1/times
   */
  public static times(version: string = DEFAULT_VERSION): string {
    return `${BASE_URL}/version/${version}/times.json`;
  }

  /**
   * URL for `createdtime.json` — latest model run and reference time.
   *
   * @param version - API version segment (defaults to `"1"`).
   * @returns Absolute URL to the created-time resource.
   * @see https://opendata.smhi.se/metfcst/snow1gv1/created_time
   */
  public static createdTime(version: string = DEFAULT_VERSION): string {
    return `${BASE_URL}/version/${version}/createdtime.json`;
  }

  /**
   * URL for `parameter.json` — parameter catalog (names, units, missing-value sentinel).
   *
   * @param version - API version segment (defaults to `"1"`).
   * @returns Absolute URL to the parameter catalog.
   * @see https://opendata.smhi.se/metfcst/snow1gv1/parameters
   */
  public static parameter(version: string = DEFAULT_VERSION): string {
    return `${BASE_URL}/version/${version}/parameter.json`;
  }

  /**
   * URL for a point forecast at a WGS84 coordinate.
   *
   * Longitude and latitude are formatted to six decimal places in the path, as
   * required by the API. Optional query parameters mirror
   * {@link SmhiSnowClient.getPointForecast}.
   *
   * @param longitude - WGS84 longitude in degrees.
   * @param latitude - WGS84 latitude in degrees.
   * @param version - API version segment (defaults to `"1"`).
   * @param query - Optional `timeseries` limit and `parameters` subset.
   * @returns Absolute URL to `data.json` for the nearest grid cell.
   * @see https://opendata.smhi.se/metfcst/snow1gv1/get_point_forecast
   */
  public static getPointForecast(
    longitude: number,
    latitude: number,
    version: string = DEFAULT_VERSION,
    query?: GetPointForecastQuery,
  ): string {
    const lon = longitude.toFixed(6);
    const lat = latitude.toFixed(6);
    const url = `${BASE_URL}/version/${version}/geotype/point/lon/${lon}/lat/${lat}/data.json`;
    return appendGetPointForecastQuery(url, query);
  }

  /**
   * URL for a multipoint forecast for one parameter at a valid time.
   *
   * `time` is normalized to compact form (`YYYYMMDDTHHMMSSZ`) when given as
   * ISO 8601 (e.g. `2026-06-02T18:00:00Z`). Optional query parameters mirror
   * {@link SmhiSnowClient.getMultipointForecast}; the client validates
   * `downsample` before fetch.
   *
   * @param time - Forecast valid time from {@link SmhiSnowUrl.times} (ISO or compact).
   * @param parameter - Parameter name (same names as {@link SmhiSnowUrl.parameter}).
   * @param version - API version segment (defaults to `"1"`).
   * @param query - Optional `downsample` and `withGeo: false` to omit geometry.
   * @returns Absolute URL to grid-aligned `data.json` for the parameter.
   * @see https://opendata.smhi.se/metfcst/snow1gv1/get_multipoint_forecast
   */
  public static getMultipointForecast(
    time: string,
    parameter: PointForecastParameter,
    version: string = DEFAULT_VERSION,
    query?: GetMultipointForecastQuery,
  ): string {
    const timeParam = toMultipointTimeParam(time);
    const url = `${BASE_URL}/version/${version}/geotype/multipoint/time/${timeParam}/parameter/${parameter}/data.json`;
    return appendGetMultipointForecastQuery(url, query);
  }

  /**
   * URL for `polygon.json` — valid forecast area as GeoJSON.
   *
   * Point forecast coordinates must lie inside this polygon; otherwise the API
   * returns HTTP 400.
   *
   * @param version - API version segment (defaults to `"1"`).
   * @returns Absolute URL to the geographic polygon resource.
   * @see https://opendata.smhi.se/metfcst/snow1gv1/geographic_area#polygon
   */
  public static geographicPolygon(version: string = DEFAULT_VERSION): string {
    return `${BASE_URL}/version/${version}/geotype/polygon.json`;
  }

  /**
   * URL for `multipoint.json` — static SNOW grid coordinates as GeoJSON.
   *
   * The API recommends gzip for this large, static response. Coordinate index
   * matches value array index from {@link SmhiSnowUrl.getMultipointForecast}.
   * Optional `downsample` is not validated here; {@link SmhiSnowClient} checks
   * the 1–20 range before fetch.
   *
   * @param version - API version segment (defaults to `"1"`).
   * @param query - Optional `downsample`: every Nth grid cell horizontally and vertically.
   * @returns Absolute URL to the geographic multipoint resource.
   * @see https://opendata.smhi.se/metfcst/snow1gv1/geographic_area#multipoint
   */
  public static geographicMultipoint(
    version: string = DEFAULT_VERSION,
    query?: GetGeographicMultipointQuery,
  ): string {
    const url = `${BASE_URL}/version/${version}/geotype/multipoint.json`;
    return appendQueryString(url, (params) =>
      setDownsampleParam(params, query?.downsample),
    );
  }
}

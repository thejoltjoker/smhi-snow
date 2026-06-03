import type {
  GetGeographicMultipointQuery,
  GetMultipointForecastQuery,
  GetPointForecastQuery,
  PointForecastParameter,
} from "./types";

/** Base URL for all SNOW1gv1 open-data endpoints. */
export const BASE_URL =
  "https://opendata-download-metfcst.smhi.se/api/category/snow1g";

const DEFAULT_VERSION = "1";

function appendGetPointForecastQuery(
  url: string,
  query?: GetPointForecastQuery
): string {
  if (!query) return url;

  const params = new URLSearchParams();
  if (query.timeseries !== undefined) {
    params.set("timeseries", String(query.timeseries));
  }
  if (query.parameters !== undefined) {
    const value =
      typeof query.parameters === "string"
        ? query.parameters
        : query.parameters.join(",");
    params.set("parameters", value);
  }

  const search = params.toString();
  return search ? `${url}?${search}` : url;
}

const MULTIPOINT_TIME_PARAM = /^\d{8}T\d{6}Z$/;

function toMultipointTimeParam(time: string): string {
  if (MULTIPOINT_TIME_PARAM.test(time)) return time;
  return time.replace(/[-:]/g, "");
}

function appendDownsampleQuery(
  url: string,
  downsample: number | undefined
): string {
  if (downsample === undefined) return url;
  const params = new URLSearchParams();
  params.set("downsample", String(downsample));
  const search = params.toString();
  return search ? `${url}?${search}` : url;
}

function appendGetMultipointForecastQuery(
  url: string,
  query?: GetMultipointForecastQuery
): string {
  if (!query) return url;

  const params = new URLSearchParams();
  if (query.downsample !== undefined) {
    params.set("downsample", String(query.downsample));
  }
  if (query.withGeo === false) {
    params.set("with-geo", "false");
  }

  const search = params.toString();
  return search ? `${url}?${search}` : url;
}

/**
 * Builds absolute URLs for SNOW1gv1 endpoints.
 *
 * Use with custom `fetch` logic or tests; {@link SmhiSnowClient} calls these internally.
 *
 * @see https://opendata.smhi.se/metfcst/snow1gv1
 */
export class SmhiSnowUrl {
  /** `times.json` — available multipoint valid times. */
  public static times(version: string = DEFAULT_VERSION): string {
    return `${BASE_URL}/version/${version}/times.json`;
  }

  /** `createdtime.json` — latest model run and reference time. */
  public static createdTime(version: string = DEFAULT_VERSION): string {
    return `${BASE_URL}/version/${version}/createdtime.json`;
  }

  /** `parameter.json` — parameter catalog. */
  public static parameter(version: string = DEFAULT_VERSION): string {
    return `${BASE_URL}/version/${version}/parameter.json`;
  }

  /**
   * Point forecast for a WGS84 coordinate.
   *
   * Longitude and latitude are formatted to six decimal places, as required by the API.
   */
  public static getPointForecast(
    longitude: number,
    latitude: number,
    version: string = DEFAULT_VERSION,
    query?: GetPointForecastQuery
  ): string {
    const lon = longitude.toFixed(6);
    const lat = latitude.toFixed(6);
    const url = `${BASE_URL}/version/${version}/geotype/point/lon/${lon}/lat/${lat}/data.json`;
    return appendGetPointForecastQuery(url, query);
  }

  /**
   * Multipoint forecast for one parameter at a valid time.
   *
   * `time` is normalized to compact form (`YYYYMMDDTHHMMSSZ`) when given as ISO 8601.
   */
  public static getMultipointForecast(
    time: string,
    parameter: PointForecastParameter,
    version: string = DEFAULT_VERSION,
    query?: GetMultipointForecastQuery
  ): string {
    const timeParam = toMultipointTimeParam(time);
    const url = `${BASE_URL}/version/${version}/geotype/multipoint/time/${timeParam}/parameter/${parameter}/data.json`;
    return appendGetMultipointForecastQuery(url, query);
  }

  /** `polygon.json` — forecast area bounding polygon. */
  public static geographicPolygon(version: string = DEFAULT_VERSION): string {
    return `${BASE_URL}/version/${version}/geotype/polygon.json`;
  }

  /** `multipoint.json` — static grid coordinates (gzip recommended by the API). */
  public static geographicMultipoint(
    version: string = DEFAULT_VERSION,
    query?: GetGeographicMultipointQuery
  ): string {
    const url = `${BASE_URL}/version/${version}/geotype/multipoint.json`;
    return appendDownsampleQuery(url, query?.downsample);
  }
}

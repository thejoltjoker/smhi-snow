/**
 * Response and query types for the SMHI SNOW1gv1 API.
 *
 * Raw types mirror the API (`9999` missing sentinel). Normalized forecast types
 * use `null` instead of `9999` after {@link SmhiSnowClient} processing.
 *
 * @see https://opendata.smhi.se/metfcst/snow1gv1
 */

/** Response from `createdtime.json` — current model run metadata. */
export interface CreatedTimeResponse {
  /** ISO 8601 timestamp when this forecast was produced. */
  createdTime: string;
  /** ISO 8601 reference time the forecast is based on. */
  referenceTime: string;
}

/** Response from `times.json` — valid times for multipoint requests. */
export interface TimesResponse {
  /** ISO 8601 valid times, newest first. */
  time: string[];
}

/** GeoJSON polygon of the SNOW forecast area (`polygon.json`). */
export interface GeographicPolygonResponse {
  type: "Polygon";
  /** Outer ring at `coordinates[0]`: `[longitude, latitude]` pairs. */
  coordinates: number[][][];
}

/** GeoJSON multipoint of all SNOW grid cells (`multipoint.json`). */
export interface GeographicMultipointResponse {
  type: "MultiPoint";
  /** Grid points as `[longitude, latitude]`; index aligns with multipoint value arrays. */
  coordinates: number[][];
}

/** Optional query parameters for {@link SmhiSnowClient.getGeographicMultipoint}. */
export interface GetGeographicMultipointQuery {
  /** Every Nth grid cell horizontally and vertically (integer 1–20). */
  downsample?: number;
}

/** Grid cell used for a point forecast (GeoJSON Point). */
export interface PointForecastGeometry {
  type: "Point";
  /** `[longitude, latitude]` of the nearest grid cell. */
  coordinates: [number, number];
}

/**
 * Point forecast parameters as returned by the API.
 *
 * SMHI uses `9999` as the missing-value sentinel. Prefer
 * {@link PointForecastTimeSeriesData} from the client, where missing values are `null`.
 *
 * @see https://opendata.smhi.se/metfcst/snow1gv1/parameters
 */
export interface PointForecastTimeSeriesDataRaw {
  air_temperature: number;
  wind_from_direction: number;
  wind_speed: number;
  wind_speed_of_gust: number;
  relative_humidity: number;
  air_pressure_at_mean_sea_level: number;
  visibility_in_air: number;
  thunderstorm_probability: number;
  probability_of_frozen_precipitation: number;
  cloud_area_fraction: number;
  low_type_cloud_area_fraction: number;
  medium_type_cloud_area_fraction: number;
  high_type_cloud_area_fraction: number;
  cloud_base_altitude: number;
  cloud_top_altitude: number;
  precipitation_amount_mean_deterministic: number;
  precipitation_amount_mean: number;
  precipitation_amount_min: number;
  precipitation_amount_max: number;
  precipitation_amount_median: number;
  probability_of_precipitation: number;
  precipitation_frozen_part: number;
  predominant_precipitation_type_at_surface: number;
  symbol_code: number;
}

/** Point forecast parameters after missing-value normalization (`9999` → `null`). */
export type PointForecastTimeSeriesData = {
  [K in keyof PointForecastTimeSeriesDataRaw]: number | null;
};

/** Forecast parameter name (same identifiers as {@link ParameterDefinition.name}). */
export type PointForecastParameter = keyof PointForecastTimeSeriesDataRaw;

/** One entry from `parameter.json`. */
export interface ParameterDefinition {
  name: PointForecastParameter;
  shortName: string;
  description: string;
  levelType: string;
  level: number;
  unit: string;
  /** API missing-value sentinel (typically `9999`). */
  missingValue: number;
}

/** Response from `parameter.json`. */
export interface ParametersResponse {
  parameter: ParameterDefinition[];
}

/** Optional query parameters for {@link SmhiSnowClient.getPointForecast}. */
export interface GetPointForecastQuery {
  /** Maximum number of time steps to return. */
  timeseries?: number;
  /** Subset of parameters; a single name or list (comma-separated in the URL). */
  parameters?: PointForecastParameter | readonly PointForecastParameter[];
}

/** One time step in a raw point forecast response (API shape). */
export interface PointForecastTimeSeriesEntryRaw {
  /** ISO 8601 valid time for this step. */
  time: string;
  /** ISO 8601 start of the interval parameters window. */
  intervalParametersStartTime: string;
  data: PointForecastTimeSeriesDataRaw;
}

/** One time step in a normalized point forecast response. */
export interface PointForecastTimeSeriesEntry {
  time: string;
  intervalParametersStartTime: string;
  data: PointForecastTimeSeriesData;
}

/** Raw point forecast JSON before missing-value normalization. */
export interface PointForecastResponseRaw {
  createdTime: string;
  referenceTime: string;
  geometry: PointForecastGeometry;
  timeSeries: PointForecastTimeSeriesEntryRaw[];
}

/** Point forecast returned by {@link SmhiSnowClient.getPointForecast}. */
export interface PointForecastResponse {
  createdTime: string;
  referenceTime: string;
  geometry: PointForecastGeometry;
  timeSeries: PointForecastTimeSeriesEntry[];
}

/** Optional query parameters for {@link SmhiSnowClient.getMultipointForecast}. */
export interface GetMultipointForecastQuery {
  /** Every Nth grid cell horizontally and vertically (integer 1–20). */
  downsample?: number;
  /** Omit geometry from the response; the API only accepts `false`. */
  withGeo?: false;
}

/** Multipoint parameter arrays as returned by the API (`9999` = missing per element). */
export type MultipointForecastTimeSeriesDataRaw = Partial<
  Record<PointForecastParameter, number[]>
>;

/** Multipoint parameter arrays after normalization (`9999` → `null` per element). */
export type MultipointForecastTimeSeriesData = Partial<
  Record<PointForecastParameter, (number | null)[]>
>;

/** One time step in a raw multipoint forecast response. */
export interface MultipointForecastTimeSeriesEntryRaw {
  time: string;
  intervalParametersStartTime: string;
  data: MultipointForecastTimeSeriesDataRaw;
}

/** One time step in a normalized multipoint forecast response. */
export interface MultipointForecastTimeSeriesEntry {
  time: string;
  intervalParametersStartTime: string;
  data: MultipointForecastTimeSeriesData;
}

/** Raw multipoint forecast JSON before missing-value normalization. */
export interface MultipointForecastResponseRaw {
  createdTime: string;
  referenceTime: string;
  timeSeries: MultipointForecastTimeSeriesEntryRaw[];
}

/** Multipoint forecast returned by {@link SmhiSnowClient.getMultipointForecast}. */
export interface MultipointForecastResponse {
  createdTime: string;
  referenceTime: string;
  timeSeries: MultipointForecastTimeSeriesEntry[];
}

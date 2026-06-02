export interface CreatedTimeResponse {
  createdTime: string;
  referenceTime: string;
}

export interface TimesResponse {
  time: string[];
}

export interface PointForecastGeometry {
  type: "Point";
  coordinates: [number, number];
}

/** SMHI point forecast parameters as returned by the API (9999 = missing). */
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

/** Point forecast parameters after missing-value normalization (9999 → null). */
export type PointForecastTimeSeriesData = {
  [K in keyof PointForecastTimeSeriesDataRaw]: number | null;
};

export interface PointForecastTimeSeriesEntryRaw {
  time: string;
  intervalParametersStartTime: string;
  data: PointForecastTimeSeriesDataRaw;
}

export interface PointForecastTimeSeriesEntry {
  time: string;
  intervalParametersStartTime: string;
  data: PointForecastTimeSeriesData;
}

export interface PointForecastResponseRaw {
  createdTime: string;
  referenceTime: string;
  geometry: PointForecastGeometry;
  timeSeries: PointForecastTimeSeriesEntryRaw[];
}

export interface PointForecastResponse {
  createdTime: string;
  referenceTime: string;
  geometry: PointForecastGeometry;
  timeSeries: PointForecastTimeSeriesEntry[];
}

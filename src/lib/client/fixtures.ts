import type {
  CreatedTimeResponse,
  GeographicMultipointResponse,
  GeographicPolygonResponse,
  MultipointForecastResponseRaw,
  ParametersResponse,
  PointForecastResponseRaw,
  TimesResponse,
} from "./types";

export const timesFixture: TimesResponse = {
  time: ["2026-06-02T15:00:00Z", "2026-06-02T16:00:00Z"],
};

export const createdTimeFixture: CreatedTimeResponse = {
  createdTime: "2026-06-02T17:31:13Z",
  referenceTime: "2026-06-02T17:15:00Z",
};

export const geographicPolygonFixture: GeographicPolygonResponse = {
  type: "Polygon",
  coordinates: [
    [
      [18.0, 59.0],
      [19.0, 59.0],
      [18.5, 60.0],
      [18.0, 59.0],
    ],
  ],
};

export const geographicMultipointFixture: GeographicMultipointResponse = {
  type: "MultiPoint",
  coordinates: [
    [18.07, 59.33],
    [18.08, 59.34],
    [18.09, 59.35],
  ],
};

export const parametersFixture: ParametersResponse = {
  parameter: [
    {
      name: "air_temperature",
      shortName: "2t",
      description: "Air temperature at 2 metres height.",
      levelType: "hl",
      level: 2,
      unit: "Cel",
      missingValue: 9999,
    },
    {
      name: "symbol_code",
      shortName: "Wsymb2",
      description: "Weather symbol code with 27 different codes.",
      levelType: "hl",
      level: 0,
      unit: "unknown",
      missingValue: 9999,
    },
  ],
};

export const pointForecastRawFixture: PointForecastResponseRaw = {
  createdTime: "2026-06-02T17:31:13Z",
  referenceTime: "2026-06-02T17:15:00Z",
  geometry: { type: "Point", coordinates: [18.077207, 59.33036] },
  timeSeries: [
    {
      time: "2026-06-02T18:00:00Z",
      intervalParametersStartTime: "2026-06-02T17:00:00Z",
      data: {
        air_temperature: 18.5,
        wind_from_direction: 207,
        wind_speed: 2.7,
        wind_speed_of_gust: 5.9,
        relative_humidity: 55,
        air_pressure_at_mean_sea_level: 1010.3,
        visibility_in_air: 34.7,
        thunderstorm_probability: 0,
        probability_of_frozen_precipitation: 0,
        cloud_area_fraction: 8,
        low_type_cloud_area_fraction: 0,
        medium_type_cloud_area_fraction: 7,
        high_type_cloud_area_fraction: 1,
        cloud_base_altitude: 9999,
        cloud_top_altitude: 9999,
        precipitation_amount_mean_deterministic: 0,
        precipitation_amount_mean: 0,
        precipitation_amount_min: 0,
        precipitation_amount_max: 0,
        precipitation_amount_median: 0,
        probability_of_precipitation: 0,
        precipitation_frozen_part: -9,
        predominant_precipitation_type_at_surface: 0,
        symbol_code: 6,
      },
    },
  ],
};

/** Client tests use a mix of missing (9999) and present values. */
export const pointForecastRawFixtureForClient: PointForecastResponseRaw = {
  ...pointForecastRawFixture,
  timeSeries: [
    {
      ...pointForecastRawFixture.timeSeries[0],
      data: {
        ...pointForecastRawFixture.timeSeries[0].data,
        cloud_top_altitude: 2515,
      },
    },
  ],
};

export const multipointForecastRawFixture: MultipointForecastResponseRaw = {
  createdTime: "2026-06-02T18:01:47Z",
  referenceTime: "2026-06-02T17:45:00Z",
  timeSeries: [
    {
      time: "2026-06-02T18:00:00Z",
      intervalParametersStartTime: "2026-06-02T17:00:00Z",
      data: {
        air_temperature: [14.4, 9999, 15.6],
      },
    },
  ],
};

export const multipointRawFixtureForNormalize: MultipointForecastResponseRaw = {
  createdTime: "2026-06-02T18:01:47Z",
  referenceTime: "2026-06-02T17:45:00Z",
  timeSeries: [
    {
      time: "2026-06-02T18:00:00Z",
      intervalParametersStartTime: "2026-06-02T17:00:00Z",
      data: {
        air_temperature: [14.4, 9999, 15.6],
        cloud_base_altitude: [100, 9999, 200],
      },
    },
  ],
};

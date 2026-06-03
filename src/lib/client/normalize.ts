import type {
  MultipointForecastResponse,
  MultipointForecastResponseRaw,
  MultipointForecastTimeSeriesData,
  MultipointForecastTimeSeriesDataRaw,
  PointForecastParameter,
  PointForecastResponse,
  PointForecastResponseRaw,
  PointForecastTimeSeriesData,
  PointForecastTimeSeriesDataRaw,
} from "./types";

const MISSING_VALUE = 9999;

function normalizeScalar(value: number): number | null {
  return value === MISSING_VALUE ? null : value;
}

function normalizeTimeSeriesData(
  data: PointForecastTimeSeriesDataRaw
): PointForecastTimeSeriesData {
  const normalized = {} as PointForecastTimeSeriesData;
  for (const key of Object.keys(data) as (keyof PointForecastTimeSeriesDataRaw)[]) {
    normalized[key] = normalizeScalar(data[key]);
  }
  return normalized;
}

function normalizeMultipointTimeSeriesData(
  data: MultipointForecastTimeSeriesDataRaw
): MultipointForecastTimeSeriesData {
  const normalized: MultipointForecastTimeSeriesData = {};
  for (const key of Object.keys(data) as PointForecastParameter[]) {
    const values = data[key];
    if (values !== undefined) {
      normalized[key] = values.map(normalizeScalar);
    }
  }
  return normalized;
}

/**
 * Converts a raw point forecast response: SMHI missing values (`9999`) become `null`.
 */
export function normalizePointForecastResponse(
  raw: PointForecastResponseRaw
): PointForecastResponse {
  return {
    createdTime: raw.createdTime,
    referenceTime: raw.referenceTime,
    geometry: raw.geometry,
    timeSeries: raw.timeSeries.map((entry) => ({
      time: entry.time,
      intervalParametersStartTime: entry.intervalParametersStartTime,
      data: normalizeTimeSeriesData(entry.data),
    })),
  };
}

/**
 * Converts a raw multipoint forecast response: `9999` in each grid value becomes `null`.
 */
export function normalizeMultipointForecastResponse(
  raw: MultipointForecastResponseRaw
): MultipointForecastResponse {
  return {
    createdTime: raw.createdTime,
    referenceTime: raw.referenceTime,
    timeSeries: raw.timeSeries.map((entry) => ({
      time: entry.time,
      intervalParametersStartTime: entry.intervalParametersStartTime,
      data: normalizeMultipointTimeSeriesData(entry.data),
    })),
  };
}

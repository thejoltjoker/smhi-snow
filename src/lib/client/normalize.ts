import type {
  PointForecastResponse,
  PointForecastResponseRaw,
  PointForecastTimeSeriesData,
  PointForecastTimeSeriesDataRaw,
} from "./types";

export const MISSING_VALUE = 9999;

function normalizeTimeSeriesData(
  data: PointForecastTimeSeriesDataRaw
): PointForecastTimeSeriesData {
  const normalized = {} as PointForecastTimeSeriesData;
  for (const key of Object.keys(data) as (keyof PointForecastTimeSeriesDataRaw)[]) {
    const value = data[key];
    normalized[key] = value === MISSING_VALUE ? null : value;
  }
  return normalized;
}

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

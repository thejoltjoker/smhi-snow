import { describe, it, expect } from "vitest";
import {
  multipointRawFixtureForNormalize,
  pointForecastRawFixture,
} from "./fixtures";
import {
  normalizeMultipointForecastResponse,
  normalizePointForecastResponse,
} from "./normalize";

describe("normalizePointForecastResponse", () => {
  it("replaces 9999 sentinel values with null in timeSeries data", () => {
    const result = normalizePointForecastResponse(pointForecastRawFixture);
    expect(result.timeSeries[0].data.cloud_base_altitude).toBeNull();
    expect(result.timeSeries[0].data.cloud_top_altitude).toBeNull();
    expect(result.timeSeries[0].data.air_temperature).toBe(18.5);
  });

  it("preserves top-level fields and geometry", () => {
    const result = normalizePointForecastResponse(pointForecastRawFixture);
    expect(result.createdTime).toBe(pointForecastRawFixture.createdTime);
    expect(result.referenceTime).toBe(pointForecastRawFixture.referenceTime);
    expect(result.geometry).toEqual(pointForecastRawFixture.geometry);
  });
});

describe("normalizeMultipointForecastResponse", () => {
  it("replaces 9999 sentinel values with null in array data", () => {
    const result = normalizeMultipointForecastResponse(multipointRawFixtureForNormalize);
    expect(result.timeSeries[0].data.air_temperature).toEqual([14.4, null, 15.6]);
    expect(result.timeSeries[0].data.cloud_base_altitude).toEqual([100, null, 200]);
  });

  it("preserves top-level fields", () => {
    const result = normalizeMultipointForecastResponse(multipointRawFixtureForNormalize);
    expect(result.createdTime).toBe(multipointRawFixtureForNormalize.createdTime);
    expect(result.referenceTime).toBe(multipointRawFixtureForNormalize.referenceTime);
  });
});

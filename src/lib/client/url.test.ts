import { describe, it, expect } from "vitest";
import { HIGH_PRECISION_POINT, HIGH_PRECISION_POINT_FORMATTED } from "./coords";
import { SmhiSnowUrl, BASE_URL } from "./url";

describe("SmhiSnowUrl.times", () => {
  it("returns the times URL with the default version", () => {
    expect(SmhiSnowUrl.times()).toBe(
      `${BASE_URL}/version/1/times.json`
    );
  });

  it("returns the times URL with a custom version", () => {
    expect(SmhiSnowUrl.times("2")).toBe(
      `${BASE_URL}/version/2/times.json`
    );
  });
});

describe("SmhiSnowUrl.getPointForecast", () => {
  it("returns the point forecast URL with formatted coordinates and default version", () => {
    expect(SmhiSnowUrl.getPointForecast(18.07, 59.33)).toBe(
      `${BASE_URL}/version/1/geotype/point/lon/18.070000/lat/59.330000/data.json`
    );
  });

  it("returns the point forecast URL with a custom version", () => {
    expect(SmhiSnowUrl.getPointForecast(18.07, 59.33, "2")).toBe(
      `${BASE_URL}/version/2/geotype/point/lon/18.070000/lat/59.330000/data.json`
    );
  });

  it("rounds high-precision coordinates to six decimal places in the path", () => {
    const { longitude, latitude } = HIGH_PRECISION_POINT;
    expect(SmhiSnowUrl.getPointForecast(longitude, latitude)).toBe(
      `${BASE_URL}/version/1/geotype/point/lon/${HIGH_PRECISION_POINT_FORMATTED.longitude}/lat/${HIGH_PRECISION_POINT_FORMATTED.latitude}/data.json`
    );
  });
});

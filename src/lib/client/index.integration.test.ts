import { describe, it, expect } from "vitest";
import { SmhiSnowClient } from "./index";
import {
  HIGH_PRECISION_POINT,
  HIGH_PRECISION_POINT_FORMATTED,
} from "./coords";
import { BASE_URL, SmhiSnowUrl } from "./url";

const { longitude, latitude } = HIGH_PRECISION_POINT;

describe("SMHI live API — high-precision point coordinates", () => {
  it(
    "returns 404 when lon/lat are embedded with full floating-point precision",
    async () => {
      const url =
        `${BASE_URL}/version/1/geotype/point/lon/${longitude}/lat/${latitude}/data.json`;
      const res = await fetch(url);
      expect(res.status).toBe(404);
    },
    15_000
  );

  it(
    "resolves a forecast via SmhiSnowClient using the same coordinates (rounded in URL)",
    async () => {
      const client = new SmhiSnowClient();
      const result = await client.getPointForecast(longitude, latitude);

      expect(result.timeSeries.length).toBeGreaterThan(0);
      expect(result.geometry.type).toBe("Point");
      const [gridLon, gridLat] = result.geometry.coordinates;
      expect(gridLon).toBeTypeOf("number");
      expect(gridLat).toBeTypeOf("number");
    },
    15_000
  );

  it("requests the rounded URL built by SmhiSnowUrl.getPointForecast", () => {
    expect(SmhiSnowUrl.getPointForecast(longitude, latitude)).toContain(
      `/lon/${HIGH_PRECISION_POINT_FORMATTED.longitude}/lat/${HIGH_PRECISION_POINT_FORMATTED.latitude}/`
    );
  });
});

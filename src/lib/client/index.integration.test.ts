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

describe("SMHI live API — parameters", () => {
  it(
    "returns parameter definitions with name, unit, and missingValue",
    async () => {
      const client = new SmhiSnowClient();
      const result = await client.getParameters();

      expect(result.parameter.length).toBeGreaterThan(0);
      const first = result.parameter[0];
      expect(first.name).toBeTypeOf("string");
      expect(first.unit).toBeTypeOf("string");
      expect(first.missingValue).toBe(9999);
    },
    15_000
  );
});

describe("SMHI live API — geographic area", () => {
  it(
    "returns a GeoJSON polygon for the forecast bounding area",
    async () => {
      const client = new SmhiSnowClient();
      const result = await client.getGeographicPolygon();

      expect(result.type).toBe("Polygon");
      expect(result.coordinates[0].length).toBeGreaterThan(0);
    },
    30_000
  );

  it(
    "returns grid point coordinates as GeoJSON MultiPoint",
    async () => {
      const client = new SmhiSnowClient();
      const result = await client.getGeographicMultipoint("1", {
        downsample: 10,
      });

      expect(result.type).toBe("MultiPoint");
      expect(result.coordinates.length).toBeGreaterThan(0);
    },
    30_000
  );
});

describe("SMHI live API — multipoint forecast", () => {
  it(
    "resolves air_temperature grid data with downsample and withGeo query params",
    async () => {
      const client = new SmhiSnowClient();
      const { time } = await client.getTimes();
      const result = await client.getMultipointForecast(time[0], "air_temperature", "1", {
        downsample: 10,
        withGeo: false,
      });

      expect(result.timeSeries.length).toBeGreaterThan(0);
      const values = result.timeSeries[0].data.air_temperature;
      expect(values).toBeDefined();
      expect(values!.length).toBeGreaterThan(0);
    },
    30_000
  );

  it(
    "resolves wind_speed grid data for the same time",
    async () => {
      const client = new SmhiSnowClient();
      const { time } = await client.getTimes();
      const result = await client.getMultipointForecast(time[0], "wind_speed", "1", {
        downsample: 10,
      });

      expect(result.timeSeries[0].data.wind_speed!.length).toBeGreaterThan(0);
    },
    30_000
  );
});

import { describe, it, expect, vi, afterEach } from "vitest";
import { HIGH_PRECISION_POINT } from "./coords";
import { SmhiSnowClient } from "./index";
import { SmhiSnowUrl } from "./url";
import type {
  CreatedTimeResponse,
  PointForecastResponse,
  PointForecastResponseRaw,
  TimesResponse,
} from "./types";

const timesFixture: TimesResponse = {
  time: ["2026-06-02T15:00:00Z", "2026-06-02T16:00:00Z"],
};

const createdTimeFixture: CreatedTimeResponse = {
  createdTime: "2026-06-02T17:31:13Z",
  referenceTime: "2026-06-02T17:15:00Z",
};

const pointForecastRawFixture: PointForecastResponseRaw = {
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
        cloud_top_altitude: 2515,
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

const pointForecastNormalizedFixture: PointForecastResponse = {
  ...pointForecastRawFixture,
  timeSeries: [
    {
      ...pointForecastRawFixture.timeSeries[0],
      data: {
        ...pointForecastRawFixture.timeSeries[0].data,
        cloud_base_altitude: null,
      },
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SmhiSnowClient.getTimes", () => {
  it("resolves with the parsed response on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(timesFixture),
    }));

    const client = new SmhiSnowClient();
    const result = await client.getTimes();
    expect(result).toEqual(timesFixture);
  });

  it("calls fetch with the correct URL", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(timesFixture),
    });
    vi.stubGlobal("fetch", mockFetch);

    const client = new SmhiSnowClient();
    await client.getTimes();
    expect(mockFetch).toHaveBeenCalledWith(SmhiSnowUrl.times());
  });

  it("throws on a non-ok HTTP response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    }));

    const client = new SmhiSnowClient();
    await expect(client.getTimes()).rejects.toThrow("SMHI API error: 503");
  });

  it("throws a network error when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Failed to fetch")));

    const client = new SmhiSnowClient();
    await expect(client.getTimes()).rejects.toThrow("SMHI network error: Failed to fetch");
  });
});

describe("SmhiSnowClient.getCreatedTime", () => {
  it("resolves with the parsed response on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createdTimeFixture),
    }));

    const client = new SmhiSnowClient();
    const result = await client.getCreatedTime();
    expect(result).toEqual(createdTimeFixture);
  });

  it("calls fetch with the correct URL", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createdTimeFixture),
    });
    vi.stubGlobal("fetch", mockFetch);

    const client = new SmhiSnowClient();
    await client.getCreatedTime();
    expect(mockFetch).toHaveBeenCalledWith(SmhiSnowUrl.createdTime());
  });

  it("throws on a non-ok HTTP response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    }));

    const client = new SmhiSnowClient();
    await expect(client.getCreatedTime()).rejects.toThrow("SMHI API error: 503");
  });

  it("throws a network error when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Failed to fetch")));

    const client = new SmhiSnowClient();
    await expect(client.getCreatedTime()).rejects.toThrow(
      "SMHI network error: Failed to fetch"
    );
  });
});

describe("SmhiSnowClient.getPointForecast", () => {
  it("resolves with normalized response on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(pointForecastRawFixture),
    }));

    const client = new SmhiSnowClient();
    const result = await client.getPointForecast(18.07, 59.33);
    expect(result).toEqual(pointForecastNormalizedFixture);
  });

  it("calls fetch with the correct URL", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(pointForecastRawFixture),
    });
    vi.stubGlobal("fetch", mockFetch);

    const client = new SmhiSnowClient();
    await client.getPointForecast(18.07, 59.33);
    expect(mockFetch).toHaveBeenCalledWith(
      SmhiSnowUrl.getPointForecast(18.07, 59.33)
    );
  });

  it("calls fetch with a rounded URL for high-precision coordinates", async () => {
    const { longitude, latitude } = HIGH_PRECISION_POINT;
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(pointForecastRawFixture),
    });
    vi.stubGlobal("fetch", mockFetch);

    const client = new SmhiSnowClient();
    await client.getPointForecast(longitude, latitude);
    expect(mockFetch).toHaveBeenCalledWith(
      SmhiSnowUrl.getPointForecast(longitude, latitude)
    );
  });

  it("throws on a non-ok HTTP response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    }));

    const client = new SmhiSnowClient();
    await expect(client.getPointForecast(18.07, 59.33)).rejects.toThrow(
      "SMHI API error: 503"
    );
  });

  it("throws a network error when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Failed to fetch")));

    const client = new SmhiSnowClient();
    await expect(client.getPointForecast(18.07, 59.33)).rejects.toThrow(
      "SMHI network error: Failed to fetch"
    );
  });
});

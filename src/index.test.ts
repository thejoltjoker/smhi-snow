import { describe, it, expect, vi, afterEach } from "vitest";
import { HIGH_PRECISION_POINT } from "./coords";
import {
  createdTimeFixture,
  geographicMultipointFixture,
  geographicPolygonFixture,
  parametersFixture,
  multipointForecastRawFixture,
  pointForecastRawFixtureForClient,
  timesFixture,
} from "../test/fixtures";
import { SmhiSnowApiError, SmhiSnowClient } from "./index";
import {
  expectApiError,
  expectNetworkError,
  expectValidationError,
  stubFetchError503,
  stubFetchJson,
  stubFetchJsonMock,
  stubFetchNetworkError,
} from "../test/helpers";
import { SmhiSnowUrl } from "./url";
import type {
  MultipointForecastResponse,
  PointForecastResponse,
} from "./types";

const multipointForecastNormalizedFixture: MultipointForecastResponse = {
  ...multipointForecastRawFixture,
  timeSeries: [
    {
      ...multipointForecastRawFixture.timeSeries[0],
      data: {
        air_temperature: [14.4, null, 15.6],
      },
    },
  ],
};

const pointForecastNormalizedFixture: PointForecastResponse = {
  ...pointForecastRawFixtureForClient,
  timeSeries: [
    {
      ...pointForecastRawFixtureForClient.timeSeries[0],
      data: {
        ...pointForecastRawFixtureForClient.timeSeries[0].data,
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
    stubFetchJson(timesFixture);

    const client = new SmhiSnowClient();
    const result = await client.getTimes();
    expect(result).toEqual(timesFixture);
  });

  it("calls fetch with the correct URL", async () => {
    const mockFetch = stubFetchJsonMock(timesFixture);

    const client = new SmhiSnowClient();
    await client.getTimes();
    expect(mockFetch).toHaveBeenCalledWith(SmhiSnowUrl.times());
  });

  it("calls fetch with a custom version URL when provided", async () => {
    const mockFetch = stubFetchJsonMock(timesFixture);

    const client = new SmhiSnowClient();
    await client.getTimes("2");
    expect(mockFetch).toHaveBeenCalledWith(SmhiSnowUrl.times("2"));
  });

  it("throws on a non-ok HTTP response", async () => {
    stubFetchError503();
    const client = new SmhiSnowClient();
    await expectApiError(client.getTimes());
  });

  it("throws a network error when fetch rejects", async () => {
    stubFetchNetworkError();
    const client = new SmhiSnowClient();
    await expectNetworkError(client.getTimes());
  });

  it("throws a network error when the response body is not valid JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new SyntaxError("Unexpected token")),
      }),
    );
    const client = new SmhiSnowClient();
    await expectNetworkError(
      client.getTimes(),
      "Invalid JSON response: Unexpected token",
    );
  });

  it("includes the response body on API errors when present", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve("coordinates outside area"),
      }),
    );
    const client = new SmhiSnowClient();
    const rejection = await client.getTimes().then(
      () => {
        throw new Error("Expected promise to reject");
      },
      (err) => err,
    );
    expect(rejection).toBeInstanceOf(SmhiSnowApiError);
    expect((rejection as SmhiSnowApiError).status).toBe(400);
    expect((rejection as SmhiSnowApiError).body).toBe(
      "coordinates outside area",
    );
  });
});

describe("SmhiSnowClient.getParameters", () => {
  it("resolves with the parsed response on success", async () => {
    stubFetchJson(parametersFixture);

    const client = new SmhiSnowClient();
    const result = await client.getParameters();
    expect(result).toEqual(parametersFixture);
  });

  it("calls fetch with the correct URL", async () => {
    const mockFetch = stubFetchJsonMock(parametersFixture);

    const client = new SmhiSnowClient();
    await client.getParameters();
    expect(mockFetch).toHaveBeenCalledWith(SmhiSnowUrl.parameter());
  });

  it("throws on a non-ok HTTP response", async () => {
    stubFetchError503();
    const client = new SmhiSnowClient();
    await expectApiError(client.getParameters());
  });

  it("throws a network error when fetch rejects", async () => {
    stubFetchNetworkError();
    const client = new SmhiSnowClient();
    await expectNetworkError(client.getParameters());
  });
});

describe("SmhiSnowClient.getCreatedTime", () => {
  it("resolves with the parsed response on success", async () => {
    stubFetchJson(createdTimeFixture);

    const client = new SmhiSnowClient();
    const result = await client.getCreatedTime();
    expect(result).toEqual(createdTimeFixture);
  });

  it("calls fetch with the correct URL", async () => {
    const mockFetch = stubFetchJsonMock(createdTimeFixture);

    const client = new SmhiSnowClient();
    await client.getCreatedTime();
    expect(mockFetch).toHaveBeenCalledWith(SmhiSnowUrl.createdTime());
  });

  it("calls fetch with a custom version URL when provided", async () => {
    const mockFetch = stubFetchJsonMock(createdTimeFixture);

    const client = new SmhiSnowClient();
    await client.getCreatedTime("2");
    expect(mockFetch).toHaveBeenCalledWith(SmhiSnowUrl.createdTime("2"));
  });

  it("throws on a non-ok HTTP response", async () => {
    stubFetchError503();
    const client = new SmhiSnowClient();
    await expectApiError(client.getCreatedTime());
  });

  it("throws a network error when fetch rejects", async () => {
    stubFetchNetworkError();
    const client = new SmhiSnowClient();
    await expectNetworkError(client.getCreatedTime());
  });
});

describe("SmhiSnowClient.getPointForecast", () => {
  it("resolves with normalized response on success", async () => {
    stubFetchJson(pointForecastRawFixtureForClient);

    const client = new SmhiSnowClient();
    const result = await client.getPointForecast(18.07, 59.33);
    expect(result).toEqual(pointForecastNormalizedFixture);
  });

  it("calls fetch with the correct URL", async () => {
    const mockFetch = stubFetchJsonMock(pointForecastRawFixtureForClient);

    const client = new SmhiSnowClient();
    await client.getPointForecast(18.07, 59.33);
    expect(mockFetch).toHaveBeenCalledWith(
      SmhiSnowUrl.getPointForecast(18.07, 59.33),
    );
  });

  it("calls fetch with a rounded URL for high-precision coordinates", async () => {
    const { longitude, latitude } = HIGH_PRECISION_POINT;
    const mockFetch = stubFetchJsonMock(pointForecastRawFixtureForClient);

    const client = new SmhiSnowClient();
    await client.getPointForecast(longitude, latitude);
    expect(mockFetch).toHaveBeenCalledWith(
      SmhiSnowUrl.getPointForecast(longitude, latitude),
    );
  });

  it("calls fetch with query parameters when provided", async () => {
    const mockFetch = stubFetchJsonMock(pointForecastRawFixtureForClient);

    const query = {
      timeseries: 1,
      parameters: ["air_temperature", "wind_speed"] as const,
    };
    const client = new SmhiSnowClient();
    await client.getPointForecast(18.07, 59.33, "1", query);
    expect(mockFetch).toHaveBeenCalledWith(
      SmhiSnowUrl.getPointForecast(18.07, 59.33, "1", query),
    );
  });

  it("throws on a non-ok HTTP response", async () => {
    stubFetchError503();
    const client = new SmhiSnowClient();
    await expectApiError(client.getPointForecast(18.07, 59.33));
  });

  it("throws a network error when fetch rejects", async () => {
    stubFetchNetworkError();
    const client = new SmhiSnowClient();
    await expectNetworkError(client.getPointForecast(18.07, 59.33));
  });
});

describe("SmhiSnowClient.getMultipointForecast", () => {
  it("resolves with normalized response on success", async () => {
    stubFetchJson(multipointForecastRawFixture);

    const client = new SmhiSnowClient();
    const result = await client.getMultipointForecast(
      "2026-06-02T18:00:00Z",
      "air_temperature",
    );
    expect(result).toEqual(multipointForecastNormalizedFixture);
  });

  it("calls fetch with the correct URL and gzip header", async () => {
    const mockFetch = stubFetchJsonMock(multipointForecastRawFixture);

    const client = new SmhiSnowClient();
    await client.getMultipointForecast(
      "2026-06-02T18:00:00Z",
      "air_temperature",
    );
    expect(mockFetch).toHaveBeenCalledWith(
      SmhiSnowUrl.getMultipointForecast(
        "2026-06-02T18:00:00Z",
        "air_temperature",
      ),
      { headers: { "Accept-Encoding": "gzip" } },
    );
  });

  it("calls fetch with query parameters when provided", async () => {
    const mockFetch = stubFetchJsonMock(multipointForecastRawFixture);

    const query = { downsample: 10, withGeo: false as const };
    const client = new SmhiSnowClient();
    await client.getMultipointForecast(
      "20260602T180000Z",
      "wind_speed",
      "1",
      query,
    );
    expect(mockFetch).toHaveBeenCalledWith(
      SmhiSnowUrl.getMultipointForecast(
        "20260602T180000Z",
        "wind_speed",
        "1",
        query,
      ),
      { headers: { "Accept-Encoding": "gzip" } },
    );
  });

  it("throws when downsample is out of range", async () => {
    const client = new SmhiSnowClient();
    await expectValidationError(
      client.getMultipointForecast("20260602T180000Z", "air_temperature", "1", {
        downsample: 21,
      }),
    );
  });

  it("throws on a non-ok HTTP response", async () => {
    stubFetchError503();
    const client = new SmhiSnowClient();
    await expectApiError(
      client.getMultipointForecast("20260602T180000Z", "air_temperature"),
    );
  });

  it("throws a network error when fetch rejects", async () => {
    stubFetchNetworkError();
    const client = new SmhiSnowClient();
    await expectNetworkError(
      client.getMultipointForecast("20260602T180000Z", "air_temperature"),
    );
  });
});

describe("SmhiSnowClient.getGeographicPolygon", () => {
  it("resolves with the parsed response on success", async () => {
    stubFetchJson(geographicPolygonFixture);

    const client = new SmhiSnowClient();
    const result = await client.getGeographicPolygon();
    expect(result).toEqual(geographicPolygonFixture);
  });

  it("calls fetch with the correct URL", async () => {
    const mockFetch = stubFetchJsonMock(geographicPolygonFixture);

    const client = new SmhiSnowClient();
    await client.getGeographicPolygon();
    expect(mockFetch).toHaveBeenCalledWith(SmhiSnowUrl.geographicPolygon());
  });

  it("throws on a non-ok HTTP response", async () => {
    stubFetchError503();
    const client = new SmhiSnowClient();
    await expectApiError(client.getGeographicPolygon());
  });

  it("throws a network error when fetch rejects", async () => {
    stubFetchNetworkError();
    const client = new SmhiSnowClient();
    await expectNetworkError(client.getGeographicPolygon());
  });
});

describe("SmhiSnowClient.getGeographicMultipoint", () => {
  it("resolves with the parsed response on success", async () => {
    stubFetchJson(geographicMultipointFixture);

    const client = new SmhiSnowClient();
    const result = await client.getGeographicMultipoint();
    expect(result).toEqual(geographicMultipointFixture);
  });

  it("calls fetch with the correct URL and gzip header", async () => {
    const mockFetch = stubFetchJsonMock(geographicMultipointFixture);

    const client = new SmhiSnowClient();
    await client.getGeographicMultipoint();
    expect(mockFetch).toHaveBeenCalledWith(SmhiSnowUrl.geographicMultipoint(), {
      headers: { "Accept-Encoding": "gzip" },
    });
  });

  it("calls fetch with query parameters when provided", async () => {
    const mockFetch = stubFetchJsonMock(geographicMultipointFixture);

    const query = { downsample: 10 };
    const client = new SmhiSnowClient();
    await client.getGeographicMultipoint("1", query);
    expect(mockFetch).toHaveBeenCalledWith(
      SmhiSnowUrl.geographicMultipoint("1", query),
      { headers: { "Accept-Encoding": "gzip" } },
    );
  });

  it("throws when downsample is out of range", async () => {
    const client = new SmhiSnowClient();
    await expectValidationError(
      client.getGeographicMultipoint("1", { downsample: 0 }),
    );
  });

  it("throws on a non-ok HTTP response", async () => {
    stubFetchError503();
    const client = new SmhiSnowClient();
    await expectApiError(client.getGeographicMultipoint());
  });

  it("throws a network error when fetch rejects", async () => {
    stubFetchNetworkError();
    const client = new SmhiSnowClient();
    await expectNetworkError(client.getGeographicMultipoint());
  });
});

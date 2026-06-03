import { describe, it, expect } from "vitest";
import { MULTIPOINT_TIME_FORMAT_MESSAGE } from "./errors";
import { HIGH_PRECISION_POINT, HIGH_PRECISION_POINT_FORMATTED } from "./coords";
import { SmhiSnowUrl, BASE_URL } from "./url";

describe("SmhiSnowUrl.times", () => {
  it("returns the times URL with the default version", () => {
    expect(SmhiSnowUrl.times()).toBe(`${BASE_URL}/version/1/times.json`);
  });

  it("returns the times URL with a custom version", () => {
    expect(SmhiSnowUrl.times("2")).toBe(`${BASE_URL}/version/2/times.json`);
  });
});

describe("SmhiSnowUrl.createdTime", () => {
  it("returns the created time URL with the default version", () => {
    expect(SmhiSnowUrl.createdTime()).toBe(
      `${BASE_URL}/version/1/createdtime.json`,
    );
  });

  it("returns the created time URL with a custom version", () => {
    expect(SmhiSnowUrl.createdTime("2")).toBe(
      `${BASE_URL}/version/2/createdtime.json`,
    );
  });
});

describe("SmhiSnowUrl.parameter", () => {
  it("returns the parameter URL with the default version", () => {
    expect(SmhiSnowUrl.parameter()).toBe(
      `${BASE_URL}/version/1/parameter.json`,
    );
  });

  it("returns the parameter URL with a custom version", () => {
    expect(SmhiSnowUrl.parameter("2")).toBe(
      `${BASE_URL}/version/2/parameter.json`,
    );
  });
});

describe("SmhiSnowUrl.getPointForecast", () => {
  it("returns the point forecast URL with formatted coordinates and default version", () => {
    expect(SmhiSnowUrl.getPointForecast(18.07, 59.33)).toBe(
      `${BASE_URL}/version/1/geotype/point/lon/18.070000/lat/59.330000/data.json`,
    );
  });

  it("returns the point forecast URL with a custom version", () => {
    expect(SmhiSnowUrl.getPointForecast(18.07, 59.33, "2")).toBe(
      `${BASE_URL}/version/2/geotype/point/lon/18.070000/lat/59.330000/data.json`,
    );
  });

  it("rounds high-precision coordinates to six decimal places in the path", () => {
    const { longitude, latitude } = HIGH_PRECISION_POINT;
    expect(SmhiSnowUrl.getPointForecast(longitude, latitude)).toBe(
      `${BASE_URL}/version/1/geotype/point/lon/${HIGH_PRECISION_POINT_FORMATTED.longitude}/lat/${HIGH_PRECISION_POINT_FORMATTED.latitude}/data.json`,
    );
  });

  it("appends a timeseries query parameter when provided", () => {
    expect(
      SmhiSnowUrl.getPointForecast(18.07, 59.33, "1", { timeseries: 1 }),
    ).toBe(
      `${BASE_URL}/version/1/geotype/point/lon/18.070000/lat/59.330000/data.json?timeseries=1`,
    );
  });

  it("appends a comma-separated parameters query parameter when provided", () => {
    expect(
      SmhiSnowUrl.getPointForecast(18.07, 59.33, "1", {
        parameters: ["air_temperature", "wind_from_direction", "wind_speed"],
      }),
    ).toBe(
      `${BASE_URL}/version/1/geotype/point/lon/18.070000/lat/59.330000/data.json?parameters=air_temperature%2Cwind_from_direction%2Cwind_speed`,
    );
  });

  it("appends a single parameters query value when one name is provided", () => {
    expect(
      SmhiSnowUrl.getPointForecast(18.07, 59.33, "1", {
        parameters: "air_temperature",
      }),
    ).toBe(
      `${BASE_URL}/version/1/geotype/point/lon/18.070000/lat/59.330000/data.json?parameters=air_temperature`,
    );
  });

  it("omits the parameters query when an empty list is provided", () => {
    expect(
      SmhiSnowUrl.getPointForecast(18.07, 59.33, "1", { parameters: [] }),
    ).toBe(
      `${BASE_URL}/version/1/geotype/point/lon/18.070000/lat/59.330000/data.json`,
    );
  });

  it("appends both query parameters when provided", () => {
    expect(
      SmhiSnowUrl.getPointForecast(18.07, 59.33, "1", {
        timeseries: 1,
        parameters: ["air_temperature", "wind_speed"],
      }),
    ).toBe(
      `${BASE_URL}/version/1/geotype/point/lon/18.070000/lat/59.330000/data.json?timeseries=1&parameters=air_temperature%2Cwind_speed`,
    );
  });
});

describe("SmhiSnowUrl.getMultipointForecast", () => {
  const multipointBase = `${BASE_URL}/version/1/geotype/multipoint/time/20260602T180000Z/parameter/air_temperature/data.json`;

  it("returns the multipoint forecast URL with compact time and default version", () => {
    expect(
      SmhiSnowUrl.getMultipointForecast("20260602T180000Z", "air_temperature"),
    ).toBe(multipointBase);
  });

  it("converts ISO time to compact format in the path", () => {
    expect(
      SmhiSnowUrl.getMultipointForecast(
        "2026-06-02T18:00:00Z",
        "air_temperature",
      ),
    ).toBe(multipointBase);
  });

  it("throws when time is not compact or ISO 8601 UTC", () => {
    expect(() =>
      SmhiSnowUrl.getMultipointForecast("not-a-time", "air_temperature"),
    ).toThrow(MULTIPOINT_TIME_FORMAT_MESSAGE);
  });

  it("returns the multipoint forecast URL with a custom version", () => {
    expect(
      SmhiSnowUrl.getMultipointForecast("20260602T180000Z", "wind_speed", "2"),
    ).toBe(
      `${BASE_URL}/version/2/geotype/multipoint/time/20260602T180000Z/parameter/wind_speed/data.json`,
    );
  });

  it("appends a downsample query parameter when provided", () => {
    expect(
      SmhiSnowUrl.getMultipointForecast(
        "20260602T180000Z",
        "air_temperature",
        "1",
        {
          downsample: 10,
        },
      ),
    ).toBe(`${multipointBase}?downsample=10`);
  });

  it("appends with-geo=false when withGeo is false", () => {
    expect(
      SmhiSnowUrl.getMultipointForecast(
        "20260602T180000Z",
        "air_temperature",
        "1",
        {
          withGeo: false,
        },
      ),
    ).toBe(`${multipointBase}?with-geo=false`);
  });

  it("does not append with-geo when withGeo is omitted", () => {
    expect(
      SmhiSnowUrl.getMultipointForecast(
        "20260602T180000Z",
        "air_temperature",
        "1",
        {},
      ),
    ).toBe(multipointBase);
  });

  it("appends both multipoint query parameters when provided", () => {
    expect(
      SmhiSnowUrl.getMultipointForecast(
        "20260602T180000Z",
        "air_temperature",
        "1",
        {
          downsample: 2,
          withGeo: false,
        },
      ),
    ).toBe(`${multipointBase}?downsample=2&with-geo=false`);
  });
});

describe("SmhiSnowUrl.geographicPolygon", () => {
  it("returns the polygon URL with the default version", () => {
    expect(SmhiSnowUrl.geographicPolygon()).toBe(
      `${BASE_URL}/version/1/geotype/polygon.json`,
    );
  });

  it("returns the polygon URL with a custom version", () => {
    expect(SmhiSnowUrl.geographicPolygon("2")).toBe(
      `${BASE_URL}/version/2/geotype/polygon.json`,
    );
  });
});

describe("SmhiSnowUrl.geographicMultipoint", () => {
  const geographicMultipointBase = `${BASE_URL}/version/1/geotype/multipoint.json`;

  it("returns the geographic multipoint URL with the default version", () => {
    expect(SmhiSnowUrl.geographicMultipoint()).toBe(geographicMultipointBase);
  });

  it("returns the geographic multipoint URL with a custom version", () => {
    expect(SmhiSnowUrl.geographicMultipoint("2")).toBe(
      `${BASE_URL}/version/2/geotype/multipoint.json`,
    );
  });

  it("appends a downsample query parameter when provided", () => {
    expect(SmhiSnowUrl.geographicMultipoint("1", { downsample: 10 })).toBe(
      `${geographicMultipointBase}?downsample=10`,
    );
  });
});

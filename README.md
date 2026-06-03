# smhi-snow

TypeScript client for the [SMHI SNOW1gv1](https://opendata.smhi.se/metfcst/snow1gv1) meteorological forecast API — the Swedish National Operational Weather (SNOW) model.

Fetch point forecasts for a coordinate, grid-wide multipoint data for a parameter and time step, and metadata about available forecast times. `SmhiSnowClient` point and multipoint forecast methods normalize SMHI missing values (`9999`) to `null`.

## Features

- **Point forecasts** — all parameters for the nearest grid cell to a lon/lat
- **Multipoint forecasts** — one parameter across Sweden, with optional downsampling
- **Geographic area** — forecast bounding polygon and static grid coordinates
- **Metadata** — available forecast times, model run timestamps, and parameter catalog (units, descriptions)
- **Type-safe** — full TypeScript types for requests and responses
- **Zero runtime dependencies** — uses the platform `fetch` API

## Installation

```bash
npm install smhi-snow
```

## Requirements

Node.js 18+ (or any environment with a global `fetch` implementation).

## Quick start

```typescript
import { SmhiSnowClient } from "smhi-snow";

const client = new SmhiSnowClient();

// Forecast for Stockholm (lon, lat in WGS84)
const forecast = await client.getPointForecast(18.07, 59.33);

for (const step of forecast.timeSeries) {
  console.log(step.time, step.data.air_temperature, "°C");
}
```

A typical workflow for grid data:

```typescript
const client = new SmhiSnowClient();

const { time } = await client.getTimes();
const grid = await client.getMultipointForecast(
  time[0],
  "air_temperature",
  "1",
  {
    downsample: 10,
    withGeo: false,
  }
);

const temperatures = grid.timeSeries[0].data.air_temperature;
```

## API

### `SmhiSnowClient`

All methods return promises and throw on network failure or non-OK HTTP status.

| Method                                                     | Description                         |
| ---------------------------------------------------------- | ----------------------------------- |
| `getCreatedTime(version?)`                                 | Latest model run and reference time |
| `getTimes(version?)`                                       | Available forecast valid times      |
| `getParameters(version?)`                                  | Parameter catalog (names, units)    |
| `getPointForecast(lon, lat, version?, query?)`             | Point forecast at a coordinate      |
| `getMultipointForecast(time, parameter, version?, query?)` | Grid data for one parameter         |
| `getGeographicPolygon(version?)`                           | Forecast area bounding polygon      |
| `getGeographicMultipoint(version?, query?)`                | Static grid point coordinates       |

Response and query types (`PointForecastResponse`, `GetPointForecastQuery`, `PointForecastParameter`, and others) are exported from the package for use in application code. JSDoc on the client, types, and URL helpers is available in the editor.

For custom `fetch` workflows or tests, use `SmhiSnowUrl` and `BASE_URL` to build the same URLs the client uses. Raw forecast JSON still contains `9999` sentinels — apply `normalizePointForecastResponse` or `normalizeMultipointForecastResponse` (both exported) before using forecast data:

```typescript
import {
  SmhiSnowUrl,
  normalizePointForecastResponse,
  type PointForecastResponseRaw,
} from "smhi-snow";

const url = SmhiSnowUrl.getPointForecast(18.07, 59.33);
const raw = (await fetch(url).then((r) =>
  r.json()
)) as PointForecastResponseRaw;
const forecast = normalizePointForecastResponse(raw);
```

`SmhiSnowClient` uses the platform `fetch` with no injectable implementation or `AbortSignal` in v1.0; pass your own `fetch` via `SmhiSnowUrl` if you need cancellation or mocking.

Errors extend `Error` and can be distinguished with `instanceof`:

| Class                     | When                                                       |
| ------------------------- | ---------------------------------------------------------- |
| `SmhiSnowNetworkError`    | `fetch` failed (DNS, timeout, etc.)                        |
| `SmhiSnowApiError`        | HTTP response was not OK (`status`, optional `body`)       |
| `SmhiSnowValidationError` | Invalid client-side query (e.g. `downsample` out of range) |

```typescript
import {
  SmhiSnowClient,
  SmhiSnowApiError,
  SmhiSnowNetworkError,
  SmhiSnowValidationError,
} from "smhi-snow";

try {
  await client.getPointForecast(18.07, 59.33);
} catch (err) {
  if (err instanceof SmhiSnowApiError) {
    console.error("HTTP", err.status, err.message);
  }
}
```

#### `getCreatedTime(version?)`

Returns when the current forecast was produced and the reference time it is based on.

```typescript
const { createdTime, referenceTime } = await client.getCreatedTime();
```

#### `getTimes(version?)`

Returns ISO 8601 valid times available for multipoint requests.

```typescript
const { time } = await client.getTimes();
// e.g. ["2026-06-02T15:00:00Z", "2026-06-02T16:00:00Z", …]
```

#### `getParameters(version?)`

Returns SMHI’s parameter catalog: names, short names, descriptions, level metadata, units, and the API missing-value sentinel (`9999`). Use this when you need authoritative units or descriptions at runtime instead of a hand-maintained table.

```typescript
const { parameter } = await client.getParameters();
const temp = parameter.find((p) => p.name === "air_temperature");
console.log(temp?.unit); // e.g. "Cel"
```

Human-readable notes (precipitation types, weather symbols, etc.) remain on the [parameter reference](https://opendata.smhi.se/metfcst/snow1gv1/parameters) page.

#### `getPointForecast(longitude, latitude, version?, query?)`

Forecast for the nearest SNOW grid point. Coordinates are rounded to six decimal places in the request URL, as required by the API.

**Query options**

| Option       | Type                              | Description                                       |
| ------------ | --------------------------------- | ------------------------------------------------- |
| `timeseries` | `number`                          | Number of time steps to return                    |
| `parameters` | `PointForecastParameter` or array | Subset of parameters (comma-separated in the URL) |

```typescript
const forecast = await client.getPointForecast(18.07, 59.33, "1", {
  timeseries: 4,
  parameters: ["air_temperature", "wind_speed"],
});

console.log(forecast.geometry.coordinates); // [lon, lat] of the grid cell used
console.log(forecast.timeSeries[0].data.wind_speed); // m/s, or null if missing
```

#### `getMultipointForecast(time, parameter, version?, query?)`

One parameter for the full Sweden grid at a given valid time. Requests `Accept-Encoding: gzip` because responses can be large.

`time` accepts ISO 8601 (`2026-06-02T18:00:00Z`) or compact form (`20260602T180000Z`).

**Query options**

| Option       | Type     | Description                                                    |
| ------------ | -------- | -------------------------------------------------------------- |
| `downsample` | `1`–`20` | Return every Nth grid cell (useful for maps; not for analysis) |
| `withGeo`    | `false`  | Omit geometry from the response                                |

```typescript
const grid = await client.getMultipointForecast(
  "2026-06-02T18:00:00Z",
  "air_temperature",
  "1",
  { downsample: 10, withGeo: false }
);
```

#### `getGeographicPolygon(version?)`

Returns the valid forecast area as a GeoJSON `Polygon`. Point forecasts must use coordinates inside this polygon; otherwise the API returns HTTP 400.

```typescript
const { type, coordinates } = await client.getGeographicPolygon();
// coordinates[0] is the outer ring: [lon, lat] pairs
```

#### `getGeographicMultipoint(version?, query?)`

Returns all SNOW grid points as a GeoJSON `MultiPoint`. The response is static. Each point index matches the value array index from `getMultipointForecast`. Requests `Accept-Encoding: gzip` (required by the API).

**Query options**

| Option       | Type     | Description                                            |
| ------------ | -------- | ------------------------------------------------------ |
| `downsample` | `1`–`20` | Return every Nth grid cell horizontally and vertically |

```typescript
const grid = await client.getGeographicMultipoint("1", { downsample: 10 });
// grid.coordinates[i] aligns with multipoint forecast value index i
```

### Forecast parameters

Point and multipoint endpoints use the same parameter names as `getParameters()` and the [SMHI parameter reference](https://opendata.smhi.se/metfcst/snow1gv1/parameters):

| Parameter                                   | Description                             |
| ------------------------------------------- | --------------------------------------- |
| `air_temperature`                           | Air temperature (°C)                    |
| `wind_from_direction`                       | Wind direction (°)                      |
| `wind_speed`                                | Wind speed (m/s)                        |
| `wind_speed_of_gust`                        | Gust wind speed (m/s)                   |
| `relative_humidity`                         | Relative humidity (%)                   |
| `air_pressure_at_mean_sea_level`            | Mean sea level pressure (hPa)           |
| `visibility_in_air`                         | Visibility (km)                         |
| `thunderstorm_probability`                  | Thunderstorm probability (%)            |
| `probability_of_frozen_precipitation`       | Probability of frozen precipitation (%) |
| `cloud_area_fraction`                       | Total cloud cover (%)                   |
| `low_type_cloud_area_fraction`              | Low cloud cover (%)                     |
| `medium_type_cloud_area_fraction`           | Medium cloud cover (%)                  |
| `high_type_cloud_area_fraction`             | High cloud cover (%)                    |
| `cloud_base_altitude`                       | Cloud base altitude (m)                 |
| `cloud_top_altitude`                        | Cloud top altitude (m)                  |
| `precipitation_amount_mean_deterministic`   | Deterministic mean precipitation (mm)   |
| `precipitation_amount_mean`                 | Mean precipitation (mm)                 |
| `precipitation_amount_min`                  | Minimum precipitation (mm)              |
| `precipitation_amount_max`                  | Maximum precipitation (mm)              |
| `precipitation_amount_median`               | Median precipitation (mm)               |
| `probability_of_precipitation`              | Probability of precipitation (%)        |
| `precipitation_frozen_part`                 | Frozen part of precipitation            |
| `predominant_precipitation_type_at_surface` | Predominant precipitation type          |
| `symbol_code`                               | Weather symbol code                     |

### Missing values

SMHI uses `9999` as a sentinel for missing data. `SmhiSnowClient` forecast methods and the exported `normalizePointForecastResponse` / `normalizeMultipointForecastResponse` helpers convert those values to `null`, so you can use nullish checks instead of magic numbers.

### Coordinates

Longitude and latitude are formatted to six decimal places in point forecast URLs. Passing high-precision floats is fine — the client rounds them the same way the API expects.

## Development

Clone the repository and install dependencies:

```bash
npm install
```

Build the package (output in `dist/`):

```bash
npm run build
```

Run unit tests (no network):

```bash
npm test
```

Integration tests call the live SMHI API:

```bash
npm run test:integration
```

Before publishing, `prepublishOnly` runs unit tests, lint, and `build`.

## Contributing and releases

`dev` is the default branch for day-to-day work. `main` is the release branch — only merge into it when you want changes to count toward a release.

When a batch of changes is ready, open a pull request from `dev` into `main`. CI runs on pull requests to both branches. Branch protection applies to `main`, not `dev`.

Use [Conventional Commits](https://www.conventionalcommits.org/) so Release Please can generate `CHANGELOG.md`:

- `feat:` — new feature (minor bump while on 0.x)
- `fix:` — bug fix (patch bump)
- `feat!:` or `BREAKING CHANGE:` in the body — breaking change

If you squash-merge `dev` → `main`, the pull request title should use these prefixes — it becomes the commit message Release Please reads.

After merges to `main`, Release Please opens or updates a release pull request (for example `chore(main): release 0.2.0`) with the version bump and changelog. **Merge that release PR with a regular merge commit** (not squash). Release Please expects its release commit to land on `main` as-is so versioning and tags stay in sync. Merging the release PR creates a GitHub Release and publishes to npm via trusted publishing.

You do not need to bump `package.json` or write the changelog by hand.

Release Please needs a repository secret **`RELEASE_PLEASE_TOKEN`**: a [fine-grained personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) scoped to this repo with:

- **Contents** — read and write
- **Pull requests** — read and write
- **Workflows** — read and write (required because releases include workflow changes under `.github/workflows/`)
- **Metadata** — read (always required)

## SMHI data license

SMHI Open Data is published under [SMHI's terms and conditions](https://www.smhi.se/data/om-smhis-data/villkor-for-anvandning). This package is an unofficial wrapper; refer to the official documentation for authoritative API behavior:

- [SNOW1gv1 API documentation](https://opendata.smhi.se/metfcst/snow1gv1)
- [Parameter reference](https://opendata.smhi.se/metfcst/snow1gv1/parameters)
- [Geographic area](https://opendata.smhi.se/metfcst/snow1gv1/geographic_area)

## License

MIT

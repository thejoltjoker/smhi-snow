import { normalizePointForecastResponse } from "./normalize";
import {
  CreatedTimeResponse,
  PointForecastResponse,
  PointForecastResponseRaw,
  TimesResponse,
} from "./types";
import { SmhiSnowUrl } from "./url";

export class SmhiSnowClient {
  private async get<T>(url: string): Promise<T> {
    let res: Response;
    try {
      res = await fetch(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`SMHI network error: ${message}`);
    }
    if (!res.ok) throw new Error(`SMHI API error: ${res.status}`);
    return res.json() as Promise<T>;
  }

  async getCreatedTime(): Promise<CreatedTimeResponse> {
    return this.get(SmhiSnowUrl.createdTime());
  }

  async getTimes(): Promise<TimesResponse> {
    return this.get(SmhiSnowUrl.times());
  }

  async getPointForecast(
    longitude: number,
    latitude: number,
    version?: string
  ): Promise<PointForecastResponse> {
    const raw = await this.get<PointForecastResponseRaw>(
      SmhiSnowUrl.getPointForecast(longitude, latitude, version)
    );
    return normalizePointForecastResponse(raw);
  }
}

export const BASE_URL =
  "https://opendata-download-metfcst.smhi.se/api/category/snow1g";
export const DEFAULT_VERSION = "1";

export class SmhiSnowUrl {
  public static times(version: string = DEFAULT_VERSION): string {
    return `${BASE_URL}/version/${version}/times.json`;
  }

  public static createdTime(version: string = DEFAULT_VERSION): string {
    return `${BASE_URL}/version/${version}/createdtime.json`;
  }

  public static getPointForecast(
    longitude: number,
    latitude: number,
    version: string = DEFAULT_VERSION
  ): string {
    const lon = longitude.toFixed(6);
    const lat = latitude.toFixed(6);
    return `${BASE_URL}/version/${version}/geotype/point/lon/${lon}/lat/${lat}/data.json`;
  }
}

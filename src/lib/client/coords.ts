/** High-precision coordinates used to verify URL rounding and live API behavior. */
export const HIGH_PRECISION_POINT = {
  longitude: 18.1929803888699,
  latitude: 62.953277300448484,
} as const;

export const HIGH_PRECISION_POINT_FORMATTED = {
  longitude: HIGH_PRECISION_POINT.longitude.toFixed(6),
  latitude: HIGH_PRECISION_POINT.latitude.toFixed(6),
} as const;

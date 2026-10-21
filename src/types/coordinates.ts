export type Coordinates = { latitude: number; longitude: number };

export function isCoordinates(value: unknown): value is Coordinates {
  if (!value || typeof value !== 'object') return false;
  const coordinates = value as Partial<Coordinates>;
  return typeof coordinates.latitude === 'number' && Number.isFinite(coordinates.latitude) &&
    coordinates.latitude >= -90 && coordinates.latitude <= 90 &&
    typeof coordinates.longitude === 'number' && Number.isFinite(coordinates.longitude) &&
    coordinates.longitude >= -180 && coordinates.longitude <= 180;
}

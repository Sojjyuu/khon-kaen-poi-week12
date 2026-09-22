import { Asset, requestPermissionsAsync } from 'expo-media-library';

export async function requestPhotoSavePermission(): Promise<boolean> {
  const permission = await requestPermissionsAsync(true);
  return permission.status === 'granted';
}

export async function savePhotoToLibrary(uri: string): Promise<void> {
  await Asset.create(uri);
}

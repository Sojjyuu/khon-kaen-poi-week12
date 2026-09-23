import * as MediaLibrary from 'expo-media-library/legacy';

export async function requestPhotoSavePermission(): Promise<boolean> {
  const permission = await MediaLibrary.requestPermissionsAsync(true);
  return permission.status === 'granted';
}

export async function savePhotoToLibrary(uri: string): Promise<void> {
  await MediaLibrary.saveToLibraryAsync(uri);
}

export async function requestPhotoSavePermission(): Promise<boolean> {
  return false;
}

export async function savePhotoToLibrary(_uri: string): Promise<void> {
  throw new Error('media-library-unavailable-on-web');
}

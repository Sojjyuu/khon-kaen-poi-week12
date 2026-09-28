import * as ImagePicker from 'expo-image-picker';

export async function chooseAccountPhoto(maxBytes = 500_000): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'], allowsEditing: true, quality: 0.4, base64: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset?.base64) throw new Error('อ่านรูปไม่ได้ กรุณาเลือกรูปใหม่');
  const type = asset.base64.startsWith('/9j/') ? 'jpeg' : asset.base64.startsWith('iVBORw0KGgo') ? 'png' : null;
  if (!type) throw new Error('เลือกรูป JPEG หรือ PNG');
  if (asset.base64.length * 3 / 4 > maxBytes) throw new Error(`รูปใหญ่เกิน ${maxBytes / 1000000} MB กรุณาครอปหรือเลือกรูปที่เล็กลง`);
  return `data:image/${type};base64,${asset.base64}`;
}

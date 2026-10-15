export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export async function validateImage(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Choose a JPEG, PNG or WebP image');
  if (file.size > MAX_IMAGE_BYTES || file.size === 0)
    throw new Error('Image must be non-empty and under 2 MB');
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp =
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (!(
    (file.type === 'image/png' && png) ||
    (file.type === 'image/jpeg' && jpeg) ||
    (file.type === 'image/webp' && webp)
  ))
    throw new Error('The image content does not match its file type');
}
export async function dataUrl(file: File): Promise<string> {
  await validateImage(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}

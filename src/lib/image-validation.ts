export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const imageExtensions: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif",
};

export function imageValidationError(file: { size: number; type: string }) {
  if (!imageExtensions[file.type]) return "El archivo debe ser JPEG, PNG, WebP o AVIF.";
  if (file.size === 0) return "La imagen está vacía.";
  if (file.size > MAX_IMAGE_BYTES) return "La imagen no puede superar 5 MB.";
  return null;
}

export function matchesImageType(bytes: Uint8Array, mime: string) {
  const text = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png") return [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  if (mime === "image/webp") return text(0, 4) === "RIFF" && text(8, 12) === "WEBP";
  if (mime === "image/avif") {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (bytes.length < 16 || text(4, 8) !== "ftyp") return false;
    const end = Math.min(view.getUint32(0), bytes.length, 128);
    for (let offset = 8; offset + 4 <= end; offset += 4) {
      if (offset !== 12 && ["avif", "avis"].includes(text(offset, offset + 4))) return true;
    }
  }
  return false;
}

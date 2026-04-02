export function normalizeInstagramHandle(input: string): string {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
    .replace(/^@/, "");

  return cleaned.split(/[/?#]/)[0].replace(/[^a-z0-9._]/g, "");
}

export function isValidInstagramHandle(handle: string): boolean {
  return /^[a-z0-9._]{3,30}$/.test(handle);
}

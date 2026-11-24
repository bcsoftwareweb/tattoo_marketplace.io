export function normalizeHashtag(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^#+/, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function parseHashtags(value: string) {
  const found = value.match(/(^|\s)#[a-zA-Z0-9][a-zA-Z0-9_-]*/g) ?? [];
  const tags = found.map((match) => normalizeHashtag(match)).filter(Boolean);
  return [...new Set(tags)].slice(0, 12);
}

export function hashtagLabel(tag: string) {
  return `#${normalizeHashtag(tag)}`;
}

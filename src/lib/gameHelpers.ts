export const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const normalizeGameName = (value: string) => value.trim().toLowerCase();

export const isValidHexColor = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);

export const shortLabel = (value: string, maxLength: number) => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trimEnd()}...`;
};

export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

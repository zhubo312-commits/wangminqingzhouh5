export function firstCodePoint(value: string): number | null {
  const values = [...value];
  if (values.length !== 1) return null;
  return values[0]!.codePointAt(0) ?? null;
}

export function plainPinyin(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u0304\u0306-\u036f]/g, "")
    .normalize("NFC")
    .toLowerCase();
}

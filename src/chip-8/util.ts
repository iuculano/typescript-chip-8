export function formatHex(value: number, digits: number): string {
  return `$${value.toString(16).toUpperCase().padStart(digits, '0')}`;
}

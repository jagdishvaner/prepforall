/**
 * Format a number as a percentage string (e.g., 45.2%).
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format runtime in milliseconds (e.g., "12 ms", "1.2 s").
 */
export function formatRuntime(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

/**
 * Format memory in kilobytes (e.g., "256 KB", "1.2 MB").
 */
export function formatMemory(kb: number): string {
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/**
 * Capitalize first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

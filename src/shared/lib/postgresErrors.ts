/** FK `restrict`: el registro tiene otras filas que dependen de él. */
export function isForeignKeyViolation(error: unknown): boolean {
  return hasCode(error, '23503');
}

/** `unique_violation`: típicamente un reintento con el mismo `client_id`. */
export function isUniqueViolation(error: unknown): boolean {
  return hasCode(error, '23505');
}

function hasCode(error: unknown, code: string): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === code);
}

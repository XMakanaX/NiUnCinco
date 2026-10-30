/**
 * `client_id` determinístico para una fila importada: mismo archivo
 * importado dos veces produce el mismo UUID por fila, así que el
 * `unique(user_id, client_id)` de `transactions` (Fase 4/6) rechaza el
 * duplicado exacto sin necesidad de una tabla ni columna nueva — mismo
 * mecanismo de idempotencia que ya usa la cola offline de quick-expense,
 * aplicado aquí a una huella de datos en vez de un UUID aleatorio.
 */
export async function computeFingerprint(parts: readonly string[]): Promise<string> {
  const data = new TextEncoder().encode(parts.join(''));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20, 32)].join('-');
}

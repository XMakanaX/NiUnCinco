import { describe, expect, it } from 'vitest';
import { computeFingerprint } from './fingerprint';

describe('computeFingerprint', () => {
  it('es determinístico: mismas partes producen el mismo id', async () => {
    const a = await computeFingerprint(['acc-1', '2026-10-30', '1000', 'CRC', 'expense', 'Soda']);
    const b = await computeFingerprint(['acc-1', '2026-10-30', '1000', 'CRC', 'expense', 'Soda']);
    expect(a).toBe(b);
  });

  it('produce un UUID válido', async () => {
    const id = await computeFingerprint(['x']);
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('cambia si cualquier parte cambia', async () => {
    const a = await computeFingerprint(['acc-1', '2026-10-30', '1000', 'CRC', 'expense', 'Soda']);
    const b = await computeFingerprint(['acc-1', '2026-10-30', '1000', 'CRC', 'expense', 'Pulpería']);
    expect(a).not.toBe(b);
  });
});

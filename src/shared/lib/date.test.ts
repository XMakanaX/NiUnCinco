import { describe, expect, it } from 'vitest';
import { toDateOnly } from './date';

describe('toDateOnly', () => {
  it('no salta de día cerca de medianoche UTC (borde America/Costa_Rica, UTC-6)', () => {
    // 2025-01-01 04:30 UTC = 2024-12-31 22:30 en Costa Rica: debe quedar en 2024-12-31.
    const date = new Date('2025-01-01T04:30:00Z');
    expect(toDateOnly(date)).toBe('2024-12-31');
  });

  it('no salta de mes en fin de mes', () => {
    // 2025-02-01 05:00 UTC = 2025-01-31 23:00 en Costa Rica.
    const date = new Date('2025-02-01T05:00:00Z');
    expect(toDateOnly(date)).toBe('2025-01-31');
  });
});

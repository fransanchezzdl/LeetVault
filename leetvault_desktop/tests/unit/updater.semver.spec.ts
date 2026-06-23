import { describe, it, expect } from 'vitest';
import { compareVersions } from '../../src/main/updater/semver';

describe('compareVersions', () => {
  it('returns 1 when a > b across major', () => {
    expect(compareVersions('3.0.0', '2.9.9')).toBe(1);
  });

  it('returns 1 when a > b across patch with two-digit segment', () => {
    expect(compareVersions('2.3.0', '2.2.9')).toBe(1);
    expect(compareVersions('2.10.0', '2.9.0')).toBe(1);
  });

  it('returns 0 when a == b', () => {
    expect(compareVersions('2.3.0', '2.3.0')).toBe(0);
  });

  it('returns -1 when a < b', () => {
    expect(compareVersions('2.3.0', '2.10.0')).toBe(-1);
  });

  it('strips v prefix on either side', () => {
    expect(compareVersions('v2.3.0', '2.3.0')).toBe(0);
    expect(compareVersions('v2.4.0', 'v2.3.0')).toBe(1);
  });

  it('returns 0 for malformed input (non-numeric segment)', () => {
    expect(compareVersions('2.3.0-beta.1', '2.3.0')).toBe(0);
    expect(compareVersions('garbage', '2.3.0')).toBe(0);
  });
});

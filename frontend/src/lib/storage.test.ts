import { getStudentId, setStudentId, clearStudentId, isValidBrn } from './storage';

describe('storage utility (BRN & localStorage)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('isValidBrn', () => {
    it('returns true for a valid 17-digit numeric string', () => {
      expect(isValidBrn('12345678901234567')).toBe(true);
      expect(isValidBrn('20051234567890123')).toBe(true);
    });

    it('returns false for strings shorter than 17 digits', () => {
      expect(isValidBrn('1234567890123456')).toBe(false);
      expect(isValidBrn('')).toBe(false);
    });

    it('returns false for strings longer than 17 digits', () => {
      expect(isValidBrn('123456789012345678')).toBe(false);
    });

    it('returns false for non-numeric characters', () => {
      expect(isValidBrn('1234567890123456a')).toBe(false);
      expect(isValidBrn('1234567-890123456')).toBe(false);
      expect(isValidBrn(' 1234567890123456')).toBe(false);
    });
  });

  describe('getStudentId / setStudentId / clearStudentId', () => {
    it('stores and retrieves BRN in localStorage', () => {
      expect(getStudentId()).toBeNull();
      setStudentId('20011234567890123');
      expect(getStudentId()).toBe('20011234567890123');
    });

    it('clears BRN from localStorage', () => {
      setStudentId('20011234567890123');
      expect(getStudentId()).toBe('20011234567890123');
      clearStudentId();
      expect(getStudentId()).toBeNull();
    });
  });
});


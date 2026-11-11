import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrnInput } from './BrnInput';
import { getStudentId } from '@/lib/storage';

describe('BrnInput Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders input field with placeholder', () => {
    render(<BrnInput />);
    const input = screen.getByPlaceholderText('17-digit BRN');
    expect(input).toBeInTheDocument();
  });

  it('only allows numeric input and filters out alphabets/symbols', () => {
    render(<BrnInput />);
    const input = screen.getByPlaceholderText('17-digit BRN') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'abc123xyz45' } });
    expect(input.value).toBe('12345');
  });

  it('truncates input at 17 digits max', () => {
    render(<BrnInput />);
    const input = screen.getByPlaceholderText('17-digit BRN') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '1234567890123456789999' } });
    expect(input.value).toBe('12345678901234567');
  });

  it('shows countdown of digits remaining when incomplete', () => {
    render(<BrnInput />);
    const input = screen.getByPlaceholderText('17-digit BRN');

    fireEvent.change(input, { target: { value: '12345' } });
    expect(screen.getByText('12 digits left')).toBeInTheDocument();
  });

  it('automatically saves to localStorage when a valid 17-digit BRN is entered', () => {
    render(<BrnInput />);
    const input = screen.getByPlaceholderText('17-digit BRN');

    fireEvent.change(input, { target: { value: '12345678901234567' } });
    expect(getStudentId()).toBe('12345678901234567');
  });

  it('preloads saved BRN from localStorage on mount', () => {
    localStorage.setItem('school_admission_student_id', '98765432109876543');
    render(<BrnInput />);
    const input = screen.getByPlaceholderText('17-digit BRN') as HTMLInputElement;
    expect(input.value).toBe('98765432109876543');
  });
});

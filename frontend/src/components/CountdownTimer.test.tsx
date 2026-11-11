import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { CountdownTimer } from './CountdownTimer';

describe('CountdownTimer Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('displays formatted mm:ss remaining time correctly', () => {
    const futureDate = new Date(Date.now() + 125 * 1000).toISOString(); // 2 minutes 5 seconds
    render(<CountdownTimer expiresAt={futureDate} />);

    expect(screen.getByText('02:05')).toBeInTheDocument();
  });

  it('counts down second by second', () => {
    const futureDate = new Date(Date.now() + 10 * 1000).toISOString(); // 10 seconds
    render(<CountdownTimer expiresAt={futureDate} />);

    expect(screen.getByText('00:10')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.getByText('00:07')).toBeInTheDocument();
  });

  it('displays EXPIRED and calls onExpired callback when time runs out', () => {
    const onExpiredMock = jest.fn();
    const futureDate = new Date(Date.now() + 2 * 1000).toISOString(); // 2 seconds
    render(<CountdownTimer expiresAt={futureDate} onExpired={onExpiredMock} />);

    expect(screen.getByText('00:02')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2500);
    });

    expect(screen.getByText('EXPIRED')).toBeInTheDocument();
    expect(onExpiredMock).toHaveBeenCalledTimes(1);
  });

  it('renders EXPIRED immediately if target time is in the past', () => {
    const pastDate = new Date(Date.now() - 5000).toISOString();
    render(<CountdownTimer expiresAt={pastDate} />);

    expect(screen.getByText('EXPIRED')).toBeInTheDocument();
  });
});


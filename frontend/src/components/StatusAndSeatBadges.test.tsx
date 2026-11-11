import React from 'react';
import { render, screen } from '@testing-library/react';
import { HoldStatusBadge } from './HoldStatusBadge';
import { SeatProgressBar } from './SeatProgressBar';

describe('HoldStatusBadge Component', () => {
  it('renders Held badge correctly', () => {
    render(<HoldStatusBadge status="HELD" />);
    expect(screen.getByText('Held')).toBeInTheDocument();
  });

  it('renders Confirmed badge correctly', () => {
    render(<HoldStatusBadge status="CONFIRMED" />);
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('renders Expired badge correctly', () => {
    render(<HoldStatusBadge status="EXPIRED" />);
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('renders Cancelled badge correctly', () => {
    render(<HoldStatusBadge status="CANCELLED" />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });
});

describe('SeatProgressBar Component', () => {
  it('displays accurate counts for confirmed, held, and available seats', () => {
    render(
      <SeatProgressBar
        totalSeats={50}
        confirmedSeats={20}
        heldSeats={10}
        availableSeats={20}
      />
    );

    expect(screen.getByText('Confirmed: 20')).toBeInTheDocument();
    expect(screen.getByText('Held: 10')).toBeInTheDocument();
    expect(screen.getByText('Available: 20')).toBeInTheDocument();
  });
});

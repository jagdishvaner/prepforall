import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimerDisplay } from './TimerDisplay';

describe('TimerDisplay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders time in HH:MM:SS format', () => {
    const endTime = new Date(Date.now() + 3661000); // 1h 1m 1s
    render(<TimerDisplay endTime={endTime} />);
    expect(screen.getByText('01:01:01')).toBeTruthy();
  });

  it('renders 00:00:00 when expired', () => {
    const endTime = new Date(Date.now() - 1000);
    render(<TimerDisplay endTime={endTime} />);
    expect(screen.getByText('00:00:00')).toBeTruthy();
  });

  it('has warning class when under threshold', () => {
    const endTime = new Date(Date.now() + 60_000); // 1 minute left
    const { container } = render(<TimerDisplay endTime={endTime} warningThresholdMs={5 * 60_000} />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('has destructive class when expired', () => {
    const endTime = new Date(Date.now() - 1000);
    const { container } = render(<TimerDisplay endTime={endTime} />);
    expect(container.firstChild).toHaveClass('text-destructive');
  });
});

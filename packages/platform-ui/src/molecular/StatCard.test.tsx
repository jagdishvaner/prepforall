import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('renders title and value', () => {
    render(<StatCard title="Problems Solved" value={42} />);
    expect(screen.getByText('Problems Solved')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('renders subtitle', () => {
    render(<StatCard title="Score" value={100} subtitle="out of 200" />);
    expect(screen.getByText('out of 200')).toBeTruthy();
  });

  it('renders positive trend', () => {
    render(<StatCard title="Score" value={100} trend={{ value: 5, label: 'this week' }} />);
    expect(screen.getByText('+5% this week')).toBeTruthy();
  });

  it('renders negative trend', () => {
    render(<StatCard title="Score" value={100} trend={{ value: -3, label: 'today' }} />);
    expect(screen.getByText('-3% today')).toBeTruthy();
  });

  it('renders icon', () => {
    render(<StatCard title="Score" value={100} icon={<span data-testid="icon">I</span>} />);
    expect(screen.getByTestId('icon')).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(<StatCard title="T" value={0} className="extra" />);
    expect(container.firstChild).toHaveClass('extra');
  });
});

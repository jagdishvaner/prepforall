import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LeaderboardTable, type LeaderboardEntry } from './LeaderboardTable';

const mockData: LeaderboardEntry[] = [
  { rank: 1, userId: 'u1', username: 'alice', score: 300, problemsSolved: 3, penalty: 120 },
  { rank: 2, userId: 'u2', username: 'bob', score: 200, problemsSolved: 2, penalty: 90 },
];

describe('LeaderboardTable', () => {
  it('renders header columns', () => {
    render(<LeaderboardTable data={mockData} />);
    expect(screen.getByText('#')).toBeTruthy();
    expect(screen.getByText('User')).toBeTruthy();
    expect(screen.getByText('Score')).toBeTruthy();
    expect(screen.getByText('Solved')).toBeTruthy();
    expect(screen.getByText('Penalty')).toBeTruthy();
  });

  it('renders data rows', () => {
    render(<LeaderboardTable data={mockData} />);
    expect(screen.getByText('alice')).toBeTruthy();
    expect(screen.getByText('bob')).toBeTruthy();
    expect(screen.getByText('300')).toBeTruthy();
  });

  it('calls onRowClick when clicking a row', () => {
    const onClick = vi.fn();
    render(<LeaderboardTable data={mockData} onRowClick={onClick} />);
    fireEvent.click(screen.getByText('alice'));
    expect(onClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('handles empty data', () => {
    render(<LeaderboardTable data={[]} />);
    expect(screen.getByText('#')).toBeTruthy();
  });
});

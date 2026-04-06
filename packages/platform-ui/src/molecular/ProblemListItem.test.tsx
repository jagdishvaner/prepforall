import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProblemListItem } from './ProblemListItem';

describe('ProblemListItem', () => {
  const baseProps = {
    index: 1,
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'easy' as const,
    acceptanceRate: 45.5,
    tags: ['Array', 'Hash Table'],
  };

  it('renders title and acceptance rate', () => {
    render(
      <table><tbody><ProblemListItem {...baseProps} /></tbody></table>
    );
    expect(screen.getByText('Two Sum')).toBeTruthy();
    expect(screen.getByText('45.5%')).toBeTruthy();
  });

  it('renders difficulty tag', () => {
    render(
      <table><tbody><ProblemListItem {...baseProps} /></tbody></table>
    );
    expect(screen.getByText('Easy')).toBeTruthy();
  });

  it('renders tags (max 2)', () => {
    render(
      <table><tbody><ProblemListItem {...baseProps} tags={['Array', 'Hash Table', 'Extra']} /></tbody></table>
    );
    expect(screen.getByText('Array')).toBeTruthy();
    expect(screen.getByText('Hash Table')).toBeTruthy();
    expect(screen.queryByText('Extra')).toBeNull();
  });

  it('shows checkmark for solved problems', () => {
    render(
      <table><tbody><ProblemListItem {...baseProps} isSolved /></tbody></table>
    );
    expect(screen.getByText('\u2713')).toBeTruthy();
  });

  it('calls onNavigate with slug on click', () => {
    const onNavigate = vi.fn();
    render(
      <table><tbody><ProblemListItem {...baseProps} onNavigate={onNavigate} /></tbody></table>
    );
    fireEvent.click(screen.getByText('Two Sum'));
    expect(onNavigate).toHaveBeenCalledWith('two-sum');
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DifficultyTag, type Difficulty } from './DifficultyTag';

describe('DifficultyTag', () => {
  const cases: { difficulty: Difficulty; expected: string }[] = [
    { difficulty: 'easy', expected: 'Easy' },
    { difficulty: 'medium', expected: 'Medium' },
    { difficulty: 'hard', expected: 'Hard' },
  ];

  cases.forEach(({ difficulty, expected }) => {
    it(`renders capitalized label "${expected}" for ${difficulty}`, () => {
      render(<DifficultyTag difficulty={difficulty} />);
      expect(screen.getByText(expected)).toBeTruthy();
    });
  });

  it('applies custom className', () => {
    const { container } = render(<DifficultyTag difficulty="easy" className="my-custom" />);
    expect(container.firstChild).toHaveClass('my-custom');
  });
});

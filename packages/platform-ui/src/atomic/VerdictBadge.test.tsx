import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VerdictBadge, type Verdict } from './VerdictBadge';

const verdicts: { verdict: Verdict; label: string }[] = [
  { verdict: 'AC', label: 'Accepted' },
  { verdict: 'WA', label: 'Wrong Answer' },
  { verdict: 'TLE', label: 'Time Limit Exceeded' },
  { verdict: 'MLE', label: 'Memory Limit Exceeded' },
  { verdict: 'RE', label: 'Runtime Error' },
  { verdict: 'CE', label: 'Compilation Error' },
  { verdict: 'PENDING', label: 'Pending' },
  { verdict: 'RUNNING', label: 'Running' },
];

describe('VerdictBadge', () => {
  verdicts.forEach(({ verdict, label }) => {
    it(`renders "${label}" for verdict ${verdict}`, () => {
      render(<VerdictBadge verdict={verdict} />);
      expect(screen.getByText(label)).toBeTruthy();
    });
  });

  it('renders short code when showLabel=false', () => {
    render(<VerdictBadge verdict="AC" showLabel={false} />);
    expect(screen.getByText('AC')).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(<VerdictBadge verdict="AC" className="my-custom" />);
    expect(container.firstChild).toHaveClass('my-custom');
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubmissionPanel, type SubmissionResult, type TestCaseItem } from './SubmissionPanel';

describe('SubmissionPanel', () => {
  it('renders judging state', () => {
    render(<SubmissionPanel result={null} isJudging testCases={[]} />);
    expect(screen.getByText('Judge is evaluating your code...')).toBeTruthy();
  });

  it('renders test case buttons when no result and not judging', () => {
    const testCases: TestCaseItem[] = [
      { id: '1', input: '1 2', expectedOutput: '3' },
      { id: '2', input: '3 4', expectedOutput: '7' },
    ];
    render(<SubmissionPanel result={null} isJudging={false} testCases={testCases} />);
    expect(screen.getByText('Case 1')).toBeTruthy();
    expect(screen.getByText('Case 2')).toBeTruthy();
  });

  it('calls onSelectTestCase when clicking a test case', () => {
    const onSelect = vi.fn();
    const testCases: TestCaseItem[] = [{ id: '1', input: '1 2', expectedOutput: '3' }];
    render(
      <SubmissionPanel result={null} isJudging={false} testCases={testCases} onSelectTestCase={onSelect} />
    );
    fireEvent.click(screen.getByText('Case 1'));
    expect(onSelect).toHaveBeenCalledWith('1');
  });

  it('renders result with verdict badge', () => {
    const result: SubmissionResult = {
      verdict: 'AC',
      runtimeMs: 50,
      memoryKb: 2048,
      passedCases: 10,
      totalCases: 10,
    };
    render(<SubmissionPanel result={result} isJudging={false} testCases={[]} />);
    expect(screen.getByText('Accepted')).toBeTruthy();
    expect(screen.getByText('Runtime: 50ms')).toBeTruthy();
    expect(screen.getByText('Memory: 2.0MB')).toBeTruthy();
    expect(screen.getByText('10/10 passed')).toBeTruthy();
  });

  it('renders error message', () => {
    const result: SubmissionResult = {
      verdict: 'CE',
      passedCases: 0,
      totalCases: 5,
      errorMsg: 'syntax error on line 1',
    };
    render(<SubmissionPanel result={result} isJudging={false} testCases={[]} />);
    expect(screen.getByText('syntax error on line 1')).toBeTruthy();
  });
});

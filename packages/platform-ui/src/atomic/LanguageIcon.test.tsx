import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguageIcon, type Language } from './LanguageIcon';

describe('LanguageIcon', () => {
  const languages: { lang: Language; label: string }[] = [
    { lang: 'cpp', label: 'C++' },
    { lang: 'c', label: 'C' },
    { lang: 'java', label: 'Java' },
    { lang: 'python', label: 'Python' },
    { lang: 'javascript', label: 'JS' },
    { lang: 'go', label: 'Go' },
    { lang: 'postgresql', label: 'SQL' },
  ];

  languages.forEach(({ lang, label }) => {
    it(`renders label "${label}" for language ${lang}`, () => {
      render(<LanguageIcon language={lang} />);
      expect(screen.getByText(label)).toBeTruthy();
    });
  });

  it('hides label when showLabel=false', () => {
    const { container } = render(<LanguageIcon language="cpp" showLabel={false} />);
    expect(container.textContent).toBe('');
  });
});

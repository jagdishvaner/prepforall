import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CodeEditor } from './CodeEditor';

vi.mock('@monaco-editor/react', () => ({
  default: (props: Record<string, unknown>) => (
    <div data-testid="monaco-editor" data-language={props.language} data-theme={props.theme}>
      {String(props.value)}
    </div>
  ),
}));

describe('CodeEditor', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(
      <CodeEditor value="console.log('hello')" language="javascript" />
    );
    expect(getByTestId('monaco-editor')).toBeTruthy();
  });

  it('passes language to Monaco', () => {
    const { getByTestId } = render(
      <CodeEditor value="" language="python" />
    );
    expect(getByTestId('monaco-editor').dataset.language).toBe('python');
  });

  it('passes theme to Monaco', () => {
    const { getByTestId } = render(
      <CodeEditor value="" language="cpp" theme="light" />
    );
    expect(getByTestId('monaco-editor').dataset.theme).toBe('light');
  });

  it('renders code value', () => {
    const { getByTestId } = render(
      <CodeEditor value="int main() {}" language="cpp" />
    );
    expect(getByTestId('monaco-editor').textContent).toBe('int main() {}');
  });
});

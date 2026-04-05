import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EditorTheme = 'vs-dark' | 'light';

interface EditorState {
  language: string;
  theme: EditorTheme;
  fontSize: number;
  tabSize: number;
  // Map<slug, Map<language, code>>
  savedCodes: Record<string, Record<string, string>>;

  setLanguage: (lang: string) => void;
  setTheme: (theme: EditorTheme) => void;
  setFontSize: (size: number) => void;
  setCode: (slug: string, language: string, code: string) => void;
  getCode: (slug: string, language: string) => string;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      language: 'cpp',
      theme: 'vs-dark',
      fontSize: 14,
      tabSize: 4,
      savedCodes: {},

      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setCode: (slug, language, code) =>
        set((state) => ({
          savedCodes: {
            ...state.savedCodes,
            [slug]: { ...state.savedCodes[slug], [language]: code },
          },
        })),
      getCode: (slug, language) => get().savedCodes[slug]?.[language] ?? '',
    }),
    { name: 'prepforall-editor' }
  )
);

export const SUPPORTED_LANGUAGES = [
  { value: 'cpp', label: 'C++', monacoId: 'cpp' },
  { value: 'c', label: 'C', monacoId: 'c' },
  { value: 'java', label: 'Java', monacoId: 'java' },
  { value: 'python', label: 'Python 3', monacoId: 'python' },
  { value: 'javascript', label: 'JavaScript', monacoId: 'javascript' },
  { value: 'go', label: 'Go', monacoId: 'go' },
  { value: 'postgresql', label: 'PostgreSQL', monacoId: 'pgsql' },
];

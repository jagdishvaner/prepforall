import { create } from "zustand";
import { persist } from "zustand/middleware";

interface EditorState {
  language: string;
  theme: "vs-dark" | "light";
  fontSize: number;
  tabSize: number;
  code: Record<string, string>; // slug → code draft
  setLanguage: (lang: string) => void;
  setTheme: (theme: "vs-dark" | "light") => void;
  setFontSize: (size: number) => void;
  setCode: (slug: string, code: string) => void;
  getCode: (slug: string) => string;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      language: "cpp",
      theme: "vs-dark",
      fontSize: 14,
      tabSize: 4,
      code: {},
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setCode: (slug, code) =>
        set((state) => ({ code: { ...state.code, [slug]: code } })),
      getCode: (slug) => get().code[slug] ?? "",
    }),
    { name: "prepforall-editor" }
  )
);

export const SUPPORTED_LANGUAGES = [
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "java", label: "Java" },
  { value: "python", label: "Python 3" },
  { value: "javascript", label: "JavaScript" },
  { value: "go", label: "Go" },
];

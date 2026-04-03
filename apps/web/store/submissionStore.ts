import { create } from "zustand";
import type { Submission } from "@/types";

interface SubmissionState {
  activeSubmissionId: string | null;
  latestResult: Submission | null;
  isSubmitting: boolean;
  setActiveSubmission: (id: string | null) => void;
  setLatestResult: (result: Submission | null) => void;
  setIsSubmitting: (v: boolean) => void;
}

export const useSubmissionStore = create<SubmissionState>((set) => ({
  activeSubmissionId: null,
  latestResult: null,
  isSubmitting: false,
  setActiveSubmission: (id) => set({ activeSubmissionId: id }),
  setLatestResult: (result) => set({ latestResult: result }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
}));

"use client";

import { useRef, type FormEvent } from "react";

export interface ContactFormFields {
  name: string;
  email: string;
  subject?: string;
  phone?: string;
  institution?: string;
  studentCount?: string;
  message: string;
}

export interface ContactFormProps {
  fields: Array<{
    name: keyof ContactFormFields;
    label: string;
    type: "text" | "email" | "tel" | "textarea" | "select";
    placeholder: string;
    required?: boolean;
    options?: string[];
  }>;
  submitLabel: string;
  onSubmit: (data: FormData) => void | Promise<void>;
  pending?: boolean;
  successMessage?: string;
}

export function ContactForm({
  fields,
  submitLabel,
  onSubmit,
  pending = false,
  successMessage,
}: ContactFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await onSubmit(formData);
    formRef.current?.reset();
  };

  if (successMessage) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <p className="text-lg font-semibold text-green-800">{successMessage}</p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {fields.map((field) => (
        <div key={field.name}>
          <label
            htmlFor={field.name}
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            {field.label}
            {field.required && <span className="text-red-500"> *</span>}
          </label>
          {field.type === "textarea" ? (
            <textarea
              id={field.name}
              name={field.name}
              placeholder={field.placeholder}
              required={field.required}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            />
          ) : field.type === "select" ? (
            <select
              id={field.name}
              name={field.name}
              required={field.required}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            >
              <option value="">{field.placeholder}</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              required={field.required}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            />
          )}
        </div>
      ))}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
      >
        {pending ? "Sending..." : submitLabel}
      </button>
    </form>
  );
}

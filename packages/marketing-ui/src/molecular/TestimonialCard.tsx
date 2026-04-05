/* eslint-disable @next/next/no-img-element */

export interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
  institution: string;
  photoUrl: string;
}

export function TestimonialCard({
  quote,
  name,
  role,
  institution,
  photoUrl,
}: TestimonialCardProps) {
  return (
    <div className="mx-auto max-w-3xl rounded-2xl bg-white p-10 shadow-sm">
      <div className="text-center">
        {/* Large quote mark */}
        <div className="mb-6 text-5xl leading-none text-brand-primary">&ldquo;</div>
        <blockquote className="text-xl leading-relaxed text-text-primary md:text-2xl">
          {quote}
        </blockquote>
        <div className="mt-8 flex items-center justify-center gap-4">
          <img
            src={photoUrl}
            alt={name}
            width={56}
            height={56}
            className="h-14 w-14 rounded-full object-cover ring-2 ring-brand-primary/20"
          />
          <div className="text-left">
            <p className="font-semibold text-text-primary">{name}</p>
            <p className="text-sm text-text-secondary">
              {role}, {institution}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

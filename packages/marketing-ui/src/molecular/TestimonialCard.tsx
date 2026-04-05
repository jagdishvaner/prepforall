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
    <div className="mx-auto max-w-2xl text-center">
      <blockquote className="text-xl leading-relaxed text-gray-700 md:text-2xl">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <div className="mt-8 flex items-center justify-center gap-4">
        <img
          src={photoUrl}
          alt={name}
          width={56}
          height={56}
          className="h-14 w-14 rounded-full object-cover"
        />
        <div className="text-left">
          <p className="font-semibold text-gray-900">{name}</p>
          <p className="text-sm text-gray-500">
            {role}, {institution}
          </p>
        </div>
      </div>
    </div>
  );
}

export interface PricingCardProps {
  tier: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  popular?: boolean;
}

export function PricingCard({
  tier,
  description,
  features,
  ctaLabel,
  ctaHref,
  popular = false,
}: PricingCardProps) {
  return (
    <div
      className={`relative rounded-2xl border p-8 ${
        popular
          ? "border-brand-primary bg-white shadow-lg ring-2 ring-brand-primary"
          : "border-gray-200 bg-white"
      }`}
    >
      {popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-primary px-4 py-1 text-xs font-semibold text-white">
          Most Popular
        </span>
      )}
      <h3 className="text-xl font-bold text-gray-900">{tier}</h3>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
      <ul className="mt-8 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
      <a
        href={ctaHref}
        className={`mt-8 block w-full rounded-lg py-3 text-center text-sm font-semibold transition-colors ${
          popular
            ? "bg-brand-primary text-white hover:bg-brand-primary/90"
            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
        }`}
      >
        {ctaLabel}
      </a>
    </div>
  );
}

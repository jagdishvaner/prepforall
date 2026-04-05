"use client";

import { useState } from "react";
import { SectionWrapper } from "../atomic/SectionWrapper";
import { SectionHeading } from "../atomic/SectionHeading";
import { TestimonialCard, type TestimonialCardProps } from "../molecular/TestimonialCard";

export interface TestimonialCarouselProps {
  heading: string;
  testimonials: TestimonialCardProps[];
}

export function TestimonialCarousel({
  heading,
  testimonials,
}: TestimonialCarouselProps) {
  const [current, setCurrent] = useState(0);

  return (
    <SectionWrapper background="gray">
      <SectionHeading>{heading}</SectionHeading>
      <TestimonialCard {...testimonials[current]} />
      <div className="mt-8 flex justify-center gap-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              index === current ? "bg-brand-primary" : "bg-gray-300"
            }`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>
    </SectionWrapper>
  );
}

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
    <SectionWrapper background="salmon">
      <SectionHeading>{heading}</SectionHeading>
      <TestimonialCard {...testimonials[current]} />
      <div className="mt-10 flex justify-center gap-3">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-3 w-3 rounded-full transition-all ${
              index === current
                ? "bg-brand-primary scale-110"
                : "bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>
    </SectionWrapper>
  );
}

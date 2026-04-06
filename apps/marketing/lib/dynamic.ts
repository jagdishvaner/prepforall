import dynamic from "next/dynamic";

export const DynamicProductPreview = dynamic(
  () =>
    import("@prepforall/marketing-ui/organisms").then(
      (mod) => mod.ProductPreview
    ),
  { ssr: false, loading: () => null }
);

export const DynamicTestimonialCarousel = dynamic(
  () =>
    import("@prepforall/marketing-ui/organisms").then(
      (mod) => mod.TestimonialCarousel
    ),
  { ssr: false, loading: () => null }
);

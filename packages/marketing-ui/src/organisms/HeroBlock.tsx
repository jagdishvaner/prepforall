/* eslint-disable @next/next/no-img-element */

export interface HeroBlockProps {
  heading: string;
  subtext: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  screenshotSrc: string;
  screenshotAlt: string;
}

export function HeroBlock({
  heading,
  subtext,
  primaryCta,
  secondaryCta,
  screenshotSrc,
  screenshotAlt,
}: HeroBlockProps) {
  return (
    <section className="relative overflow-hidden bg-brand-dark">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand-dark to-[#0a3d40] opacity-100" />
      <div className="relative mx-auto max-w-[1080px] px-6 py-24 lg:py-36">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <h1 className="font-heading text-5xl font-semibold leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl">
              {heading}
            </h1>
            <p className="mt-8 max-w-lg text-xl leading-relaxed text-gray-300">
              {subtext}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <a
                href={primaryCta.href}
                className="rounded-lg bg-brand-primary px-8 py-4 text-base font-medium text-white transition-all hover:brightness-110"
              >
                {primaryCta.label}
              </a>
              <a
                href={secondaryCta.href}
                className="rounded-lg border border-white/30 px-8 py-4 text-base font-medium text-white transition-all hover:border-white/60 hover:bg-white/10"
              >
                {secondaryCta.label}
              </a>
            </div>
          </div>
          <div className="relative hidden lg:block">
            {/* Code editor mockup */}
            <div className="overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/30">
              <div className="flex h-10 items-center gap-2 border-b border-white/10 bg-[#1e293b] px-4">
                <div className="h-3 w-3 rounded-full bg-red-400/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
                <div className="h-3 w-3 rounded-full bg-green-400/80" />
                <span className="ml-3 text-xs text-gray-500">two-sum.py</span>
              </div>
              <div className="bg-[#0f172a] p-6 font-mono text-sm leading-7">
                <div><span className="text-purple-400">def</span> <span className="text-yellow-300">twoSum</span><span className="text-gray-400">(</span><span className="text-orange-300">nums</span><span className="text-gray-400">,</span> <span className="text-orange-300">target</span><span className="text-gray-400">):</span></div>
                <div className="text-gray-500">    &quot;&quot;&quot;Find two numbers that add up to target.&quot;&quot;&quot;</div>
                <div>    <span className="text-gray-400">seen = {"{}"}</span></div>
                <div>    <span className="text-purple-400">for</span> <span className="text-gray-300">i, num</span> <span className="text-purple-400">in</span> <span className="text-yellow-300">enumerate</span><span className="text-gray-400">(nums):</span></div>
                <div>        <span className="text-gray-400">diff = target - num</span></div>
                <div>        <span className="text-purple-400">if</span> <span className="text-gray-400">diff</span> <span className="text-purple-400">in</span> <span className="text-gray-400">seen:</span></div>
                <div>            <span className="text-purple-400">return</span> <span className="text-gray-400">[seen[diff], i]</span></div>
                <div>        <span className="text-gray-400">seen[num] = i</span></div>
                <div className="mt-4 border-t border-white/5 pt-4">
                  <span className="text-green-400">✓ Accepted</span>
                  <span className="ml-4 text-gray-500">Runtime: 4ms · Memory: 17.2 MB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";

export interface FooterColumn {
  title: string;
  links: Array<{ label: string; href: string }>;
}

export interface SocialLink {
  platform: string;
  href: string;
  icon: ReactNode;
}

export interface FooterProps {
  logoSrc: string;
  tagline: string;
  columns: FooterColumn[];
  socialLinks: SocialLink[];
  copyright: string;
}

export function Footer({
  logoSrc,
  tagline,
  columns,
  socialLinks,
  copyright,
}: FooterProps) {
  return (
    <footer className="bg-gray-900 px-6 py-16 text-gray-400">
      <div className="mx-auto max-w-[1080px]">
        <div className="grid gap-12 md:grid-cols-5">
          {/* Brand column */}
          <div className="md:col-span-2">
            <img src={logoSrc} alt="PrepForAll" width={140} height={32} />
            <p className="mt-4 max-w-xs text-sm leading-relaxed">{tagline}</p>
            <div className="mt-6 flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.platform}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 transition-colors hover:text-white"
                  aria-label={social.platform}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-sm font-semibold text-white">{col.title}</h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm">
          {copyright}
        </div>
      </div>
    </footer>
  );
}

import { content } from "@/lib/content";
import { Footer } from "@prepforall/marketing-ui/organisms";
import { getIcon } from "@/lib/icons";
import { MarketingHeader } from "./MarketingLayoutClient";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nav = await content.navigation();

  const footerSocialLinks = nav.footer.socialLinks.map((link) => ({
    ...link,
    icon: getIcon(link.platform, "h-5 w-5"),
  }));

  return (
    <>
      <MarketingHeader {...nav.header} />
      <main>{children}</main>
      <Footer
        logoSrc={nav.footer.logoSrc}
        tagline={nav.footer.tagline}
        columns={nav.footer.columns}
        socialLinks={footerSocialLinks}
        copyright={nav.footer.copyright}
      />
    </>
  );
}

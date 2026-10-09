import type { Metadata } from "next";
import { LandingPage } from "@/features/landing/landing-page";
import { homeGraph, JsonLd } from "@/features/seo/json-ld";
import { pageMetadata } from "@/features/seo/metadata";
import { pageDates } from "@/features/seo/page-dates";
import { site } from "@/shared/brand/site";
import { routes } from "@/shared/lib/routes";

export const metadata: Metadata = pageMetadata({
  title: site.name,
  seoTitle: site.title,
  description: site.metaDescription,
  path: routes.home,
});

const HomePage = (): React.JSX.Element => (
  <>
    <JsonLd data={homeGraph({ title: site.title, description: site.metaDescription, dates: pageDates(routes.home) })} />
    <LandingPage />
  </>
);

export default HomePage;

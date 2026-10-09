import type { Metadata } from "next";
import { LandingPage } from "@/features/landing/landing-page";
import { landingMetadata } from "@/features/landing/metadata";
import { JsonLd, softwareApplicationLd, webSiteLd } from "@/features/seo/json-ld";

export const metadata: Metadata = landingMetadata;

const HomePage = (): React.JSX.Element => (
  <>
    <JsonLd data={webSiteLd()} />
    <JsonLd data={softwareApplicationLd()} />
    <LandingPage />
  </>
);

export default HomePage;

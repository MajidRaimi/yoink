import type { Metadata } from "next";
import { Hero } from "./_components/hero";
import { Personas } from "./_components/personas";
import { HowItWorks } from "./_components/how-it-works";
import { FeaturesBento } from "./_components/features-bento";
import { EnvOverride } from "./_components/env-override";
import { FinalCta } from "./_components/final-cta";
import { JsonLd } from "@/components/custom/json-ld";
import { site } from "@/lib/site";
import { organizationLd, softwareApplicationLd, webSiteLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: `${site.url}/` },
};

const HomePage = () => (
  <>
    <JsonLd data={softwareApplicationLd()} />
    <JsonLd data={webSiteLd()} />
    <JsonLd data={organizationLd()} />
    <Hero />
    <Personas />
    <HowItWorks />
    <FeaturesBento />
    <EnvOverride />
    <FinalCta />
  </>
);

export default HomePage;

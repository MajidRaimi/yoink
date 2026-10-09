import { LANDING_DESCRIPTION } from "@/features/landing/copy";
import { ActProviders } from "@/features/landing/sections/act-providers";
import { ActSurfaces } from "@/features/landing/sections/act-surfaces";
import { ActSwitch } from "@/features/landing/sections/act-switch";
import { FinalCta } from "@/features/landing/sections/final-cta";
import { Hero } from "@/features/landing/sections/hero";
import { Install } from "@/features/landing/sections/install";
import { LogoWall } from "@/features/landing/sections/logo-wall";
import { Proof } from "@/features/landing/sections/proof";
import { Safety } from "@/features/landing/sections/safety";
import { JsonLd } from "@/features/landing/seo/json-ld";
import { softwareApplicationJsonLd } from "@/features/landing/seo/software-application";

export const LandingPage = (): React.JSX.Element => (
  <>
    <JsonLd data={softwareApplicationJsonLd(LANDING_DESCRIPTION)} />
    <Hero />
    <LogoWall />
    <ActSwitch />
    <ActProviders />
    <ActSurfaces />
    <Proof />
    <Safety />
    <Install />
    <FinalCta />
  </>
);

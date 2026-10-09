import { site } from "@/shared/brand/site";
import { absoluteUrl, canonicalPath, routes } from "@/shared/lib/routes";

export type SoftwareApplicationJsonLd = {
  "@context": "https://schema.org";
  "@type": "SoftwareApplication";
  name: string;
  description: string;
  url: string;
  downloadUrl: string;
  installUrl: string;
  softwareVersion: string;
  applicationCategory: "DeveloperApplication";
  operatingSystem: string;
  license: string;
  isAccessibleForFree: true;
  codeRepository: string;
  offers: { "@type": "Offer"; price: "0"; priceCurrency: "USD" };
  author: { "@type": "Person"; name: string; url: string };
};

export const softwareApplicationJsonLd = (description: string): SoftwareApplicationJsonLd => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: site.name,
  description,
  url: absoluteUrl(site.url, canonicalPath(routes.home)),
  downloadUrl: absoluteUrl(site.url, canonicalPath(routes.download)),
  installUrl: absoluteUrl(site.url, `${canonicalPath(routes.home)}#install`),
  softwareVersion: site.version,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "macOS, Linux, Windows",
  license: "https://opensource.org/licenses/MIT",
  isAccessibleForFree: true,
  codeRepository: site.repo,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: { "@type": "Person", name: site.author, url: site.repo },
});

export const serializeJsonLd = (data: object): string => JSON.stringify(data).replace(/</g, "\\u003c");

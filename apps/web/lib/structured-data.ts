import { site } from "@/lib/site";

const author = {
  "@type": "Person",
  name: "Majid Raimi",
  url: site.repo,
};

const publisher = {
  "@type": "Organization",
  name: site.name,
  url: site.url,
};

export const softwareApplicationLd = () => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: site.name,
  description: site.description,
  url: site.url,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "macOS, Linux, Windows",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author,
  downloadUrl: site.repo,
  softwareHelp: `${site.url}/docs/`,
});

export const webSiteLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: site.name,
  url: site.url,
  description: site.description,
});

export const organizationLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.url,
  logo: `${site.url}/icon-512.png`,
  sameAs: [site.repo],
});

type TechArticleInput = {
  title: string;
  description: string;
  url: string;
};

export const techArticleLd = ({ title, description, url }: TechArticleInput) => ({
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: title,
  description,
  url,
  author,
  publisher,
});

type Breadcrumb = {
  name: string;
  url: string;
};

export const breadcrumbLd = (items: Breadcrumb[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

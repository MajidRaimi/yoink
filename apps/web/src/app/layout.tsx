import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { fontVariables } from "@/shared/brand/fonts";
import { site } from "@/shared/brand/site";
import { pageMetadata, TITLE_TEMPLATE, verificationMetadata } from "@/features/seo/metadata";
import { routes } from "@/shared/lib/routes";
import { PlatformHeadScript } from "@/features/download/platform-head-script";
import { Footer } from "@/shared/ui/footer";
import { Navbar } from "@/shared/ui/navbar";
import { ThemeProvider } from "@/shared/ui/theme/theme-provider";
import { ThemeColorMeta } from "@/shared/ui/theme/theme-color-meta";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const siteDefaults = pageMetadata({ title: site.name, seoTitle: site.title, description: site.metaDescription, path: routes.home });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: TITLE_TEMPLATE,
  },
  description: site.metaDescription,
  applicationName: site.name,
  authors: [{ name: site.author, url: site.authorUrl }],
  creator: site.author,
  publisher: site.author,
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/apple-icon.png",
  },
  verification: verificationMetadata(site.verification),
  openGraph: siteDefaults.openGraph,
  twitter: siteDefaults.twitter,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProps): React.JSX.Element => (
  <html lang="en" className={fontVariables} suppressHydrationWarning>
    <head>
      <PlatformHeadScript />
    </head>
    <body className="flex min-h-dvh flex-col">
      <ThemeProvider>
        <ThemeColorMeta />
        <Navbar />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </ThemeProvider>
    </body>
  </html>
);

export default RootLayout;

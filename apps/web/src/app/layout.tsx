import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { fontVariables } from "@/shared/brand/fonts";
import { site } from "@/shared/brand/site";
import { PlatformHeadScript } from "@/features/download/platform-head-script";
import { Footer } from "@/shared/ui/footer";
import { Navbar } from "@/shared/ui/navbar";
import { ThemeProvider } from "@/shared/ui/theme-provider";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0908" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.author, url: site.repo }],
  creator: site.author,
  publisher: site.author,
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: site.title,
    description: site.description,
    url: site.url,
    siteName: site.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
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

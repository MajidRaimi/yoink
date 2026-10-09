import type { Metadata } from "next";
import { site } from "@/shared/brand/site";
import { PlaceholderPage } from "@/shared/ui/placeholder-page";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const HomePage = (): React.JSX.Element => <PlaceholderPage title={site.headline} description={site.description} />;

export default HomePage;

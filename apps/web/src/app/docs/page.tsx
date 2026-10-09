import type { Metadata } from "next";
import { PlaceholderPage } from "@/shared/ui/placeholder-page";

export const metadata: Metadata = {
  title: "Docs",
  alternates: { canonical: "/docs/" },
};

const DocsIndexPage = (): React.JSX.Element => <PlaceholderPage title="Docs" />;

export default DocsIndexPage;

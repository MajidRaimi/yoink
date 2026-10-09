import type { Metadata } from "next";
import { PlaceholderPage } from "@/shared/ui/placeholder-page";

export const metadata: Metadata = {
  title: "CLI reference",
  alternates: { canonical: "/reference/" },
};

const ReferencePage = (): React.JSX.Element => <PlaceholderPage title="CLI reference" />;

export default ReferencePage;

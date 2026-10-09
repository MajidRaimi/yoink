import type { Metadata } from "next";
import { PlaceholderPage } from "@/shared/ui/placeholder-page";

export const metadata: Metadata = {
  title: "Download",
  alternates: { canonical: "/download/" },
};

const DownloadPage = (): React.JSX.Element => <PlaceholderPage title="Download" />;

export default DownloadPage;

import type { Metadata } from "next";
import { NotFoundView } from "@/features/seo/components/not-found-view";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page does not exist on yoink.codes. Go to the Yoink docs, the CLI reference or the download page to switch AI coding logins and providers.",
  openGraph: null,
  twitter: null,
  robots: null,
};

const NotFound = (): React.JSX.Element => <NotFoundView />;

export default NotFound;

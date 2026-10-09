import type { Metadata } from "next";
import { PlaceholderPage } from "@/shared/ui/placeholder-page";

export const metadata: Metadata = {
  title: "Page not found",
  robots: null,
};

const NotFound = (): React.JSX.Element => <PlaceholderPage title="Page not found" />;

export default NotFound;

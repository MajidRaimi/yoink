import type { Metadata } from "next";
import { NotFoundView } from "@/features/seo/components/not-found-view";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

const NotFound = (): React.JSX.Element => <NotFoundView />;

export default NotFound;

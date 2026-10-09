import type { ReactNode } from "react";
import { DocsLayout } from "@/features/docs/components/docs-layout";

type DocsRouteLayoutProps = {
  children: ReactNode;
};

const DocsRouteLayout = ({ children }: DocsRouteLayoutProps): React.JSX.Element => <DocsLayout>{children}</DocsLayout>;

export default DocsRouteLayout;

import type { ReactNode } from "react";
import { DocsLayout } from "@/features/docs/components/docs-layout";

type CollectionLayoutProps = {
  children: ReactNode;
};

const CollectionLayout = ({ children }: CollectionLayoutProps): React.JSX.Element => <DocsLayout>{children}</DocsLayout>;

export default CollectionLayout;

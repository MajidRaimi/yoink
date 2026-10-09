import type { ReactNode } from "react";
import { DocsShell } from "@/features/docs/components/docs-shell";
import "@/features/docs/docs.css";

type DocsLayoutProps = {
  children: ReactNode;
};

const DocsLayout = ({ children }: DocsLayoutProps): React.JSX.Element => <DocsShell>{children}</DocsShell>;

export default DocsLayout;

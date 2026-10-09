import type { ReactNode } from "react";
import { DocsShell } from "@/features/docs/components/docs-shell";
import "@/features/docs/docs.css";

type ReferenceLayoutProps = {
  children: ReactNode;
};

const ReferenceLayout = ({ children }: ReferenceLayoutProps): React.JSX.Element => <DocsShell>{children}</DocsShell>;

export default ReferenceLayout;

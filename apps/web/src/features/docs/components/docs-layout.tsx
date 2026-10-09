import type { ReactNode } from "react";
import { DocsShell } from "./docs-shell";
import "../docs.css";

export type DocsLayoutProps = {
  children: ReactNode;
};

export const DocsLayout = ({ children }: DocsLayoutProps): React.JSX.Element => <DocsShell>{children}</DocsShell>;

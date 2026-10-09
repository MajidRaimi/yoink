import type { ReactNode } from "react";
import { Container } from "@/shared/ui/container";
import { DocsSearch } from "../search/docs-search";
import { DocsNav } from "./docs-nav";
import { DocsSidebarShell } from "./docs-sidebar-shell";

export type DocsShellProps = {
  children: ReactNode;
};

export const DocsShell = ({ children }: DocsShellProps): React.JSX.Element => (
  <Container size="wide" className="py-6 lg:py-10">
    <div className="grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12">
      <aside aria-label="Docs sidebar" className="lg:sticky lg:top-16 lg:max-h-[calc(100dvh-4rem)] lg:-mx-1 lg:self-start lg:overflow-y-auto lg:px-1 lg:pt-4 lg:pb-8">
        <DocsSidebarShell search={<DocsSearch />}>
          <DocsNav />
        </DocsSidebarShell>
      </aside>
      <div className="min-w-0 lg:pt-4">{children}</div>
    </div>
  </Container>
);

import { DocsSidebar } from "@/components/custom/docs-sidebar";
import { DocsToc } from "@/components/custom/docs-toc";

const ReferenceLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto flex max-w-6xl gap-10 px-5 pt-32 pb-24">
    <aside className="hidden w-52 shrink-0 lg:block">
      <div className="sticky top-28">
        <DocsSidebar />
      </div>
    </aside>
    <div className="min-w-0 flex-1">{children}</div>
    <aside className="hidden w-48 shrink-0 xl:block">
      <div className="sticky top-28">
        <DocsToc />
      </div>
    </aside>
  </div>
);

export default ReferenceLayout;

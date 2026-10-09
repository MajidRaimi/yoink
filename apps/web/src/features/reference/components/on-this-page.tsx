import { REFERENCE_SECTIONS } from "../sections";

export const OnThisPage = (): React.JSX.Element => (
  <nav aria-label="On this page" className="lg:sticky lg:top-24">
    <p className="text-sm font-medium">On this page</p>
    <ul className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:gap-0.5">
      {REFERENCE_SECTIONS.map((section) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            className="inline-flex rounded-pill border border-hairline px-3 py-1.5 text-sm text-muted transition-colors dur-1 hover:text-foreground focus-visible:focus-ring lg:rounded-sm lg:border-transparent lg:px-2 lg:py-1"
          >
            {section.title}
          </a>
        </li>
      ))}
    </ul>
  </nav>
);

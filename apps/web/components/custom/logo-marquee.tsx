type Provider = {
  slug: string;
  name: string;
};

type LogoMarqueeProps = {
  providers: ReadonlyArray<Provider>;
};

const ProviderItem = ({ slug, name }: Provider) => (
  <li className="flex shrink-0 items-center gap-2.5 text-muted transition-colors hover:text-foreground">
    <span
      className="brand-logo size-5"
      style={{ maskImage: `url(/logos/${slug}.svg)`, WebkitMaskImage: `url(/logos/${slug}.svg)` }}
    />
    <span className="font-mono text-sm">{name}</span>
  </li>
);

export const LogoMarquee = ({ providers }: LogoMarqueeProps) => (
  <div className="marquee w-full overflow-hidden" dir="ltr">
    <div className="marquee-track flex">
      <ul className="flex items-center gap-x-12 pr-12">
        {providers.map((provider) => (
          <ProviderItem key={provider.slug} {...provider} />
        ))}
      </ul>
      <ul className="flex items-center gap-x-12 pr-12" aria-hidden>
        {providers.map((provider) => (
          <ProviderItem key={provider.slug} {...provider} />
        ))}
      </ul>
    </div>
  </div>
);

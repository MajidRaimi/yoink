import { serializeJsonLd } from "@/features/landing/seo/software-application";

export type JsonLdProps = {
  data: object;
};

export const JsonLd = ({ data }: JsonLdProps): React.JSX.Element => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
);

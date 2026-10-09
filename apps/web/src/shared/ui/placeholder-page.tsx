import { Container } from "@/shared/ui/container";

export type PlaceholderPageProps = {
  title: string;
  description?: string;
};

export const PlaceholderPage = ({ title, description }: PlaceholderPageProps): React.JSX.Element => (
  <Container className="py-24">
    <h1 className="display text-4xl">{title}</h1>
    {description === undefined ? null : <p className="mt-4 max-w-2xl text-lg text-muted">{description}</p>}
  </Container>
);

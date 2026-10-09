import { Button } from "@/shared/ui/button";

export type PrimaryCtaProps = {
  className?: string;
};

export const PrimaryCta = ({ className }: PrimaryCtaProps): React.JSX.Element => (
  <div className={className}>
    <Button>Install the CLI</Button>
  </div>
);

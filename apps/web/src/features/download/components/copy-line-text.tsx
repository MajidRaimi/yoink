import { InlineCode } from "@/shared/ui/code";
import type { CopyLine } from "@/features/download/lib/install-options";

export type CopyLineTextProps = {
  line: CopyLine;
};

export const CopyLineText = ({ line }: CopyLineTextProps): React.JSX.Element => (
  <>
    {line.map((segment) =>
      typeof segment === "string" ? (
        segment
      ) : (
        <bdi key={segment.code}>
          <InlineCode>{segment.code}</InlineCode>
        </bdi>
      ),
    )}
  </>
);

import { platformScript } from "@/features/download/lib/platform";

export const PlatformHeadScript = (): React.JSX.Element => <script dangerouslySetInnerHTML={{ __html: platformScript }} />;

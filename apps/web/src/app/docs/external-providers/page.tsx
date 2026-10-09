import type { Metadata } from "next";
import { AliasPage, aliasMetadata } from "@/features/seo/components/alias-page";

export const metadata: Metadata = aliasMetadata("external-providers");

const ExternalProvidersAliasPage = (): React.JSX.Element => <AliasPage alias="external-providers" />;

export default ExternalProvidersAliasPage;

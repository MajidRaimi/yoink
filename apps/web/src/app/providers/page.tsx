import type { Metadata } from "next";
import { CollectionAliasPage, collectionAliasMetadata } from "@/features/seo/components/alias-page";

export const metadata: Metadata = collectionAliasMetadata("providers");

const ProvidersAliasPage = (): React.JSX.Element => <CollectionAliasPage alias="providers" />;

export default ProvidersAliasPage;

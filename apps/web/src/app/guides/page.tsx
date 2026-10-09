import type { Metadata } from "next";
import { CollectionAliasPage, collectionAliasMetadata } from "@/features/seo/components/alias-page";

export const metadata: Metadata = collectionAliasMetadata("guides");

const GuidesAliasPage = (): React.JSX.Element => <CollectionAliasPage alias="guides" />;

export default GuidesAliasPage;

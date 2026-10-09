import type { Metadata } from "next";
import { CollectionAliasPage, collectionAliasMetadata } from "@/features/seo/components/alias-page";

export const metadata: Metadata = collectionAliasMetadata("harnesses");

const HarnessesAliasPage = (): React.JSX.Element => <CollectionAliasPage alias="harnesses" />;

export default HarnessesAliasPage;

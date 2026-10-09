import type { Metadata } from "next";
import type { EntryRef } from "@/features/docs/collections";
import { EntryRoute, entryMetadata } from "@/features/seo/entry-route";

const ENTRY: EntryRef = { collection: "faq", slug: "faq" };

export const metadata: Metadata = entryMetadata(ENTRY);

const FaqPage = (): React.JSX.Element => <EntryRoute entryRef={ENTRY} />;

export default FaqPage;

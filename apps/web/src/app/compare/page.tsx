import type { Metadata } from "next";
import type { EntryRef } from "@/features/docs/collections";
import { EntryRoute, entryMetadata } from "@/features/seo/entry-route";
import { COMPARE_INDEX_SLUG } from "@/shared/lib/routes";

const ENTRY: EntryRef = { collection: "compare", slug: COMPARE_INDEX_SLUG };

export const metadata: Metadata = entryMetadata(ENTRY);

const ComparePage = (): React.JSX.Element => <EntryRoute entryRef={ENTRY} />;

export default ComparePage;

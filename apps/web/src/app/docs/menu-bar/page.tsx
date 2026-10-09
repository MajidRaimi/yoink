import type { Metadata } from "next";
import { AliasPage, aliasMetadata } from "@/features/seo/components/alias-page";

export const metadata: Metadata = aliasMetadata("menu-bar");

const MenuBarAliasPage = (): React.JSX.Element => <AliasPage alias="menu-bar" />;

export default MenuBarAliasPage;

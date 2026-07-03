import { intro } from "@clack/prompts";
import pc from "picocolors";
import { theme } from "../../shared/theme";

export const banner = theme.badge(" yoink ");

export const introBanner = (subtitle: string): void => intro(`${banner} ${pc.dim(subtitle)}`);

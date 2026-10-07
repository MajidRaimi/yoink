import { parse } from "@decimalturn/toml-patch";

export const parseToml = (text: string): unknown => parse(text);

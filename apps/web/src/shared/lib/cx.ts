import { clsx, type ClassValue } from "clsx";

export const cx = (...inputs: ClassValue[]): string => clsx(inputs);

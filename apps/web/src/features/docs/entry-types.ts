import type { DocSection } from "@/shared/contract";
import type { EntryRef } from "./collections";

export type Competitor = {
  readonly name: string;
  readonly url: string;
  readonly version: string;
  readonly checked: string;
};

export type EntryMeta = {
  readonly ref: EntryRef;
  readonly path: string;
  readonly repoPath: string;
  readonly title: string;
  readonly seoTitle?: string;
  readonly description: string;
  readonly nav: string;
  readonly order: number;
  readonly related: readonly EntryRef[];
  readonly section?: DocSection;
  readonly harness?: string;
  readonly preset?: string;
  readonly competitor?: Competitor;
  readonly checked?: string;
};

export type Entry = {
  readonly meta: EntryMeta;
  readonly body: string;
};

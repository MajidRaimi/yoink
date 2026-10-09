"use client";

import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useId, useState, type KeyboardEvent, type MouseEvent } from "react";
import { cx } from "@/shared/lib/cx";
import { useDisclosure } from "@/shared/lib/use-disclosure";
import { Icon } from "@/shared/ui/icon";
import { Kbd } from "@/shared/ui/kbd";
import { MIN_QUERY_LENGTH, type SearchHit } from "./search-options";
import { useDocsSearch } from "./use-docs-search";
import { useListCursor } from "./use-list-cursor";
import { useModalDialog } from "./use-modal-dialog";
import { useSearchHotkey } from "./use-search-hotkey";
import { useSearchIndex, type SearchIndexState } from "./use-search-index";

const hitHref = (hit: SearchHit): Route =>
  (hit.anchor.length === 0 ? hit.path : `${hit.path}#${hit.anchor}`) as Route;

const statusMessage = (state: SearchIndexState, query: string, count: number): string => {
  if (state.status === "error") return "Search is unavailable right now.";
  if (state.status !== "ready") return "Loading search";
  if (query.trim().length < MIN_QUERY_LENGTH) return `Type at least ${MIN_QUERY_LENGTH} characters.`;
  if (count === 0) return `No results for "${query.trim()}".`;
  return count === 1 ? "1 result" : `${count} results`;
};

const hitContext = (hit: SearchHit): string => (hit.anchor.length === 0 ? hit.group : `${hit.title} · ${hit.group}`);

export const DocsSearch = (): React.JSX.Element => {
  const { open, show, hide } = useDisclosure();
  const [query, setQuery] = useState("");
  const router = useRouter();
  const dialogRef = useModalDialog(open, hide);
  const indexState = useSearchIndex(open);
  const hits = useDocsSearch(query, indexState);
  const cursor = useListCursor(hits.length, query);
  const titleId = useId();
  const listId = useId();
  const optionId = (index: number): string => `${listId}-option-${index}`;
  useSearchHotkey(show);

  const go = (hit: SearchHit | undefined): void => {
    if (hit === undefined) return;
    hide();
    router.push(hitHref(hit));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      cursor.move(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(hits[cursor.index]);
    }
  };

  const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>): void => {
    if (event.target === event.currentTarget) hide();
  };

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-haspopup="dialog"
        aria-keyshortcuts="/ Control+K Meta+K"
        className="flex h-10 w-full items-center gap-2 rounded-md border border-hairline-strong bg-surface px-3 text-sm text-muted transition-colors dur-1 hover:bg-surface-2 hover:text-foreground focus-visible:focus-ring"
      >
        <Icon icon={MagnifyingGlassIcon} size={16} />
        <span className="flex-1 text-left">Search docs</span>
        <span aria-hidden="true" className="inline-flex">
          <Kbd>/</Kbd>
        </span>
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={closeOnBackdrop}
        className="docs-search-dialog mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-xl rounded-lg border border-hairline-strong bg-background p-0 text-foreground shadow-3"
      >
        <div className="flex flex-col">
          <h2 id={titleId} className="sr-only">
            Search docs
          </h2>
          <div className="flex items-center gap-3 border-b border-hairline px-4">
            <Icon icon={MagnifyingGlassIcon} size={18} className="text-muted" />
            <input
              type="text"
              enterKeyHint="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search docs"
              aria-label="Search docs"
              role="combobox"
              aria-expanded={hits.length > 0}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={cursor.index >= 0 ? optionId(cursor.index) : undefined}
              autoComplete="off"
              spellCheck={false}
              className="docs-search-input h-14 min-w-0 flex-1 bg-transparent text-base placeholder:text-faint"
            />
            <button
              type="button"
              onClick={hide}
              aria-label="Close search"
              className="grid size-8 place-items-center rounded-sm text-muted transition-colors dur-1 hover:bg-surface-2 hover:text-foreground focus-visible:focus-ring"
            >
              <Icon icon={XIcon} size={16} />
            </button>
          </div>
          <ul
            ref={cursor.listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-label="Search results"
            className="max-h-[50vh] overflow-y-auto p-2 empty:hidden"
          >
            {hits.map((hit, index) => (
              <li
                key={hit.id}
                id={optionId(index)}
                role="option"
                aria-selected={index === cursor.index}
                onClick={() => go(hit)}
                onMouseMove={() => cursor.set(index)}
                className={cx(
                  "flex cursor-pointer flex-col gap-0.5 rounded-md px-3 py-2.5",
                  index === cursor.index && "bg-surface-2",
                )}
              >
                <span className="text-sm font-medium text-foreground">{hit.heading}</span>
                <span className="text-xs text-muted">{hitContext(hit)}</span>
              </li>
            ))}
          </ul>
          <p role="status" aria-live="polite" className="border-t border-hairline px-4 py-2.5 text-xs text-muted">
            {statusMessage(indexState, query, hits.length)}
          </p>
        </div>
      </dialog>
    </>
  );
};

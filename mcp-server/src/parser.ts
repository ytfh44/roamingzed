/**
 * Wikilink Parser
 * Parses [[wikilink]] and [[wikilink|alias]] syntax from Markdown content
 */

export interface WikiLink {
  /** The link target (file or heading) */
  target: string;
  /** Optional display alias */
  alias: string | null;
  /** Start position in source text */
  start: number;
  /** End position in source text */
  end: number;
}

/**
 * Regex pattern for wikilinks:
 * - [[target]]
 * - [[target|alias]]
 * - [[folder/target#heading]]
 */
const WIKILINK_PATTERN = /\[\[(?<target>[^\]|]+?)(?:\|(?<alias>[^\]]+))?\]\]/g;

/**
 * Parse all wikilinks from a markdown string
 */
export function parseWikilinks(content: string): WikiLink[] {
  const links: WikiLink[] = [];
  let match: RegExpExecArray | null;

  // Reset lastIndex for global regex
  WIKILINK_PATTERN.lastIndex = 0;

  while ((match = WIKILINK_PATTERN.exec(content)) !== null) {
    const target = match.groups?.target?.trim() ?? "";
    const alias = match.groups?.alias?.trim() ?? null;

    if (target) {
      links.push({
        target,
        alias,
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  return links;
}

/**
 * Extract just the file name from a wikilink target
 * Examples:
 * - "note" -> "note"
 * - "folder/note" -> "note"
 * - "note#heading" -> "note"
 */
export function extractFileName(target: string): string {
  // Remove heading reference
  const withoutHeading = target.split("#")[0];
  // Get the last part of the path
  const parts = withoutHeading.split("/");
  return parts[parts.length - 1] || "";
}

/**
 * Check if a string contains wikilink syntax
 */
export function containsWikilinks(content: string): boolean {
  WIKILINK_PATTERN.lastIndex = 0;
  return WIKILINK_PATTERN.test(content);
}

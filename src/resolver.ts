import { findRelatedEntries } from "./matching.js";
import type { ContentListResult, EntryLike, GetRelatedContentOptions, RelatedContentSection } from "./types.js";

const DEFAULT_SCAN_LIMIT = 100;

export async function getRelatedContent(options: GetRelatedContentOptions): Promise<RelatedContentSection[]> {
  const sections: RelatedContentSection[] = [];

  for (const relationship of options.relationships) {
    const listResult = await options.content.list(relationship.relatedCollection, {
      limit: relationship.scanLimit ?? DEFAULT_SCAN_LIMIT,
      orderBy: { publishedAt: "desc" },
      where: { status: "published" },
    });

    const matches = findRelatedEntries(options.sourceEntry, getListItems(listResult), relationship);
    if (matches.length > 0) {
      sections.push({ relationship, matches });
    }
  }

  return sections;
}

export function getListItems(result: ContentListResult): EntryLike[] {
  return result.items ?? result.entries ?? result.data ?? result.results ?? [];
}
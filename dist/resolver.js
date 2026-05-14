import { findRelatedEntries } from "./matching.js";
const DEFAULT_SCAN_LIMIT = 100;
export async function getRelatedContent(options) {
    const sections = [];
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
export function getListItems(result) {
    return result.items ?? result.entries ?? result.data ?? result.results ?? [];
}
//# sourceMappingURL=resolver.js.map
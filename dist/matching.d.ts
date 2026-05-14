import type { EntryLike, RelatedContentRelationship, RelatedEntryMatch } from "./types.js";
export declare function findRelatedEntries(sourceEntry: EntryLike, candidateEntries: EntryLike[], relationship: RelatedContentRelationship): RelatedEntryMatch[];
export declare function getEntryTitle(entry: EntryLike, relationship?: Pick<RelatedContentRelationship, "titleField">): string;
export declare function getEntryUrl(entry: EntryLike, relationship: RelatedContentRelationship): string;
export declare function getEntryExcerpt(entry: EntryLike, relationship: RelatedContentRelationship): string | undefined;
//# sourceMappingURL=matching.d.ts.map
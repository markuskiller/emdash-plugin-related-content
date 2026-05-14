export type RelatedContentPlacement = "head" | "body:start" | "body:end";
export type RelatedContentRenderMode = "fragment" | "manual" | "both";
export interface EntryLike {
    id: string;
    slug: string | null;
    status?: string;
    data: Record<string, unknown>;
    publishedAt: string | null;
    createdAt?: string;
    updatedAt?: string;
}
export interface RelatedContentOptions {
    relationships: RelatedContentRelationship[];
    className?: string;
    listClassName?: string;
    itemClassName?: string;
    linkClassName?: string;
    headingLevel?: 2 | 3 | 4;
    includeExcerpt?: boolean;
}
export interface ContentListResult {
    items?: EntryLike[];
    entries?: EntryLike[];
    data?: EntryLike[];
    results?: EntryLike[];
}
export interface ContentReader {
    get(collection: string, id: string): Promise<EntryLike | null>;
    list(collection: string, options?: unknown): Promise<ContentListResult>;
}
export interface GetRelatedContentOptions {
    sourceEntry: EntryLike;
    relationships: RelatedContentRelationship[];
    content: ContentReader;
}
export interface RelatedContentSection {
    relationship: RelatedContentRelationship;
    matches: RelatedEntryMatch[];
}
export interface RenderRelatedContentSectionOptions {
    className?: string;
    listClassName?: string;
    itemClassName?: string;
    linkClassName?: string;
    headingLevel?: 2 | 3 | 4;
    includeExcerpt?: boolean;
}
export interface RelatedContentRelationship {
    sourceCollection: string;
    relatedCollection: string;
    heading?: string;
    maxItems?: number;
    scanLimit?: number;
    placement?: RelatedContentPlacement;
    renderMode?: RelatedContentRenderMode;
    relatedField?: string;
    sourceSlug?: string;
    matchTitle?: boolean;
    matchSlugInBody?: boolean;
    matchSourceLinks?: boolean;
    matchTags?: boolean | string | string[];
    matchSharedFields?: string[];
    pinnedField?: string;
    pinOrderField?: string;
    titleField?: string;
    excerptField?: string;
    urlField?: string;
}
export interface RelatedEntryMatch {
    entry: EntryLike;
    pinned: boolean;
    pinOrder?: number;
    score: number;
    reasons: string[];
}
export type RelationshipReference = string | number | {
    id?: unknown;
    entryId?: unknown;
    slug?: unknown;
    collection?: unknown;
    pinned?: unknown;
    order?: unknown;
    [key: string]: unknown;
};
//# sourceMappingURL=types.d.ts.map
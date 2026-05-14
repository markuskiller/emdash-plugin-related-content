export type RelatedContentPlacement = "head" | "body:start" | "body:end";

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
}

export interface RelatedContentRelationship {
  sourceCollection: string;
  relatedCollection: string;
  heading?: string;
  maxItems?: number;
  scanLimit?: number;
  placement?: RelatedContentPlacement;
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

export type RelationshipReference =
  | string
  | number
  | {
      id?: unknown;
      entryId?: unknown;
      slug?: unknown;
      collection?: unknown;
      pinned?: unknown;
      order?: unknown;
      [key: string]: unknown;
    };
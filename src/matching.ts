import type {
  EntryLike,
  RelatedContentRelationship,
  RelatedEntryMatch,
  RelationshipReference,
} from "./types.js";

const DEFAULT_MAX_ITEMS = 6;
const DEFAULT_PIN_ORDER_FIELD = "order";

export function findRelatedEntries(
  sourceEntry: EntryLike,
  candidateEntries: EntryLike[],
  relationship: RelatedContentRelationship,
): RelatedEntryMatch[] {
  return candidateEntries
    .filter((entry) => !isSameEntry(sourceEntry, entry, relationship))
    .map((entry) => matchEntry(sourceEntry, entry, relationship))
    .filter((match): match is RelatedEntryMatch => match !== null)
    .sort(compareMatches)
    .slice(0, relationship.maxItems ?? DEFAULT_MAX_ITEMS);
}

function matchEntry(
  sourceEntry: EntryLike,
  relatedEntry: EntryLike,
  relationship: RelatedContentRelationship,
): RelatedEntryMatch | null {
  const reasons: string[] = [];
  const pin = getPin(sourceEntry, relatedEntry, relationship);
  let score = 0;

  if (relationship.relatedField && hasRelatedFieldMatch(sourceEntry, relatedEntry, relationship)) {
    score += 100;
    reasons.push("relatedField");
  }

  if (relationship.matchSharedFields?.length) {
    const matches = relationship.matchSharedFields.filter((field) =>
      valuesOverlap(sourceEntry.data[field], relatedEntry.data[field]),
    );
    if (matches.length > 0) {
      score += matches.length * 20;
      reasons.push("matchSharedFields");
    }
  }

  if (relationship.matchTags) {
    const tagFields = relationship.matchTags === true ? ["tags"] : toStringArray(relationship.matchTags);
    if (tagFields.some((field) => valuesOverlap(sourceEntry.data[field], relatedEntry.data[field]))) {
      score += 15;
      reasons.push("matchTags");
    }
  }

  const sourceSlug = relationship.sourceSlug ?? sourceEntry.slug ?? undefined;
  const relatedText = stringifyForSearch(relatedEntry.data);
  const sourceTitle = getEntryTitle(sourceEntry, relationship);

  if (relationship.matchTitle && sourceTitle && relatedText.includes(normalizeText(sourceTitle))) {
    score += 10;
    reasons.push("matchTitle");
  }

  if (relationship.matchSlugInBody && sourceSlug && relatedText.includes(normalizeText(sourceSlug))) {
    score += 10;
    reasons.push("matchSlugInBody");
  }

  if (relationship.matchSourceLinks && sourceSlug && containsSourceLink(relatedEntry.data, sourceSlug, sourceEntry.id)) {
    score += 12;
    reasons.push("matchSourceLinks");
  }

  if (score === 0) return null;

  return {
    entry: relatedEntry,
    pinned: pin.pinned,
    pinOrder: pin.order,
    score,
    reasons,
  };
}

function compareMatches(left: RelatedEntryMatch, right: RelatedEntryMatch): number {
  if (left.pinned !== right.pinned) return left.pinned ? -1 : 1;

  if (left.pinned && (left.pinOrder !== undefined || right.pinOrder !== undefined)) {
    if (left.pinOrder === undefined) return 1;
    if (right.pinOrder === undefined) return -1;
    if (left.pinOrder !== right.pinOrder) return left.pinOrder - right.pinOrder;
  }

  return getPublishedTime(right.entry) - getPublishedTime(left.entry);
}

function isSameEntry(
  sourceEntry: EntryLike,
  relatedEntry: EntryLike,
  relationship: RelatedContentRelationship,
): boolean {
  return relationship.sourceCollection === relationship.relatedCollection && sourceEntry.id === relatedEntry.id;
}

function hasRelatedFieldMatch(
  sourceEntry: EntryLike,
  relatedEntry: EntryLike,
  relationship: RelatedContentRelationship,
): boolean {
  if (!relationship.relatedField) return false;

  const sourceReferences = toReferences(sourceEntry.data[relationship.relatedField]);
  if (sourceReferences.some((reference) => referencesEntry(reference, relatedEntry, relationship.relatedCollection))) {
    return true;
  }

  const relatedReferences = toReferences(relatedEntry.data[relationship.relatedField]);
  return relatedReferences.some((reference) => referencesEntry(reference, sourceEntry, relationship.sourceCollection));
}

function getPin(
  sourceEntry: EntryLike,
  relatedEntry: EntryLike,
  relationship: RelatedContentRelationship,
): { pinned: boolean; order?: number } {
  if (!relationship.relatedField || !relationship.pinnedField) return { pinned: false };

  const sourceReferences = toReferences(sourceEntry.data[relationship.relatedField]);
  const sourceReference = sourceReferences.find((reference) => referencesEntry(reference, relatedEntry, relationship.relatedCollection));
  const relatedReferences = toReferences(relatedEntry.data[relationship.relatedField]);
  const relatedReference = relatedReferences.find((reference) => referencesEntry(reference, sourceEntry, relationship.sourceCollection));
  const reference = sourceReference ?? relatedReference;

  if (!isReferenceObject(reference) || reference[relationship.pinnedField] !== true) return { pinned: false };

  const order = toNumber(reference[relationship.pinOrderField ?? DEFAULT_PIN_ORDER_FIELD]);
  return order === undefined ? { pinned: true } : { pinned: true, order };
}

function referencesEntry(reference: RelationshipReference, entry: EntryLike, collection: string): boolean {
  if (typeof reference === "string" || typeof reference === "number") {
    const value = String(reference);
    return value === entry.id || value === entry.slug;
  }

  if (!isReferenceObject(reference)) return false;

  const referenceCollection = typeof reference.collection === "string" ? reference.collection : undefined;
  if (referenceCollection && referenceCollection !== collection) return false;

  const id = readString(reference.id) ?? readString(reference.entryId);
  const slug = readString(reference.slug);
  return id === entry.id || (slug !== undefined && slug === entry.slug);
}

function valuesOverlap(left: unknown, right: unknown): boolean {
  const leftValues = toComparableValues(left);
  const rightValues = new Set(toComparableValues(right));
  return leftValues.some((value) => rightValues.has(value));
}

function containsSourceLink(data: Record<string, unknown>, sourceSlug: string, sourceId: string): boolean {
  const normalizedSlug = normalizeText(sourceSlug);
  const normalizedId = normalizeText(sourceId);
  return flattenValues(data)
    .filter((value): value is string => typeof value === "string")
    .some((value) => {
      const normalized = normalizeText(value);
      return normalized.includes(`/${normalizedSlug}`) || normalized.includes(`/${normalizedId}`);
    });
}

export function getEntryTitle(entry: EntryLike, relationship?: Pick<RelatedContentRelationship, "titleField">): string {
  const field = relationship?.titleField ?? "title";
  const value = entry.data[field] ?? entry.data.title ?? entry.data.name;
  return typeof value === "string" ? value : entry.slug ?? entry.id;
}

export function getEntryUrl(entry: EntryLike, relationship: RelatedContentRelationship): string {
  const configuredUrl = relationship.urlField ? readString(entry.data[relationship.urlField]) : undefined;
  if (configuredUrl) return configuredUrl;
  return entry.slug ? `/${relationship.relatedCollection}/${entry.slug}/` : `/${relationship.relatedCollection}/${entry.id}/`;
}

export function getEntryExcerpt(entry: EntryLike, relationship: RelatedContentRelationship): string | undefined {
  const field = relationship.excerptField ?? "excerpt";
  return readString(entry.data[field] ?? entry.data.description ?? entry.data.summary);
}

function getPublishedTime(entry: EntryLike): number {
  return entry.publishedAt ? Date.parse(entry.publishedAt) || 0 : 0;
}

function toReferences(value: unknown): RelationshipReference[] {
  if (Array.isArray(value)) return value.flatMap(toReferences);
  if (typeof value === "string" || typeof value === "number" || isReferenceObject(value)) return [value];
  return [];
}

function toComparableValues(value: unknown): string[] {
  return flattenValues(value)
    .map((item) => {
      if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") return normalizeText(String(item));
      return undefined;
    })
    .filter((item): item is string => item !== undefined && item.length > 0);
}

function flattenValues(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.flatMap(flattenValues);
  if (isReferenceObject(value)) return Object.values(value).flatMap(flattenValues);
  if (value === null || value === undefined) return [];
  return [value];
}

function stringifyForSearch(value: unknown): string {
  return toComparableValues(value).join(" ");
}

function normalizeText(value: string): string {
  return value.toLowerCase().trim();
}

function toStringArray(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function isReferenceObject(value: unknown): value is Exclude<RelationshipReference, string | number> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
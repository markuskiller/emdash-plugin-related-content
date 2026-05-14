import { getEntryExcerpt, getEntryTitle, getEntryUrl } from "./matching.js";
import type {
  RelatedContentOptions,
  RelatedContentRelationship,
  RelatedContentSection,
  RelatedEntryMatch,
  RenderRelatedContentSectionOptions,
} from "./types.js";

const DEFAULT_CLASS_NAME = "emdash-related-content";
const DEFAULT_LIST_CLASS_NAME = "emdash-related-content__list";
const DEFAULT_ITEM_CLASS_NAME = "emdash-related-content__item";
const DEFAULT_LINK_CLASS_NAME = "emdash-related-content__link";

export function renderRelatedContent(
  matches: RelatedEntryMatch[],
  relationship: RelatedContentRelationship,
  options: RelatedContentOptions,
): string {
  return renderRelatedContentSection({ relationship, matches }, options);
}

export function renderRelatedContentSection(
  section: RelatedContentSection,
  options: RenderRelatedContentSectionOptions = {},
): string {
  const { relationship, matches } = section;
  const heading = relationship.heading ?? "Related content";
  const className = options.className ?? DEFAULT_CLASS_NAME;
  const listClassName = options.listClassName ?? DEFAULT_LIST_CLASS_NAME;
  const itemClassName = options.itemClassName ?? DEFAULT_ITEM_CLASS_NAME;
  const linkClassName = options.linkClassName ?? DEFAULT_LINK_CLASS_NAME;
  const headingLevel = options.headingLevel ?? 2;
  const includeExcerpt = options.includeExcerpt ?? true;

  const items = matches
    .map((match) => {
      const title = getEntryTitle(match.entry, relationship);
      const href = getEntryUrl(match.entry, relationship);
      const excerpt = getEntryExcerpt(match.entry, relationship);
      const excerptHtml = includeExcerpt && excerpt
        ? `<p class="emdash-related-content__excerpt">${escapeHtml(excerpt)}</p>`
        : "";

      return `<li${classAttribute(itemClassName)}><a${classAttribute(linkClassName)} href="${escapeAttribute(href)}">${escapeHtml(title)}</a>${excerptHtml}</li>`;
    })
    .join("");

  return `<section${classAttribute(className)} data-emdash-related-content="${escapeAttribute(relationship.sourceCollection)}:${escapeAttribute(relationship.relatedCollection)}"><h${headingLevel}>${escapeHtml(heading)}</h${headingLevel}><ul${classAttribute(listClassName)}>${items}</ul></section>`;
}

function classAttribute(value: string): string {
  return value.length > 0 ? ` class="${escapeAttribute(value)}"` : "";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll("`", "&#96;");
}
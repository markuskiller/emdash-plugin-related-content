import { getEntryExcerpt, getEntryTitle, getEntryUrl } from "./matching.js";
import type { RelatedContentOptions, RelatedContentRelationship, RelatedEntryMatch } from "./types.js";

export function renderRelatedContent(
  matches: RelatedEntryMatch[],
  relationship: RelatedContentRelationship,
  options: RelatedContentOptions,
): string {
  const heading = relationship.heading ?? "Related content";
  const className = options.className ?? "emdash-related-content";
  const listClassName = options.listClassName ?? "emdash-related-content__list";
  const itemClassName = options.itemClassName ?? "emdash-related-content__item";
  const linkClassName = options.linkClassName ?? "emdash-related-content__link";

  const items = matches
    .map((match) => {
      const title = getEntryTitle(match.entry, relationship);
      const href = getEntryUrl(match.entry, relationship);
      const excerpt = getEntryExcerpt(match.entry, relationship);
      const excerptHtml = excerpt
        ? `<p class="emdash-related-content__excerpt">${escapeHtml(excerpt)}</p>`
        : "";

      return `<li class="${escapeAttribute(itemClassName)}"><a class="${escapeAttribute(linkClassName)}" href="${escapeAttribute(href)}">${escapeHtml(title)}</a>${excerptHtml}</li>`;
    })
    .join("");

  return `<section class="${escapeAttribute(className)}" data-emdash-related-content="${escapeAttribute(relationship.sourceCollection)}:${escapeAttribute(relationship.relatedCollection)}"><h2>${escapeHtml(heading)}</h2><ul class="${escapeAttribute(listClassName)}">${items}</ul></section>`;
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
import { definePlugin } from "emdash";
import type {
  ContentAccess,
  PageFragmentContribution,
  PageFragmentEvent,
  PluginCapability,
  PluginContext,
  PluginDescriptor,
  ResolvedPlugin,
} from "emdash";

import { getRelatedContent } from "./resolver.js";
import { renderRelatedContentSection } from "./render.js";
import type { ContentReader, EntryLike, RelatedContentOptions } from "./types.js";

export type {
  ContentListResult,
  ContentReader,
  EntryLike,
  GetRelatedContentOptions,
  RelatedContentOptions,
  RelatedContentPlacement,
  RelatedContentRelationship,
  RelatedContentRenderMode,
  RelatedContentSection,
  RelatedEntryMatch,
  RenderRelatedContentSectionOptions,
  RelationshipReference,
} from "./types.js";
export { findRelatedEntries } from "./matching.js";
export { getRelatedContent } from "./resolver.js";
export { renderRelatedContent, renderRelatedContentSection } from "./render.js";

const PLUGIN_ID = "related-content";
const PLUGIN_VERSION = "0.1.0";
const PLUGIN_ENTRYPOINT = "emdash-plugin-related-content";
const CAPABILITIES = ["content:read", "hooks.page-fragments:register"] as const satisfies PluginCapability[];

export function relatedContentPlugin(options: RelatedContentOptions): PluginDescriptor<RelatedContentOptions> {
  return {
    id: PLUGIN_ID,
    version: PLUGIN_VERSION,
    format: "native",
    entrypoint: PLUGIN_ENTRYPOINT,
    capabilities: [...CAPABILITIES],
    options,
  };
}

export function createPlugin(options: RelatedContentOptions = { relationships: [] }): ResolvedPlugin {
  return definePlugin({
    id: PLUGIN_ID,
    version: PLUGIN_VERSION,
    capabilities: [...CAPABILITIES],
    hooks: {
      "page:fragments": async (
        event: PageFragmentEvent,
        ctx: PluginContext,
      ): Promise<PageFragmentContribution[] | null> => {
        const page = event.page;
        if (page.kind !== "content" || !page.content?.collection || !page.content.id) return null;
        if (!ctx.content) return null;

        const relationships = options.relationships.filter(
          (relationship) =>
            relationship.sourceCollection === page.content?.collection && relationship.renderMode !== "manual",
        );
        if (relationships.length === 0) return null;

        const content = ctx.content as ContentAccess & ContentReader;
        const sourceEntry = await content.get(page.content.collection, page.content.id);
        if (!sourceEntry) return null;

        const sections = await getRelatedContent({ sourceEntry: sourceEntry as EntryLike, relationships, content });
        const fragments = sections.map((section): PageFragmentContribution => ({
          kind: "html",
          placement: section.relationship.placement ?? "body:end",
          key: `related-content:${section.relationship.sourceCollection}:${section.relationship.relatedCollection}`,
          html: renderRelatedContentSection(section, options),
        }));

        return fragments.length > 0 ? fragments : null;
      },
    },
  });
}

export default createPlugin;
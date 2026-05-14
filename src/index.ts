import { definePlugin } from "emdash";
import type { PageFragmentContribution, PluginCapability, PluginDescriptor, ResolvedPlugin } from "emdash";

import { findRelatedEntries } from "./matching.js";
import { renderRelatedContent } from "./render.js";
import type { EntryLike, RelatedContentOptions, RelatedContentRelationship } from "./types.js";

export type {
  EntryLike,
  RelatedContentOptions,
  RelatedContentPlacement,
  RelatedContentRelationship,
  RelatedEntryMatch,
  RelationshipReference,
} from "./types.js";
export { findRelatedEntries } from "./matching.js";
export { renderRelatedContent } from "./render.js";

const PLUGIN_ID = "related-content";
const PLUGIN_VERSION = "0.1.0";
const PLUGIN_ENTRYPOINT = "emdash-plugin-related-content";
const CAPABILITIES = ["content:read", "hooks.page-fragments:register"] as const satisfies PluginCapability[];

interface ContentListResult {
  items?: EntryLike[];
  entries?: EntryLike[];
  data?: EntryLike[];
  results?: EntryLike[];
}

interface PluginContextLike {
  content: {
    get(collection: string, id: string): Promise<EntryLike | null>;
    list(collection: string, options?: unknown): Promise<ContentListResult>;
  };
}

interface PageFragmentEventLike {
  page: {
    kind: string;
    content?: {
      collection?: string;
      id?: string;
    };
  };
}

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
        event: PageFragmentEventLike,
        ctx: PluginContextLike,
      ): Promise<PageFragmentContribution[] | null> => {
        const page = event.page;
        if (page.kind !== "content" || !page.content?.collection || !page.content.id) return null;

        const relationships = options.relationships.filter(
          (relationship) => relationship.sourceCollection === page.content?.collection,
        );
        if (relationships.length === 0) return null;

        const pluginContext = ctx;
        const sourceEntry = await pluginContext.content.get(page.content.collection, page.content.id);
        if (!sourceEntry) return null;

        const fragments: PageFragmentContribution[] = [];
        for (const relationship of relationships) {
          const fragment = await renderRelationship(pluginContext, sourceEntry, relationship, options);
          if (fragment) fragments.push(fragment);
        }

        return fragments.length > 0 ? fragments : null;
      },
    },
  });
}

async function renderRelationship(
  ctx: PluginContextLike,
  sourceEntry: EntryLike,
  relationship: RelatedContentRelationship,
  options: RelatedContentOptions,
): Promise<PageFragmentContribution | null> {
  const listResult = await ctx.content.list(relationship.relatedCollection, {
    limit: relationship.scanLimit ?? 100,
    orderBy: { publishedAt: "desc" },
    where: { status: "published" },
  });

  const matches = findRelatedEntries(sourceEntry, getListItems(listResult), relationship);
  if (matches.length === 0) return null;

  return {
    kind: "html",
    placement: relationship.placement ?? "body:end",
    key: `related-content:${relationship.sourceCollection}:${relationship.relatedCollection}`,
    html: renderRelatedContent(matches, relationship, options),
  };
}

function getListItems(result: ContentListResult): EntryLike[] {
  return result.items ?? result.entries ?? result.data ?? result.results ?? [];
}

export default createPlugin;
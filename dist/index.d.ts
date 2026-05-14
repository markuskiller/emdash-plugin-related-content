import type { PluginDescriptor, ResolvedPlugin } from "emdash";
import type { RelatedContentOptions } from "./types.js";
export type { ContentListResult, ContentReader, EntryLike, GetRelatedContentOptions, RelatedContentOptions, RelatedContentPlacement, RelatedContentRelationship, RelatedContentRenderMode, RelatedContentSection, RelatedEntryMatch, RenderRelatedContentSectionOptions, RelationshipReference, } from "./types.js";
export { findRelatedEntries } from "./matching.js";
export { getRelatedContent } from "./resolver.js";
export { renderRelatedContent, renderRelatedContentSection } from "./render.js";
export declare function relatedContentPlugin(options: RelatedContentOptions): PluginDescriptor<RelatedContentOptions>;
export declare function createPlugin(options?: RelatedContentOptions): ResolvedPlugin;
export default createPlugin;
//# sourceMappingURL=index.d.ts.map
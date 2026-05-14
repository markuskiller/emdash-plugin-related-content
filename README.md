# emdash-plugin-related-content

A collection-agnostic native emdash plugin that automatically renders dynamic related content on public content detail pages.

This package follows the current emdash native plugin docs: the root export provides a descriptor factory, `relatedContentPlugin()`, and a runtime `createPlugin()` default export. The source is exported directly from `src/index.ts`, matching current first-party emdash plugin packages and keeping this repository lightweight for server-side testing.

## Emdash Plugin Architecture Notes

This plugin was created against the latest emdash documentation available on 14 May 2026, with `emdash@0.10.0` kept as the first runtime target and `emdash@0.12.0` checked as the latest published package.

Docs consulted:

- `https://docs.emdashcms.com/plugins/creating-native-plugins/your-first-native-plugin/`
- `https://docs.emdashcms.com/plugins/creating-native-plugins/page-fragments/`
- `https://docs.emdashcms.com/plugins/creating-native-plugins/distributing/`
- `https://docs.emdashcms.com/llms.txt`

Architecture decisions from those docs:

- This is a native plugin because `page:fragments` is native-only and emits first-party public-page HTML.
- The package root exports two pieces: a descriptor factory for `astro.config.mjs`, and `createPlugin(options)` for the emdash runtime.
- The descriptor explicitly sets `format: "native"`, even though native is the default in current docs, so the package intent is clear.
- `id`, `version`, `capabilities`, and options are represented on the descriptor, and the runtime plugin repeats the matching `id`, `version`, and `capabilities` inside `definePlugin()`.
- The descriptor `entrypoint` is the package root, `emdash-plugin-related-content`, because emdash imports that module at runtime and calls its default export or `createPlugin` equivalent.
- The plugin declares `hooks.page-fragments:register` because page fragments require that capability, and `content:read` because the hook loads source and related entries.
- Fragment output uses `{ kind: "html", placement: "body:end", html, key }`, which is the documented contribution shape for public page fragments.
- Sites must render the matching fragment outlet, typically `<EmDashBodyEnd />`, or emdash will silently ignore `body:end` fragments.
- Native plugins are distributed as regular npm packages or GitHub/local installs, not through the sandboxed plugin marketplace.
- `emdash` remains a peer dependency supplied by the host site; this repo intentionally does not include a local npm dev environment.

## Install From GitHub

Until the package is published, install it in an emdash site from the GitHub repo or a local checkout:

```sh
npm install github:<owner>/emdash-plugin-related-content
```

or:

```sh
npm install file:../emdash-plugin-related-content
```

## Register

```ts
import emdash from "emdash/astro";
import { relatedContentPlugin } from "emdash-plugin-related-content";

export default {
	integrations: [
		emdash({
			plugins: [
				relatedContentPlugin({
					relationships: [
						{
							sourceCollection: "tools",
							relatedCollection: "posts",
							heading: "Related posts on langui.ch",
							maxItems: 6,
							placement: "body:end",
							relatedField: "relatedEntries",
							matchTitle: true,
							matchSlugInBody: true,
							matchSourceLinks: true,
							matchTags: true,
						},
						{
							sourceCollection: "tools",
							relatedCollection: "tools",
							heading: "Related tools",
							maxItems: 6,
							placement: "body:end",
							matchSharedFields: ["tool_family"],
						},
					],
				}),
			],
		}),
	],
};
```

## Capabilities

The plugin declares:

- `content:read`, to load the current source entry and candidate related entries.
- `hooks.page-fragments:register`, to render related content through `page:fragments`.

Fragments default to `placement: "body:end"`. Current emdash templates need the matching fragment outlet, usually `<EmDashBodyEnd />`, for that placement to appear. The plugin does not require relationship-specific theme changes.

## Matching

Each relationship maps a source collection to a related collection. When emdash renders a public content page, the plugin checks whether the page content belongs to a configured source collection, loads the source entry, scans published related entries, finds automatic matches, sorts them, and contributes an HTML fragment.

All concepts and options are collection-agnostic:

- `sourceCollection`: collection for the currently rendered detail page.
- `relatedCollection`: collection to list related entries from.
- `relatedField`: field containing explicit references from the source entry to related entries, or from related entries back to the source entry.
- `matchSharedFields`: field names whose overlapping values should create a match, including same-collection relationships.
- `matchTags`: `true` for a `tags` field, a string field name, or an array of field names.
- `matchTitle`: matches the source entry title in related entry field text.
- `matchSlugInBody`: matches the source slug in related entry field text.
- `matchSourceLinks`: matches strings that look like links to the source slug or id.

The standard sort order is `publishedAt` newest first. The plugin asks emdash for published related entries ordered by `publishedAt: "desc"`, then applies the same order after matching.

## Pinning

Pinned entries are supported only when pinning is explicitly activated for a relationship with `pinnedField`.

```ts
relatedContentPlugin({
	relationships: [
		{
			sourceCollection: "products",
			relatedCollection: "articles",
			relatedField: "relatedEntries",
			pinnedField: "activePin",
			pinOrderField: "pinOrder",
		},
	],
});
```

A source entry can store relationship objects like this:

```json
{
	"relatedEntries": [
		{ "id": "launch-notes", "activePin": true, "pinOrder": 1 },
		{ "id": "background-reading" }
	]
}
```

Pinned matches appear before non-pinned matches. Pinned entries with an explicit pin order sort by that order; otherwise entries sort by publishing time newest first.

## Rendering Options

- `heading`: heading text for the rendered section.
- `maxItems`: maximum rendered matches. Defaults to `6`.
- `scanLimit`: maximum number of candidate entries fetched from a related collection. Defaults to `100`.
- `placement`: page fragment placement. Defaults to `"body:end"`.
- `titleField`: display title field. Defaults to `title`, then `name`, then slug/id.
- `excerptField`: optional excerpt field. Defaults to `excerpt`, then `description`, then `summary`.
- `urlField`: optional field containing the public URL for a related entry.

The generated HTML uses stable classes such as `emdash-related-content`, `emdash-related-content__list`, `emdash-related-content__item`, and `emdash-related-content__link`.

## Testing With Curated Lists

For migration work, use the current curated related lists as fixtures by storing them in a generic `relatedField` shape. The matching engine accepts string ids, string slugs, and relationship objects with `id`, `entryId`, `slug`, and optional `collection`, so fixtures can mirror a WordPress migration without hard-coding collection names.

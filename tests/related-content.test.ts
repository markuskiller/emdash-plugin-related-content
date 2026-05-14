import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createPlugin,
  getRelatedContent,
  renderRelatedContentSection,
  type ContentReader,
  type EntryLike,
  type RelatedContentRelationship,
} from "../src/index.js";

const sourceEntry = entry("source-1", "source-slug", {
  title: "Source Title",
  tags: ["language", "ui"],
  category: "design",
  relatedEntries: [
    { id: "pinned-two", pinned: true, order: 2 },
    { id: "pinned-one", pinned: true, order: 1 },
    "explicit-post",
  ],
});

describe("getRelatedContent", () => {
  it("matches explicit references and returns structured sections", async () => {
    const relationship = baseRelationship({ relatedField: "relatedEntries" });
    const sections = await getRelatedContent({
      sourceEntry,
      relationships: [relationship],
      content: reader([entry("explicit-post", "explicit-post", { title: "Explicit" })]),
    });

    assert.equal(sections.length, 1);
    assert.equal(sections[0].relationship, relationship);
    assert.equal(sections[0].matches[0].entry.id, "explicit-post");
    assert.deepEqual(sections[0].matches[0].reasons, ["relatedField"]);
  });

  it("matches source links, slug text, title text, tags, and configured shared fields", async () => {
    const relationship = baseRelationship({
      matchSourceLinks: true,
      matchSlugInBody: true,
      matchTitle: true,
      matchTags: true,
      matchSharedFields: ["category"],
    });
    const sections = await getRelatedContent({
      sourceEntry,
      relationships: [relationship],
      content: reader([
        entry("link", "link", { title: "Link", body: "See /tools/source-slug/" }),
        entry("slug", "slug", { title: "Slug", body: "source-slug appears here" }),
        entry("title", "title", { title: "Title", body: "Source Title appears here" }),
        entry("tags", "tags", { title: "Tags", tags: ["ui"] }),
        entry("shared", "shared", { title: "Shared", category: "design" }),
      ]),
    });

    const matches = sections.flatMap((section) => section.matches);
    assert.deepEqual(new Set(matches.map((match) => match.entry.id)), new Set(["link", "slug", "title", "tags", "shared"]));
  });

  it("supports same-collection relationships and excludes the current source entry", async () => {
    const sections = await getRelatedContent({
      sourceEntry,
      relationships: [baseRelationship({ relatedCollection: "tools", matchSharedFields: ["category"] })],
      content: reader([
        sourceEntry,
        entry("other-tool", "other-tool", { title: "Other", category: "design" }, "tools"),
      ]),
    });

    assert.deepEqual(sections[0].matches.map((match) => match.entry.id), ["other-tool"]);
  });

  it("sorts pinned matches first by explicit pin order and then newest first", async () => {
    const sections = await getRelatedContent({
      sourceEntry,
      relationships: [baseRelationship({ relatedField: "relatedEntries", pinnedField: "pinned" })],
      content: reader([
        entry("explicit-post", "explicit-post", { title: "Explicit" }, "posts", "2024-01-01T00:00:00.000Z"),
        entry("pinned-two", "pinned-two", { title: "Pinned Two" }, "posts", "2020-01-01T00:00:00.000Z"),
        entry("pinned-one", "pinned-one", { title: "Pinned One" }, "posts", "2021-01-01T00:00:00.000Z"),
      ]),
    });

    assert.deepEqual(sections[0].matches.map((match) => match.entry.id), ["pinned-one", "pinned-two", "explicit-post"]);
  });

  it("deduplicates across match strategies", async () => {
    const sections = await getRelatedContent({
      sourceEntry,
      relationships: [baseRelationship({ relatedField: "relatedEntries", matchTags: true })],
      content: reader([entry("explicit-post", "explicit-post", { title: "Explicit", tags: ["ui"] })]),
    });

    assert.equal(sections[0].matches.length, 1);
    assert.deepEqual(sections[0].matches[0].reasons, ["relatedField", "matchTags"]);
  });

  it("returns no sections when there are no related entries", async () => {
    const sections = await getRelatedContent({
      sourceEntry,
      relationships: [baseRelationship({ matchTags: true })],
      content: reader([entry("unrelated", "unrelated", { title: "Unrelated", tags: ["other"] })]),
    });

    assert.deepEqual(sections, []);
  });
});

describe("renderRelatedContentSection", () => {
  it("renders semantic HTML with custom classes, h3, optional excerpt, and escaping", () => {
    const html = renderRelatedContentSection(
      {
        relationship: baseRelationship({
          heading: "Related <posts> on langui.ch",
          titleField: "headline",
          urlField: "url",
          excerptField: "teaser",
        }),
        matches: [
          {
            entry: entry("html", "html", {
              headline: "Example <post>",
              url: "/posts/example/?x=1&y=2",
              teaser: "Use <care>",
            }),
            pinned: false,
            score: 1,
            reasons: ["test"],
          },
        ],
      },
      {
        className: "tool-related-posts",
        listClassName: "related-post-list",
        itemClassName: "related-post-item",
        linkClassName: "related-post-link",
        headingLevel: 3,
        includeExcerpt: false,
      },
    );

    assert.equal(
      html,
      '<section class="tool-related-posts" data-emdash-related-content="tools:posts"><h3>Related &lt;posts&gt; on langui.ch</h3><ul class="related-post-list"><li class="related-post-item"><a class="related-post-link" href="/posts/example/?x=1&amp;y=2">Example &lt;post&gt;</a></li></ul></section>',
    );
  });

  it("can reproduce compact site markup by omitting item and link classes", () => {
    const html = renderRelatedContentSection(
      {
        relationship: baseRelationship({ heading: "Related posts on langui.ch" }),
        matches: [
          {
            entry: entry("example", "example", { title: "Example post" }),
            pinned: false,
            score: 1,
            reasons: ["test"],
          },
        ],
      },
      {
        className: "tool-related-posts",
        listClassName: "related-post-list",
        itemClassName: "",
        linkClassName: "",
        headingLevel: 3,
        includeExcerpt: false,
      },
    );

    assert.equal(
      html,
      '<section class="tool-related-posts" data-emdash-related-content="tools:posts"><h3>Related posts on langui.ch</h3><ul class="related-post-list"><li><a href="/posts/example/">Example post</a></li></ul></section>',
    );
  });
});

describe("page:fragments hook", () => {
  it("emits fragment output for fragment renderMode", async () => {
    const fragments = await runFragmentHook(baseRelationship({ relatedField: "relatedEntries", renderMode: "fragment" }));

    assert.equal(fragments?.length, 1);
    assert.equal(fragments?.[0].placement, "body:end");
    assert.match(fragments?.[0].html ?? "", /Explicit/);
  });

  it("skips fragment output for manual renderMode", async () => {
    const fragments = await runFragmentHook(baseRelationship({ relatedField: "relatedEntries", renderMode: "manual" }));

    assert.equal(fragments, null);
  });

  it("emits fragment output for both renderMode", async () => {
    const fragments = await runFragmentHook(baseRelationship({ relatedField: "relatedEntries", renderMode: "both" }));

    assert.equal(fragments?.length, 1);
  });
});

async function runFragmentHook(relationship: RelatedContentRelationship) {
  const plugin = createPlugin({ relationships: [relationship] }) as unknown as {
    hooks: {
      "page:fragments": {
        handler: (event: unknown, context: unknown) => Promise<unknown>;
      };
    };
  };

  return plugin.hooks["page:fragments"].handler(
    { page: { kind: "content", content: { collection: "tools", id: "source-1" } } },
    { content: reader([entry("explicit-post", "explicit-post", { title: "Explicit" })]) },
  ) as Promise<Array<{ placement: string; html: string }> | null>;
}

function baseRelationship(overrides: Partial<RelatedContentRelationship> = {}): RelatedContentRelationship {
  return {
    sourceCollection: "tools",
    relatedCollection: "posts",
    heading: "Related content",
    ...overrides,
  };
}

function reader(entries: EntryLike[]): ContentReader {
  return {
    async get(_collection, id) {
      if (id === sourceEntry.id) return sourceEntry;
      return entries.find((candidate) => candidate.id === id) ?? null;
    },
    async list() {
      return { items: entries };
    },
  };
}

function entry(
  id: string,
  slug: string,
  data: Record<string, unknown>,
  collection = "posts",
  publishedAt = "2024-05-01T00:00:00.000Z",
): EntryLike {
  return {
    id,
    slug,
    data: { collection, ...data },
    publishedAt,
  };
}
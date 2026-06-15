# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Shopify Online Store 2.0 theme for **Floura**. It is a customization of the
**Shapes** theme (Switch Themes, `theme_version` 4.1.0 in `config/settings_schema.json`;
docs at https://help.switchthemes.co/shapes/). There is no `package.json`, no build
tooling, and no git repo here — this directory *is* the deployed theme. The JS/CSS
bundles under `assets/` (`global.bundle.js`, `vendor.bundle.min.js`, `base.bundle.css`,
`island-*.bundle.js`) are **compiled artifacts** of the upstream Shapes source, which is
not present in this repo. Treat them as read-only; do not hand-edit bundles.

## Commands

Development uses the Shopify CLI from this directory:

```bash
shopify theme dev        # local dev server with hot reload against a dev store
shopify theme check      # lint Liquid / theme conventions (Theme Check)
shopify theme pull       # pull latest from the store (settings change in the admin)
shopify theme push       # push local changes to a theme on the store
shopify theme push --unpublished   # push as a new unpublished theme (safe preview)
```

There are no unit tests; `shopify theme check` is the only static check.
Theme Check is configured inline via `{% comment %}theme-check-disable RuleName{% endcomment %}`
directives in Liquid (e.g. `ParserBlockingScript`, `AssetPreload` in `layout/theme.liquid`).

## Where customizations live

When extending Floura, prefer the customization layer over upstream bundles:

- **`assets/floura.css`**, `assets/custom.css`, `assets/custom.js` — Floura-specific styles/scripts,
  loaded after the Shapes base CSS in `layout/theme.liquid`.
- **Custom sections**: `bundle.liquid`, `featured-p-w-skio.liquid`, `wholesale-collection.liquid`,
  `hotspot.liquid`, `custom-liquid.liquid`, `custom-table.liquid`.
- **Custom snippets**: `buy-box-bundle-subscription.liquid`, `skio-app-block.liquid`, `skio-head.liquid`.
- Page-specific templates live in `templates/page.*.json` (e.g. `page.floura-tastemakers.json`,
  `page.wholesalers.json`, `page.store-locator.json`) and product variants in
  `templates/product.*.json` (`product.bundle.json`, `product.bundle-subscription.json`,
  `product.preorder.json`, `product.merch.json`, `product.accessories.json`).

## Architecture

Standard Shopify theme layout: `layout/` (wrappers — `theme.liquid` is the entry point),
`templates/` (JSON OS 2.0 page definitions referencing sections), `sections/` (93 sections),
`snippets/` (138 reusable partials), `config/` (theme settings schema + saved data),
`locales/` (translations; `en.default.json` is canonical), `assets/`.

The non-obvious parts that span multiple files:

### Islands + Alpine hydration
The front-end is an **islands architecture**. Interactive widgets are authored as
`<data-island>` custom elements with Alpine.js directives (`x-data`, `x-intersect`,
`x-cloak`) — see `sections/video.liquid`, `sections/header.liquid`, etc. (~50 sections use
Alpine). `assets/data-island.bundle.js` lazy-hydrates each island, and `assets/global.bundle.js`
(loaded as a `type="module"` at the end of `theme.liquid`) bootstraps the theme. Alpine and
shared libs are in `assets/vendor.bundle.min.js`.

Modules are resolved through the **importmap** declared in `layout/theme.liquid` head
(`vendor`, `data-island`, `product`, `product-model`). Per-feature islands
(`assets/island-quick-buy.bundle.js`, `island-photoswipe.bundle.js`, `island-curved-text.bundle.js`,
etc.) are imported on demand by the sections that need them.

### Liquid → JS bridge
`snippets/js-bridge.liquid` (rendered in `theme.liquid` head) builds the global `window.theme`
object, exposing translated strings, cart routes, money formats, and theme settings to the
client JS. `snippets/css-bridge.liquid` and `snippets/critical-css.liquid` emit settings-derived
CSS. When adding client behavior that needs Liquid data (strings, settings, routes), thread it
through `js-bridge` rather than inlining duplicate Liquid in scripts.

### Section groups
`theme.liquid` renders `header-group`, `footer-group`, and `overlay-group` via `{% sections %}`.
Drawers/modals (`left-drawer`, `right-drawer`, `modal`, `popup`, `drawer-cart`) are rendered
once globally at the end of `<body>` and driven by the islands.

## Third-party integrations (already wired in)

- **Skio** (subscriptions): `assets/skio-plan-picker-component.js`, `assets/skio-volume-discount.js`,
  `snippets/skio-head.liquid`, `snippets/skio-app-block.liquid`, and the
  `product.bundle-subscription` template + `bundle-subscription-*.css`.
- **Bundles**: `sections/bundle.liquid`, `assets/bundle-product.js`, `assets/bundle-subscription.js`,
  `templates/product.bundle*.json`, `templates/page.bundle-page.json`.
- **B2B / Wholesale**: `templates/search.bss.b2b.liquid`, `sections/wholesale-collection.liquid`,
  `templates/page.wholesalers.json`, `page.wholesaler-registration.json`.
- **Faire**: `templates/page.purchase-on-faire.json`.
- **AvidAI tracking**: `assets/avidai-tracking.js`, injected in `theme.liquid` head
  (marked "DO NOT REMOVE").
- **PhotoSwipe** (product gallery lightbox): `assets/island-photoswipe.bundle.js`,
  `assets/modules-photoswipe.bundle.css`.
- jQuery 3.7.1 is loaded from a CDN near the end of `theme.liquid` for some bundle/subscription
  glue scripts.

## Conventions

- Localize all user-facing strings via translation keys (`{{ 'group.key' | t }}`) and add them to
  every file in `locales/` (`*.json` for storefront, `*.schema.json` for editor settings).
  `en.default.json` / `en.default.schema.json` are the defaults.
- The default color scheme is forced to `scheme3` on `<body>` in `theme.liquid`.
- `--max-site-width: 1820px` is the site width custom property.

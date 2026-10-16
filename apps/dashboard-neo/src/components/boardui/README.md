# Board UI sources

Theme, typography, button styles, chips, tables and stat cards are adapted from the
Board UI registry components installed in Faloos backoffice on 2026-10-07.
Source: https://github.com/BoardUI/boardui (MIT).

Dashboard controls compose the registry styling with Base UI React primitives.
Tables retain the registry's React Aria collection primitives. Stat-card tooltips use Base UI, icons use the app's existing Lucide dependency,
and application-specific template localization is omitted. The sidebar follows
Faloos's Board UI dashboard composition with the session routes and plugin manifest.

The studios also use BoardUI's segmented control, tabs, select, slider, checkbox
and radio components copied from the MIT source at
[ec5c5eb3e29c2441be63b9422cd54f411ef23466](https://github.com/BoardUI/boardui/tree/ec5c5eb3e29c2441be63b9422cd54f411ef23466/components/base).
Their direction, chevron, checkbox-glyph, menu-style and outside-press helpers
come from the same revision. These retain their React Aria behavior and BoardUI
tokens; only local import paths and an optional select trigger ID were adapted.
The trigger ID associates the studio's visible label with the select button.
The action menu composes BoardUI's shared menu surface and item recipe with the
dashboard's existing Base UI menu behavior. WhatsApp previews, message models,
sticker rendering and editor layout are application-specific.

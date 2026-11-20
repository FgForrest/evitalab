# `console` — shared infrastructure for query consoles

Abstract module. Everything the evitaQL, GraphQL and REST consoles share for turning a raw query response
into a visual representation. The console modules supply the concrete, language-specific parsers; this
module owns the abstractions, the visual model and the components.

Its one injection key, `resultVisualiserServiceInjectionKey`
(`result-visualiser/component/dependencies.ts`), is `provide`d per console tab — each console tab
provides *its own* `ResultVisualiserService` implementation, so the shared components below render
whichever language the surrounding tab speaks.

## Contents

```
console/
├── exception/         # QueryTelemetryInjectionError (run with telemetry)
├── result-status/     # ResultStatusBar — status, duration and size of the last result
└── result-visualiser/
    ├── component/     # ResultVisualiser.vue, shared VisualiserNote.vue + per-visualiser-type components
    ├── model/         # Visualised* view models
    └── service/       # ResultVisualiserService, ResultAnalyzer, per-type result parsers
```

### Service layer

| File | Purpose |
|------|---------|
| `service/ResultVisualiserService.ts` | The abstraction each console implements (`EvitaQLResultVisualiserService`, `GraphQLResultVisualiserService`, `RestResultVisualiserService`) |
| `service/ResultAnalyzer.ts` | Decides which visualiser types a given result supports |
| `service/FacetSummaryResultParser.ts`, `HierarchyResultParser.ts`, `AttributeHistogramsResultParser.ts`, `PriceHistogramResultParser.ts`, `ReferenceSummaryResultParser.ts`, `QueryTelemetryResultParser.ts` | Abstract per-type parsers; each console subclasses them |
| `service/utils/` | Shared helpers — `representativeAttributes.ts`, `representativeTitle.ts`, `schemaMatching.ts`, `impactFormatting.ts` |

### View state

`ResultVisualiser` is rendered with `v-if` while the console shows the visualiser, so switching to the raw result
and back remounts it. Its view state therefore lives in `model/ResultVisualiserState.ts`, which each console creates
once at setup (it lives as long as the console tab, it is not persisted) and passes as the `state` prop: the selected
query and visualiser type, and per query name a `QueryTelemetryVisualiserState` (open telemetry tabs, active tab,
the Plan tab's not-computed filter). `ResultVisualiser` calls `state.bindResult(result)` on every result; a result
other than the bound one (identity) drops the per-query states. A console must therefore hand over a **stable**
result object: the GraphQL console parses its result JSON in a `computed` — parsing it inline in the template gave
the visualiser a new result on every re-render of the console (e.g. after a workspace tab switch) and reset the
telemetry tabs. The selection watches of `ResultVisualiser` leave the restored selection alone until the result is
analyzed.

### Visualiser types

Five families, each with its own components and `Visualised*` models
(`model/VisualiserType.ts`, `VisualiserTypeType.ts`, `AnalyzedResult.ts`):

| Family | Components | Models |
|--------|-----------|--------|
| **Facet summary** | `FacetSummaryVisualiser`, `FacetGroupStatisticsVisualiser`, `FacetStatisticsVisualiser`, `ReferenceFacetGroupStatisticsVisualiser` | `VisualisedFacetSummary`, `VisualisedFacetGroupStatistics`, `VisualisedFacetStatistics` |
| **Hierarchy** | `HierarchyVisualiser`, `NamedHierarchiesVisualiser`, `NamedHierarchyVisualiser`, `HierarchyTreeNode`, `HierarchyTreeNodeTitle` | `VisualisedHierarchyResult`, `VisualisedNamedHierarchy`, `VisualisedHierarchyTreeNode` |
| **Histogram** | `HistogramVisualiser`, `AttributeHistogramsVisualiser`, `PriceHistogramVisualiser`, `HistogramChart`, `HistogramRange`, `HistogramInfo`, plus the shared `VisualiserNote` | `VisualisedHistogram`, `VisualisedHistogramBucket`, `VisualisedAttributeHistograms` |
| **Query telemetry** | `QueryTelemetryVisualiser`, `TelemetryOverview`, `PhaseShareBar`, `TelemetryFlamegraph`, `TelemetryQueryMetrics`, `TelemetryGraphCanvas`, `TelemetryStepsView`, `TelemetryStepCard`, `TelemetryPlanView`, `FormulaPlanCard`, `TelemetryFormulaGroupView` | `VisualisedQueryTelemetry`, `VisualisedTelemetryStep`, `TelemetryAlternativeVerdict`, `TelemetryPhaseShare`, `VisualisedFormulaPlan`, `VisualisedFormulaPlanNode`, `TelemetryTab`, `QueryTelemetryVisualiserState`, over `QueryTelemetryParseResult` (`ParsedQueryTelemetry` / `PartialQueryTelemetrySelection`) and the driver's `QueryTelemetry` |
| **Reference summary** | `ReferenceSummaryVisualiser`, `ReferenceGroupStatisticsVisualiser`, `ReferenceGroupStatisticsListVisualiser`, plus its own `FacetStatisticsVisualiser` / `HistogramStatisticsVisualiser` | `VisualisedReferenceSummary`, `VisualisedReferenceGroupStatistics`, and its own `VisualisedFacetStatistics` / `VisualisedHistogramStatistics` |

Note the facet-summary and reference-summary families each have a `FacetStatisticsVisualiser` and a
`VisualisedFacetStatistics` — they are distinct types in different directories, not duplicates.

Their **title rows are a parallel copy**, though: `ReferenceGroupStatisticsVisualiser` /
`reference-summary/FacetStatisticsVisualiser` carry the same markup, the same class names
(`group-title`, `facet-title`) and the same styles as `FacetGroupStatisticsVisualiser` /
`facet-summary/FacetStatisticsVisualiser`. Which pair a user sees depends on the **server**:
`referenceSummary` replaced `facetSummary` in evitaDB's query API, so a row fix applied to one family
only shows up on some servers and looks like the layout behaving at random. Change both, and see
[design language — composite titles](../design-language.md#composite-titles) for the rules those rows
implement.

#### Collections in the `Visualised*` models

The list-valued properties the visualisers page through — `children`, `trees`, `groups`, `facets`,
`histograms` — are Immutable `List`s, and `VListItemLazyIterator` accepts nothing else. That is not
decoration: the GraphQL hierarchy arrives **flat and level-ordered**, and
`GraphQLHierarchyResultParser` rebuilds the tree with a stack. It used to construct a
`VisualisedHierarchyTreeNode` around an empty `children` array and keep pushing into it as the stack
unwound — a node was therefore incomplete for as long as its subtree was still being read, behind a
`readonly` field that suggested otherwise. The stack now holds `PendingHierarchyNode` records and the
node is built at flush time, when its children are final. `test/modules/graphql-console/.../
graphQLHierarchyResultParser.test.ts` pins the traversal (nesting, multi-level climbs, the requested
node's identity), because nothing else does.

The evitaQL parser was already recursive and built children first, so for it the change is only the
wrapping.

#### Partially fetched histograms

A console renders whatever fields the user's query asked for, so any `Visualised*` property may be
missing. `HistogramRange` therefore has two modes: the **actual** range, which needs `min`, `max` and a
`threshold` on *every* bucket, and a **simulated** silhouette built from bucket indexes, which reports
the missing property names through `VisualiserNote`. Never assert a property is present — fall back to
the silhouette instead, and map JSON absence with `!= undefined`, because `0` is a legitimate
threshold, count and boundary.

#### Query telemetry

The actionable telemetry (`selfTime`, root metrics, formula `plan`, the `queryTelemetry(PLAN)` argument) shipped
with evitaDB 2026.3 ([evitaDB#1341](https://github.com/FgForrest/evitaDB/issues/1341)), so the supported-server floor in
`.evitadbrc` is at least that version (see [evitaDB server — versioning](../evitadb-server.md#versioning)).
An older server still answers the plain `queryTelemetry()` with phases and timings only (no self time, metrics or
plan) and rejects `queryTelemetry(PLAN)` as a syntax error. The server does not vary the telemetry response by
the `clientVersion` header.

`VisualiserTypeType.QueryTelemetry` is offered when the result carries telemetry: the evitaQL analyzer checks
`extraResults.queryTelemetry` of the internal `EvitaResponse`, the GraphQL analyzer checks that
`extraResults.queryTelemetry` of the query field is a non-empty array, the REST analyzer that it is an object (REST
sends the nested root step). The analyzers only check presence; the
**parser** decides whether the selection is usable.

`QueryTelemetryResultParser.parse(queryResult)` is synchronous, needs no entity schema and returns the
driver's internal `QueryTelemetry` model (see [database driver](../database-driver.md#query-telemetry)) wrapped
in `model/query-telemetry/QueryTelemetryParseResult.ts`, or `undefined` when there is no telemetry:

- `ParsedQueryTelemetry` — `telemetry: QueryTelemetry` plus `missingSelections: List<string>`, the optional
  GraphQL fields the user did not select (dotted paths: `start`, `selfTime`, `metrics.ioFetchCount`,
  `plan.hash`, …). Their values are `undefined` in the tree, except `start`, which is reconstructed by laying
  each step's children out back to back from the parent's start. Empty for evitaQL and REST (fixed shapes).
- `PartialQueryTelemetrySelection` — `missingRequiredSelections: List<string>` (`level`, `operation`,
  `spentTime`); the tree cannot be built. The UI renders it as a note listing the fields to add, never as a
  toaster error.

Narrow with `instanceof`. `ResultVisualiser.vue` passes the parse result to `QueryTelemetryVisualiser`.

##### View model (`model/query-telemetry/`, built by `service/query-telemetry/`)

- `visualiseQueryTelemetry(parsed)` → `VisualisedQueryTelemetry`: `root`, `steps` (flat pre-order `List`), `total`
  (ns), `phaseShares`, `missingSelections`, `startedAt`, `getStep(id)`, `pathTo(id)`, `subtreeSize(step)`, `hasPlan`,
  `maxDepth`. Durations are converted to `number` nanoseconds here (they only feed ratios and layout); `plan.hash`
  stays `bigint`.
- `VisualisedTelemetryStep`: **stable id** = operation path with sibling ordinals
  (`OVERALL/EXECUTION[1]/FETCHING[2]`), `depth`, `ordinal`, `start`/`spent`/`self` (`self` is `undefined` when not
  selected), `shareOfTotal`, `shareOfParent`, `arguments`, `metrics`, `plan`, `children`, `group`
  (`TelemetryPhaseGroup` by name prefix — for colouring only), `label` (phase without its group prefix, or the
  reference name for `FETCHING_REFERENCES`), `alternativeOrdinal` (`1`-based, candidates only; components render
  every step label through `telemetryStepLabel(step)` in `service/query-telemetry/telemetryStepLabel.ts`, which turns
  it into the i18n `label.alternative` "ALTERNATIVE #n"), `planStepId` (which step's plan the
  plan action opens) and, on `PLANNING_FILTER_ALTERNATIVE` only, a `TelemetryAlternativeVerdict`
  (`eligible`, `ineligibleReason`, `winner`, `hashUnknown`, `outranked`, `planNotRecorded`).
- **Winner rule:** an alternative of the top-level `PLANNING_FILTER` (its `PLANNING` parent is a direct child of
  `OVERALL`) wins only when its plan root `hash` equals the `OVERALL.plan` root hash — a loser's formula may equal a
  sub-formula of the executed plan. An alternative of a nested `PLANNING_FILTER` (deeper in the tree) also wins when
  its root hash equals any node hash of the executed plan. A missing hash on either side means *winner unknown* (`hashUnknown`), never
  "lost". The winner's plan action opens `OVERALL.plan` — its candidate plan is the same formula instance. The
  `Selected index: …` argument is never parsed.
- **Plan not recorded:** `planNotRecorded` holds only when the profile was taken with `PLAN` (`OVERALL.plan` or any
  step carries a plan) and an eligible alternative of a *nested* `PLANNING_FILTER` has no plan — evitaDB does not
  record those. A profile without `PLAN` and the top-level selection never get the disabled plan button; an
  alternative without a plan there simply has no plan action.
- **Phase share** (`TelemetryPhaseShare`) is computed from specific nodes, never by summing prefixes: planning = the
  root's planning children, fetching = fetching steps directly under the root or under its execution children,
  execution = the rest of the root's execution children, root = whatever remains.
- `visualiseFormulaPlan(stepId, executed, plan, hideNotComputed = false)` → `VisualisedFormulaPlan` (`root`,
  `executed`, `formulaCount`, `sharedCount`, `hiddenCount`). Runs of ≥ 3 consecutive childless siblings with equal
  `description` and no `refTo` collapse into one group node of **similar** formulas — equal description, but each
  member keeps its own instance, hash and numbers (`members`, `count`, summed numbers; a sum is `undefined` unless
  every member has the value); a back-reference's `refKey` points to the group when its target was collapsed. With
  `hideNotComputed`, children with neither `actualCost` nor `resultCount` (back-references excepted) are dropped with
  their subtree *before* runs are detected, so groups are built from computed members only and their key
  (`#<first id>×<count>`) may differ from the unfiltered one; the root is always kept, `formulaCount` still counts the
  plan as sent. `visualiseFormulaGroupMembers(group)` turns a group's members into standalone leaf nodes.
  `VisualisedFormulaPlanNode.state` is `FormulaPlanNodeState` `computed` / `ranNotPriced` / `notComputed`.
- `layoutTree(root, options)` (`service/query-telemetry/layoutTree.ts`) is the layout of both node-link views: fixed
  card size, `orientation` `TB` or `LR`, pre-order pass stacking leaves on the cross axis, parents centred on their
  children; nodes for which `isRef` holds are not placed but become `ref` edges to the node whose `nodeId` equals
  `refTarget`. No dependency. `layoutGrid(nodes, { w, h, gap })` in the same file lays unrelated nodes out row by row in
  a roughly square grid without edges, as a `TB` `TreeLayout`, for the same canvas.

##### Components (`component/query-telemetry/`)

- `QueryTelemetryVisualiser` (props `parseResult`, `state`) — the tab shell. Raw `VTabs` strip and a `v-if` body switch, never
  `VWindow` (the workspace's `.v-window` rule would leak in). Tab identity is `TelemetryTab(kind, stepId, group?)` with
  `kind` `overview` / `steps` / `plan` / `group` (a Group tab also carries the clicked group node, members included,
  and its key); opening an open identity activates it, the Overview is pinned, the other
  tabs close with a button or a middle click, as workspace tabs do (closing the active one activates its left neighbour). The tab list,
  the active tab and the not-computed filter come from the `state` prop (`QueryTelemetryVisualiserState`, see
  [view state](#view-state)), so they survive switching the visualiser type, the raw/visualiser view and workspace
  tabs, and reset to Overview only when a new result arrives. Tab titles use the short step label; when two open tabs of the same kind would read the
  same (top-level vs nested `FILTER`), the parent's label is prepended (`Steps · NESTED_QUERY › FILTER`, i18n
  `tab.nestedTitle`). A `PartialQueryTelemetrySelection` renders a `VisualiserNote` naming the missing fields.
  The root declares the phase palette as CSS custom properties (below).
- `TelemetryOverview` — total (`formatNanos`, tooltip on run-to-run spread), `startedAt`, `PLAN` chip, the result
  summary `N rows matched · M returned` (`· prefetched` when prefetched; `actualCardinality`, `recordsReturned` of the
  root metrics, shown only when metrics exist), a "Not selected: …" caption for optional GraphQL fields that were left out, `PhaseShareBar` with its legend,
  `TelemetryFlamegraph`, and `TelemetryQueryMetrics` (`VPropertiesTable` in a tonal `VCard`; the cardinality
  estimate gets an `Off by N×` warning chip at ≥ 10× or ≤ 0.1×, and `Off by ≥ N×` when nothing matched but at least
  10 records were estimated; an absent `prefetched` reads as the not-applicable em-dash).
- `TelemetryFlamegraph` — one absolutely positioned block per step, `(start, spent)` relative to the total, a row per
  depth; hatched self time of parents; labels drop below ~48 px (70 px on blocks with a plan) once the width is
  measured (all labels show until then); every block is at least 8 px wide so that a µs-long step (e.g. `PLANNING_SORT`) stays findable, blocks with a plan at least 22 px (a widened block near the right end is shifted left so that it never
  overflows the rows: `left = max(0, min(start%, 100% − width))`) and carry an `mdi-file-tree-outline` button (emits `openPlan`, stops propagation); a click
  (or Enter) emits `openSteps`; steps with an open tab are outlined in `primary-lightest`. Emits carry the step id.
- `TelemetryGraphCanvas` (generic; props `layout`, `nodeKey`, `refEdgeTooltip?`; slots `toolbar`, `actions?` (right of the toolbar, before the zoom buttons), `card`) — shared
  pan/zoom canvas: SVG edges (refs dashed with an arrowhead) under absolutely positioned HTML cards, drag and wheel pan,
  Ctrl + wheel zoom around the cursor, `+`/`−`/fit buttons, fit on open never above 1× and never below 0.5× (a larger
  graph is panned instead, the fit tooltip says so); the wheel never scrolls the pane. A `ResizeObserver` fits again
  when the canvas is resized, unless the user zoomed or panned since the last fit (the fit button resets that). Text
  selection is off while dragging. A press turns into a drag (and captures the pointer) only after the pointer moved
  4 px, so a click still reaches the card under it; the click that ends a drag is swallowed in the capture phase.
- `TelemetryStepsView` → `TelemetryStepCard` (props `step`, `root`, `telemetryRootId`; emits `openPlan`) — top-down
  subtree of the tab's step under a read-only path caption and the pluralised `N step(s) · duration`. Cards are
  256 × 88 px (`layoutTree` gap 34 / 12) with one row each for the short label (also on the tab's root card; the full
  operation name is in the tooltip) and plan button, the argument (ellipsised) with a candidate's `cost`, the numbers
  `spent · self · share` and the chips; numbers and chips are never ellipsised. Card fill = phase hue at alpha `0.12 + 0.78·√share` of
  the tab's root, dark ink above 0.55, phase stripe on the left; chips `Winner`, `Not eligible · reason`,
  `Hash missing`, `Prefetched`, the sort resolution; outranked candidates are dimmed; a candidate with
  `planNotRecorded` shows the plan button disabled with the reason. Cards are not clickable.
- `TelemetryPlanView` → `FormulaPlanCard` (props `node`, `executed`, `prefetched`) — left-to-right plan
  (cards 272 × 64 px, `layoutTree` gap 60 / 14: description (ellipsised) and state chip on the first row,
  `est · act · rows` on the second) with collapsed leaf runs (dashed, `×N` badge above the top edge), state chip, caption `… — executed plan` / `… — candidate plan` and
  `N formulas · M shared` (`· N not computed hidden` when filtered); candidate plans and not-computed formulas are
  dimmed; the tooltip explains why a formula of the executed plan was not computed (prefetch vs short circuit). A
  group card is a button (click, Enter or Space, emits `openGroup`) that opens a Group tab. The executed plan that has a
  not-computed formula gets an outlined *Not computed* filter chip (a one-chip `VChipGroup`, selected = shown, the
  default) in the canvas's `actions` slot (right of the toolbar, before the zoom buttons), bound to
  `v-model:hide-not-computed`; a candidate plan never has it, as nothing in it was computed.
- `TelemetryFormulaGroupView` (props `telemetry`, `step`, `group`) — the members of one group as individual
  `FormulaPlanCard`s on the canvas laid out by `layoutGrid`, under the caption `… — N similar formulas of <step>`, the
  group's summed numbers and a note that the members share only their description.

##### Phase palette

`component/query-telemetry/_telemetry-colors.scss` is private to these components (`@use "./telemetry-colors" as *`):
planning `#9C6ADB`, execution `#2E9E8F`, fetching `#BF8835`, root `#5C6378`, the self-time hatches and the dark ink.
Its mixin `telemetry-custom-properties`, included on the `QueryTelemetryVisualiser` root, declares
`--telemetry-{root|planning|execution|fetching}`, the matching `-rgb` triplets (used for alpha fills set from script)
and `--telemetry-ink-on-phase`. Nothing is added to `src/styles/colors.scss`.

## Result status bar

`result-status/component/ResultStatusBar.vue` sits at the top of the result pane of all three consoles and shows a
`ConsoleResultStatus` (`result-status/model/`): a status chip (success / error colour), the client-measured
duration, an optional size and an optional request label. It is hidden until the first result. Strings live in the
shared `resultStatus` i18n namespace; `service/resultStatusFormatting.ts` holds the pure formatting
(`formatResultSize` — B below 1 KiB, kB with one decimal below 1 MiB, MB above; `formatResultDuration`;
`utf8ByteLength`). Duration and size are measured by the console services, never by the driver:

| Console | Chip | Duration | Size | Request |
|---|---|---|---|---|
| evitaQL | `OK` / `Error` (a refused query — the `QueryError` path of `EvitaQLConsoleService`) | around `queryCatalog` in the service | — (the gRPC payload size is not available) | — |
| GraphQL | `OK` / `N error(s)` from the response's `errors` array (a GraphQL server answers them with 200) | around the HTTP call in the service | UTF-8 bytes of the compact response JSON | — |
| REST | `200 OK`, `400 Bad Request`, … | from the `RestResponse` | from the `RestResponse` | `METHOD path` |

The derivation is one pure function per console (`createEvitaQLResultStatus`, `createGraphQLResultStatus`,
`createRestResultStatus`). Metrics never shrink or wrap (`result-status-bar__metric`); only the request label is
ellipsised. A transport failure (the toaster path) clears the status, so the bar of an earlier result never sits
next to the error. The GraphQL size costs one compact `JSON.stringify` on top of the pretty-printed one the raw view
needs — the driver hands over the parsed response only, and measuring belongs to the console service, not the
driver. The REST label falls back to the standard reason phrase when the response carries none (HTTP/2 has no
reason phrase, the browser reports an empty `statusText`). The bar is the first flex child of the result pane, the absolutely positioned `VWindow` of the views is
anchored to the wrapper below it (`<prefix>-result__views`).

## Run with telemetry

All three consoles offer **Run with telemetry** (split Run button + `Ctrl+Shift+Enter` / `Cmd+Shift+Enter`), which
sends a copy of the query extended with the telemetry request and leaves the editor untouched. The
language-specific injectors live in the console modules (`injectQueryTelemetry` in
[`evitaql-console`](evitaql-console.md#run-with-telemetry), [`graphql-console`](graphql-console.md#run-with-telemetry)
and [`rest-console`](rest-console.md#run-with-telemetry));
this module only owns their shared failure type, `exception/QueryTelemetryInjectionError.ts`:
`QueryTelemetryInjectionError extends LabError` with `reason: QueryTelemetryInjectionFailureReason`
(`Unparseable` — syntax errors or no query; `NoTarget` — valid, but nothing that can collect telemetry, e.g. a
GraphQL document without a `query*` field). Consoles catch it, show a `toaster.warning` and run the original query.
The result then flows through the [query telemetry](#query-telemetry) visualiser like any hand-written request.

## Adding a visualiser type

The pieces to touch: a `Visualised*` model, a component under `result-visualiser/component/`, an
abstract parser here, and a concrete parser in **each** console module — plus registering the type in
`ResultAnalyzer`/`VisualiserType`, adding the parser field to `ResultVisualiserService` (and filling it in
each console's service implementation), and adding the parse `case` and the template branch rendering the
new component to `ResultVisualiser.vue`.

## Related

- [`evitaql-console`](evitaql-console.md), [`graphql-console`](graphql-console.md), [`rest-console`](rest-console.md) — the concrete implementations
- [UI components](../ui-components.md)

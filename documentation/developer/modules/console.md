# `console` — shared infrastructure for query consoles

Abstract module. Everything the evitaQL and GraphQL consoles share for turning a raw query response
into a visual representation. The console modules supply the concrete, language-specific parsers; this
module owns the abstractions, the visual model and the components.

Its one injection key, `resultVisualiserServiceInjectionKey`
(`result-visualiser/component/dependencies.ts`), is `provide`d per console tab — each console tab
provides *its own* `ResultVisualiserService` implementation, so the shared components below render
whichever language the surrounding tab speaks.

## Contents

```
console/
└── result-visualiser/
    ├── component/     # ResultVisualiser.vue + per-visualiser-type components
    ├── model/         # Visualised* view models
    └── service/       # ResultVisualiserService, ResultAnalyzer, per-type result parsers
```

### Service layer

| File | Purpose |
|------|---------|
| `service/ResultVisualiserService.ts` | The abstraction each console implements (`EvitaQLResultVisualiserService`, `GraphQLResultVisualiserService`) |
| `service/ResultAnalyzer.ts` | Decides which visualiser types a given result supports |
| `service/FacetSummaryResultParser.ts`, `HierarchyResultParser.ts`, `AttributeHistogramsResultParser.ts`, `PriceHistogramResultParser.ts`, `ReferenceSummaryResultParser.ts` | Abstract per-type parsers; each console subclasses them |
| `service/utils/` | Shared helpers — `representativeAttributes.ts`, `representativeTitle.ts`, `schemaMatching.ts`, `impactFormatting.ts` |

### Visualiser types

Four families, each with its own components and `Visualised*` models
(`model/VisualiserType.ts`, `VisualiserTypeType.ts`, `AnalyzedResult.ts`):

| Family | Components | Models |
|--------|-----------|--------|
| **Facet summary** | `FacetSummaryVisualiser`, `FacetGroupStatisticsVisualiser`, `FacetStatisticsVisualiser`, `ReferenceFacetGroupStatisticsVisualiser` | `VisualisedFacetSummary`, `VisualisedFacetGroupStatistics`, `VisualisedFacetStatistics` |
| **Hierarchy** | `HierarchyVisualiser`, `NamedHierarchiesVisualiser`, `NamedHierarchyVisualiser`, `HierarchyTreeNode`, `HierarchyTreeNodeTitle` | `VisualisedHierarchyResult`, `VisualisedNamedHierarchy`, `VisualisedHierarchyTreeNode` |
| **Histogram** | `HistogramVisualiser`, `AttributeHistogramsVisualiser`, `PriceHistogramVisualiser`, `HistogramChart`, `HistogramRange`, `HistogramInfo`, `HistogramNote` | `VisualisedHistogram`, `VisualisedHistogramBucket`, `VisualisedAttributeHistograms` |
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
the missing property names through `HistogramNote`. Never assert a property is present — fall back to
the silhouette instead, and map JSON absence with `!= undefined`, because `0` is a legitimate
threshold, count and boundary.

## Adding a visualiser type

The pieces to touch: a `Visualised*` model, a component under `result-visualiser/component/`, an
abstract parser here, and a concrete parser in **each** console module — plus registering the type in
`ResultAnalyzer`/`VisualiserType`.

## Related

- [`evitaql-console`](evitaql-console.md), [`graphql-console`](graphql-console.md) — the concrete implementations
- [UI components](../ui-components.md)

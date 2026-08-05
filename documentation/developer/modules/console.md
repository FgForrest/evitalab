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

## Adding a visualiser type

The pieces to touch: a `Visualised*` model, a component under `result-visualiser/component/`, an
abstract parser here, and a concrete parser in **each** console module — plus registering the type in
`ResultAnalyzer`/`VisualiserType`.

## Related

- [`evitaql-console`](evitaql-console.md), [`graphql-console`](graphql-console.md) — the concrete implementations
- [UI components](../ui-components.md)

# `catalog-viewer` — catalog preview

Feature module. Renders everything the engine can say about **one catalog**, split into six pages.
Contributes `TabType.CatalogViewer`. Implements [issue #161](https://github.com/FgForrest/evitalab/issues/161).

- **Provides:** `catalogViewerServiceInjectionKey`, `catalogViewerTabFactoryInjectionKey`
- **Injects:** `evitaClientInjectionKey`, `connectionServiceInjectionKey`,
  `tabFactoryRegistryInjectionKey`
- **Registered before** `ConnectionExplorerModuleRegistrar`, which injects the tab factory for its
  *Catalog preview* menu item.

> **Requires evitaDB 2026.3 or newer.** The five RPCs the pages rest on
> (`GetCatalogStatisticsSnapshot`, `GetEntityCollectionStatisticsSnapshot`, `BrowseIndexes`,
> `GetIndexDetail`, plus the shared `GrpcStatistics` messages) landed with
> [evitaDB#1339](https://github.com/FgForrest/evitaDB/issues/1339). Against an older server the calls
> fail and each page reports the failure through the toaster.

## Contents

| File | Purpose |
|------|---------|
| `component/CatalogViewer.vue` | Tab shell — toolbar, degraded-state alerts, the `VTabs` strip and the selected page (rendered with `v-if`, [not a nested `VWindow`](../ui-components.md)) |
| `component/StatTile.vue` | Label / big value / caption card (Activity counters, Memory "measured on this page") |
| `component/ComponentAvailabilityChips.vue` | Chips for the components the server **declined**, carrying its own reason |
| `component/UnavailableComponent.vue` | Stands in for an undelivered component — never `0`, never `-1` |
| `component/overview/` | `OverviewPage`, `CatalogHeader`, `CollectionsTable`, `CollectionStorageBar` |
| `component/storage/` | `StoragePage`, `StorageBreakdownBar`, `StorageBreakdownLegend`, `ActiveRecordShareGauge`, `StorageCompositionTable` |
| `component/indexes/` | `IndexesPage`, `CollectionSelector` (shared with Memory), `IndexSummaryTable`, `IndexCardinalityTable`, `CatalogIndexesCard` |
| `component/memory/MemoryPage.vue` | The index browse and the per-row heap measurement |
| `component/activity/` | `ActivityPage`, `CommitPipelineDiagram` |
| `component/history/` | `HistoryPage`, `CatalogVersionsTable`, `RestoreCatalogVersionDialog` |
| `composable/useCatalogSnapshot.ts` | Per-page snapshot loading, polling and pausing |
| `composable/useCollectionSnapshots.ts` | The shared per-collection snapshot fan-out every per-collection table and badge set is built on |
| `composable/useCollectionIndexCounts.ts` | Per-collection index counts for the selector badges (Indexes and Memory), on top of `useCollectionSnapshots` |
| `model/` | Tab params/data, `CatalogViewerPage`, `StorageBreakdownRow`, `CatalogVersionSummary`, and the storage vocabulary of `storageComposition.ts` — `StorageBucket`, its colours, labels and row types |
| `service/statisticsFormatting.ts` | The formatting rules every page shares — above all *an absent value is an em-dash, never `0`* |
| `service/storageComposition.ts` | The fold of the server's storage-part rows into buckets (`storageBucketOf`, `summarizeStorageComposition`) |
| `service/CatalogViewerService.ts` | Every server read of the module, the per-page component sets, and the one write — the restore request |
| `service/CatalogViewerTabFactory.ts` | Tab wiring; the selected page lives in `CatalogViewerTabData`, so it survives restore and share links |

## Why six pages, and why each fetches its own data

The engine exposes statistics as independently selectable **components**, and the pages exist to make
that selection legible: *a page never pays for a page the user has not opened.* The sets live in one
place — `catalogViewerComponents` in `CatalogViewerService` — so the refresh policy is reviewable
without reading six components.

| Page | Components | Refresh |
|---|---|---|
| Overview | `IDENTITY`, `RECORD_COUNTS`, `COLLECTIONS`, `SESSIONS`, `INDEX_SUMMARY` | polled every 5 s while displayed |
| Activity | `IDENTITY`, `ACTIVITY`, `COMMIT_PIPELINE`, `DURABILITY` | polled every 5 s while displayed, pausable |
| Storage | `IDENTITY`, `STORAGE_SIZE`, `STORAGE_COMPOSITION`, `FRAGMENTATION`, `VOLATILE_STATE`, `COLLECTIONS` | on activation, then the toolbar's reload |
| History | `IDENTITY`, `HISTORY`, `STORAGE_SIZE` | on activation, then the toolbar's reload |
| Indexes | catalog: `COLLECTIONS`, `INDEX_SUMMARY`, `INDEX_CARDINALITY`; collection: `INDEX_SUMMARY`, `INDEX_CARDINALITY`; selector badge: `INDEX_SUMMARY` alone | on activation; the collection half only for the selected collection, the badge once per collection |
| Memory | `browseIndexes`, then `getIndexDetail` **per row**; selector badge: `INDEX_SUMMARY` alone | browse on activation and on every filter / order / page change; the badge once per collection; measure only on an explicit per-row action |

`useCatalogSnapshot` enforces two rules every page depends on: **nothing is requested while the page
is not displayed** (the poll loop is cleared as soon as it stops being), and **a failed read keeps the
previous reading on screen** — blanking a page on a transient failure throws away the last thing the
user could act on. Background polls are silent; a user-initiated read — the first load and the
toolbar's reload alike — reports its failure through the toaster, so a page without a poll interval
never fails into a blank body with no explanation. Overlapping reads are sequenced: when a manual
reload races an in-flight poll tick, only the newest request may write the snapshot, so an older
reading never overwrites a newer one.

### The collections table is deliberately outside the poll

`COMPONENT_COLLECTIONS` at catalog level is an *inventory only* — it returns the entity type and its
internal primary key, and no statistics. Every populated column of the Overview table therefore costs
one `getEntityCollectionStatisticsSnapshot` call **per row**, and those pull `STORAGE_SIZE`, which is
bounded IO. A catalog with fifty collections polled every five seconds would issue fifty IO-bearing
calls per tick. `CollectionsTable` and `StorageCompositionTable` consequently load once and again only
on an explicit reload, independently of the polled identity block above them.

The fan-out itself lives in one composable — `useCollectionSnapshots` — used by `CollectionsTable`,
`StorageCompositionTable` and (through `useCollectionIndexCounts`) the selector badges, and it owns
the three rules they all depend on. The polled snapshot hands over a **fresh inventory list on every
tick**, so the inventory is watched by the collections' *names* rather than the list instance. The
per-collection reads are **independent** (`Promise.allSettled`): one failed collection costs its own
entry only — the successes are kept, the failed collection keeps its previous reading if it has one,
and the failure is toasted once for the whole set. And the result map is **swapped over whole** only
once every collection has answered — a table that empties itself first blinks on each reload, and a
half-populated one invites reading a missing value as a real one. `StorageCompositionTable` requests
`STORAGE_COMPOSITION` alone per row: it renders nothing else, and every extra component would be paid
once per collection on every visit.

## Absence is rendered, never zeroed

The engine reports absence three different ways, and each is handled distinctly:

1. **Per-component status.** Every requested component comes back with an availability
   (`DELIVERED` / `CATALOG_UNUSABLE` / `FEATURE_DISABLED`) and a reason string.
   `ComponentAvailabilityChips` reports the **declined** ones only — that a section was delivered is
   already said by the section carrying numbers — and `UnavailableComponent` replaces the section body
   with the **server's own reason**. A component the page never requested has no status at all, and
   that is reported as a distinct case rather than folded into "unavailable".
2. **Genuine absence.** Optional fields (`BrowsedIndex.entityCount`, `IndexCardinality.indexType`,
   `CollectionHeaderInfo.lastModified`, …) convert to `undefined` and render as the em-dash
   placeholder. `0` would read as "covers nothing", which is a different claim.
3. **Sentinels, in one place only.** An unusable catalog's identity carries `catalogVersion = -1` and
   `entityCollectionCount = -1`. `CatalogIdentity.knownCatalogVersion` /
   `knownEntityCollectionCount` are the accessors that turn them into `undefined`; no call site
   compares against `-1`.

Degraded states are surfaced by the shell: a `VAlert type="error"` for a corrupted catalog (Storage
stays populated — file lengths are readable whether or not the catalog loads), `type="warning"` for
`WARMING_UP`, and an indeterminate `VProgressLinear` plus a note for the transitional `BEING_*` /
`GOING_ALIVE` states.

## Things the pages state rather than infer

Three engine contracts are easy to violate by writing the "obvious" UI, and each has a comment at the
site that honours it:

- **The active record share is not the compaction verdict.** `FRAGMENTATION.activeRecordShare` is a
  catalog-wide aggregate; the compaction predicate is evaluated per data file against its own file
  length, and the contract states the two must not be compared. `ActiveRecordShareGauge` draws the
  server's configured thresholds as *context* — a colour legend of the two share thresholds the
  server reports, with the band the current reading falls into emphasised — and the verdict comes
  from `compactionEligibleNow` alone, as a separate chip. The aggregate caveat is the tooltip on the
  gauge's own title, so the gauge cannot be read as stating a verdict it does not state. The gauge
  fills the fragmentation grid's column: the chart flexes, the legend keeps a fixed basis, and the
  arc grows with the column up to the ceiling the `height` prop sets (see
  [design language — charts](../design-language.md#charts)).
- **Distinct values and records covered are not interchangeable**, even for a unique index: a
  globally-unique attribute that is also localized has one locale-less key covering every locale, so
  one record can own several values. `IndexCardinalityTable` shows both columns.
- **`BrowsedIndex.measured` must be branched on before rendering a zero.** "Not measured" (the
  operator switched `server.usageStatisticsTracking` off) and "never queried" are opposite findings,
  and only the second says an index can be dropped. An absent flag decodes as `true` — a server
  predating it always measured.

## Activity: every counter is read against something

The three components the page requests are fully rendered — there is no figure the engine delivers
and the page drops. Two of them are rendered somewhere other than a tile, on purpose:

- The **pipeline deltas** (`assigned → written`, `written → durable`, `durable → visible`) are not
  server fields at all; `CommitPipelineStatistics` derives them from the four watermarks, and they
  live on the edges of `CommitPipelineDiagram` rather than in the counter row: they are watermark
  differences, not counters, and a delta only means anything between the two watermarks it
  separates. (The issue's Activity table lists them alongside the five counters, which describes
  both blocks at once, not eight cards.) Each edge is therefore **named on the diagram** — the label
  above the count, not only in the tooltip: `0 versions` on an arrow does not say between which two
  watermarks. An edge is rendered together with the stage it *enters* (`PipelineSegment.edge` is the
  incoming one), so a chain too wide for the page wraps between segments and never between an edge
  and the watermark it points at.
- **`ACTIVITY.pipelineDepth` is shown once.** The engine repeats it in the activity component so a
  client polling that component alone can still tell a busy catalog from a backed-up one; this page
  requests both, so the number appears only at the end of the diagram, as a labelled value.

A bare count is not a reading, so **conflicts carry the share of the transactions that finished**
(committed + rolled back + conflicted). The denominator is zero on a freshly loaded catalog, and then
the caption is omitted rather than printed as `0 %` — `share()` already returns `undefined` there.
`formatSmallPercent` keeps two significant digits: conflicts are rare by nature, and the ordinary
one-decimal percentage rounds a real conflict rate to `0 %`.

**Durability figures are millisecond-scale**, which the shared `toHuman` patch
(`vue-plugins/luxonExtensions`) is not by default — it stops at whole seconds. `formatDuration`
therefore asks for `smallestUnit: 'milliseconds'`. Without it an 11 ms force reads `0 sec`, and a
fence depth of 1 017 ms reads `1 sec` — the same text as the 1 s interval it is being flagged for
exceeding, which makes the page contradict itself.

**The block's only health verdict is on the fence depth, never on the cadence.** A cadence far above
the configured interval is the normal reading of a catalog that is written to rarely — there was
nothing to checkpoint in between — so the figure cannot tell an idle catalog from an overloaded one
and must not be decorated as if it could. What can is `fenceOverdue`
(`lastFenceDepthMillis > checkpointIntervalMillis`): the last checkpoint made a change durable later
than the configuration allows, which is the engine's own `fenceOverdue()` expressed over gRPC.
The comparison is relative on purpose — 30 s of fence depth is alarming on a 1 s interval and exactly
as configured on a 30 s one — and `fenceSeverelyOverdue` (five intervals) escalates `warning` to
`error`. The depth stays a plain value and the verdict is the chip beside it, so the block still has
exactly one chip, just on the other row.

Fence depth is also **not** the duration of the device force: that is the second half of *Files
forced* (`lastForceDurationMillis`). Wording the two the same way would have every reader conclude
one of them is broken, so the tooltips name what each measures — the age of the oldest change the
checkpoint made durable, versus the time the force itself took — and the *Files forced* row is what
the overdue chip's tooltip points at for the reason.

Two states the block handles rather than rendering as zeros. When nothing has checkpointed yet
(`checkpointed` is false), only the configured interval is shown, under an info alert saying the
catalog is freshly opened or write-idle rather than stalled — every other figure would describe a
checkpoint that never happened. When the component itself comes back `FEATURE_DISABLED`,
`UnavailableComponent` prints the **server's own reason text**, which matters here more than
elsewhere: one of the two reasons is that writes are not being synced to the disk at all, and a row
of zeros would read as *durability is instant and free* when it means the opposite.

Each figure describes a **single** checkpoint and only changes when another one happens, so *Last
checkpoint* carries a relative age (`{when} · {age}`, from Luxon's `toRelative`) and the block closes
with the cross-check: the commit pipeline answers the same question in catalog versions, and neither
derives from the other — a deep fence with a small version lag means few but expensive writes, a
shallow fence with a large one means many small ones. Query latency and throughput stay in
observability, which the closing note says — with no link, because the lab does not know the reader's
dashboard and a link to the generic documentation is not one.

## Indexes: the owner selector is the whole navigation

The page describes one owner at a time — the catalog itself, or one entity collection — and picks it
with a single `VChipGroup` (`CollectionSelector`, shared with Memory). The selected chip is the only
thing that says where the tables below belong: there is **no breadcrumb**, because with one
always-selected level there is nothing to navigate back to, and a trail that repeats the chip
promises a deeper level the page does not have. Being a selector, its chips carry the `outlined`
variant the [design language](../design-language.md#chips-the-variant-is-a-promise-about-interaction)
reserves for actionable chips, while the metadata chips of `IndexCardinalityTable` stay plain.

**Every chip carries its owner's index count, at one call per collection.** `INDEX_SUMMARY` reports
only the catalog-wide total at catalog level by design — the breakdown lives at the collection level
— so `useCollectionIndexCounts` reads `indexesCollectionSummary` (that component alone, never the
cardinality walk) for each collection. The server answers each from maintained per-(type, scope)
counters, so the cost is the round trips and not the work; they are re-read when the collection
inventory changes, not on every refresh, the same way `CollectionsTable` stays out of the poll. A
collection whose count did not arrive gets no badge. The catalog chip badges the global unique
attribute indexes it holds, which is exactly what the table below the selector lists.

The Memory page uses the same composable for its own selector, and it is the only difference between
the two: its catalog chip carries **no** badge, because `INDEX_SUMMARY` reports the catalog-wide
total rather than how many indexes the catalog holds itself, and the global unique attribute indexes
the Indexes page badges are a different unit than the index rows Memory browses.

The counts also **order the chips**, most indexes first, so the selector leads with the collections
worth opening; the catalog chip stays pinned in front of them as the page's fixed entry point. A
collection with no count sorts last rather than as a zero, and where no counts are supplied at all
the server's inventory order is kept instead of an order the page cannot justify.

`IndexCardinalityTable` is a `VDataTable` whose **measured columns sort** — entities covered,
distinct values, records covered, cardinality ratio — with the standard `mdi-sort` affordance; the
three descriptive columns do not. No default sort is declared, so the rows arrive in the engine's own
response order: per scope, the `GLOBAL` index first and then each reference's
`REFERENCED_ENTITY_TYPE` / `REFERENCED_GROUP_ENTITY_TYPE` index, and *within* one index the attribute
indexes grouped `UNIQUE` → `FILTER` → `SORT`. Inside a group the order is the backing index map's own
iteration order, which is neither alphabetical nor stable across writes — that is precisely why the
measured columns sort, and why the grouping (what the *Index* column reads by) is worth keeping as
the unsorted default.

The per-index level the issue sketches *is* implementable — `browseIndexes` is paginated and
filterable by type, scope and reference name and carries no heap figure, and `getIndexDetail`
measures one named index on an explicit action — but it is not part of this build. When it lands it
brings its own navigation and the selector stays the level above it.

## Memory: a table with a per-row action, not a treemap

Estimating an index's heap walks its contents and **cannot be amortised** — a measured warm second
pass came back slower than the cold one. On a production catalog the median index takes about 4 µs
and the worst one 151 ms, so naming one index is affordable and sweeping a collection of a quarter of
a million of them is not. That figure lives on the *Measure* button's own tooltip, next to the entity
count of the row it would walk: it is needed at the moment of clicking, and a banner over the page
would state it once and then cost vertical space on every later visit.

Two consequences the page states in the UI rather than hiding:

- **there is no collection total.** The "measured on this page" tile sums the *measured rows only*,
  and its caption says so. It sits **beside** the table, not under it — the sum belongs to the page
  currently on screen, and a footer position puts it below the paging that replaces that page;
- **sorting by measured size is impossible** — it would mean measuring everything first. The order
  select offers map order, entity count, query count and update count, and carries measured size as
  a disabled entry whose subtitle is the reason.

Everything about *which* rows are shown is a control, and the controls are split by what they belong
to. The filters — index type and scope as `VChipGroup`s, reference name as a `VSelect` — sit above
the table in one row, and all three carry their name in the *same* caption above the control: a
floating label inside the select would put its name on a line of its own and read as a fourth thing
rather than the third filter. Paging and page size are the `VDataTableServer`'s own footer
(`v-model:page` / `v-model:items-per-page` against `page.totalNumberOfRecords`), and the **order
select sits in that footer's `footer.prepend` slot** next to the pages, together with the catalog
version the page was read at: the ordering is a *server* ordering that the page is cut out of, so it
is not a column sort and no column is sortable. See
[data grids](../design-language.md#data-grids) for the general rule.

Measurements are keyed by the index's identity pair (`entityType` + `indexPrimaryKey`) and are
cleared whenever the page changes: a heap estimate belongs to the reading that produced it, never to
a row position.

**The action lives in the column it fills in.** *Estimated size* holds the *Measure* button while the
row is unmeasured and the figure once it is not, so the empty column explains itself — the size is
absent because nobody asked for it, and the thing that asks is right there. No separate action column
and no "measured" marker: the figure's presence is the marker. A measured cell keeps a trailing
`mdi-refresh` icon button to walk the index again, whose tooltip says a re-measurement costs exactly
what the first one did.

## Storage composition groups by the server's classification, never by a class name

`STORAGE_COMPOSITION` reports one row per **storage-part type**, keyed by its simple class name —
`EntityBodyStoragePart`, `FilterIndexStoragePart`, `PriceListAndCurrencyRefIndexStoragePart`. That
set is open (36 registered record types today, and an index that grows starts paging its leaves into
new ones), and nothing in a name says what the name is: two of the engine's index parts carry no
`Index` in theirs. So the lab never classifies by it. Since
[evitaDB#1500](https://github.com/FgForrest/evitaDB/issues/1500) every row also carries `group` (a
**closed** set of fourteen) and `kind` (its coarse fold: entity data, index, metadata), and that is
what the table groups by.

`service/storageComposition.ts` owns the fold (the vocabulary it folds into is `model/storageComposition.ts`), in one line of intent: a **bucket** is
`kind === ENTITY_DATA ? group : kind`, which is exactly the six kinds of data the issue names plus
the schema and header records every data store also holds. Rules the code keeps:

- **a bucket is a sum, never a representative row.** `EntityIndexStoragePart` is the deliberately
  small manifest of an entity index — 2 129 B against 45 739 B of actual index structures on the
  measured fixture — so reading it as "Indexes" understates them by an order of magnitude;
- **an unrecognised group falls back to its `kind`**, which is why `kind` is on the wire as its own
  field rather than derived; a row that classifies as nothing lands in *Unclassified*. Neither is
  folded into *Indexes*: a catch-all that quietly absorbs the unknown is the failure this
  classification exists to end. `StoragePartUsage.kind` is otherwise **derived** from the group (as
  the Java driver does), so the two fields on a row can never disagree;
- **the legend is the documented buckets**, present or not, so a colour learned on one catalog holds
  on the next; the two fallback buckets join it only when a catalog actually reports one.

The breakdown a collection row opens into lists those buckets, and a bucket that summed more than
one group opens one level further — *Indexes* into *Attribute index*, *Price index*, *Index
manifest*, *Facet index*, *Hierarchy index*…, *Schema & headers* into *Schemas* and *Headers*. That
second level is the point of the fine axis: *Attribute index* sits next to *Attributes*, and the
pair states what indexing the attributes costs against what storing them costs. The class names stay
visible as the row's tooltip — an identity to show, never one to classify by.

The **catalog's own data store** (`storageComposition.catalogParts`) is the first row of the table,
in italics, next to the collections — the same store the fragmentation table reports live and waste
bytes for. It leads because it is not a collection but the store the others sit in; the collections
below it are ordered by payload, biggest first, so the order answers the section's question
alongside the bars.

The figures themselves need no correction: the byte totals reconcile exactly with `STORAGE_SIZE`,
and the only derived values are the average (`totalBytes / count`) and the share of the store's own
composition. Note that the row total is record *payload*, which is less than the collection's size
on disk — it excludes reclaimable waste and the offset-index bookkeeping that belongs to no part
type, and its tooltip says so, because the Overview tab reports the larger figure for the same
collection.

> The measurements behind all of this — the reconciliation with `STORAGE_SIZE`, why a name test
> misfiles `EntityIdsStoragePart` and `HistogramCardinalityStoragePart`, and the mapping the client
> would have had to carry without the server-side classification — are kept in
> [`161-storage-composition-parts-analysis.md`](../../../.claude/plans/161-storage-composition-parts-analysis.md).

## Everything else is reached, not reimplemented

The catalog preview owns the statistics and **one catalog action**, the restore of a listed version
([below](#restore-to-this-version)), which has no other home because the version it acts on is
found here. Renaming, dropping, backing up and the rest stay in the connection explorer's catalog
menu, which is one click away and is the single place a user learns them. `CatalogHeader` is
therefore identity only — name, then lifecycle state and write mode as plain chips (each label
capitalised like every other chip in the preview), and the version as a plain value beside them: a
version is a measurement, and the [design language](../design-language.md#chips-the-variant-is-a-promise-about-interaction)
keeps measurements out of chips.

**The header is the only rendering of state and version.** The identity table below them
carries the figures the chips do not (catalog id, write mode note, read-only flag, collection count)
and deliberately omits those two: one figure rendered twice on the same screen invites the reader to
check whether the two renderings agree, and a poll that refreshes one before the other makes that
question reasonable. The state chip and the version therefore also carry the tooltips the table rows used to.

Link-outs are the module's only reach outwards: `entity-viewer` and `schema-viewer` from the
collections table and the cardinality tables, `history-viewer` from the catalog-versions table, and
the external Grafana note from Activity. Within the tab, an expanded collection row hands its entity type to the Indexes page
(`openPage(page, entityType)` → `IndexesPage`'s `entityType` prop), so *Inspect indexes* arrives on
that collection rather than on the catalog's own indexes. The row's index breakdown is the Indexes
page's own `IndexSummaryTable`.

There is deliberately **no Schema page** — `schema-viewer` already renders all of it, and a second
rendering would drift out of sync.

## Where the catalog versions table comes from

The `HISTORY` component carries only the retention *coordinates* — oldest and newest version with
timestamps, WAL file count and bytes, the deletion floor and the awaiting-deletion split. It has no
per-version listing. `CatalogViewerService.getCatalogVersions` therefore reads the **mutation history
API** (the same one `history-viewer` uses) and keeps the transaction lead of every version the
capture pages touched. That API is reverse-only and pages *captures*, not versions, so each capture
fetch is over-fetched by a fixed factor — and because one bulk transaction can hold more captures
than a whole fetch, the service keeps fetching below the oldest version it touched until the version
page is assembled or the retained history ends (a short capture page). Without that continuation a
few bulk transactions would consume the whole capture budget and the table would declare a premature
end of history. The table walks backwards through anchors it remembers.

`CatalogVersionsTable` is a `VDataTableServer` and lets Vuetify's own footer drive that walk. The API
reports **no total** — a WAL scan cannot produce one cheaply — so `items-length` is a *floor*: the
rows already seen, plus one whenever the last page came back full. That is exactly enough for the
footer to offer the next page, and the number grows as the reader walks backwards. Page size and page
number live in the table (`v-model:page` / `v-model:items-per-page`); a page turned forward records
its anchor from the oldest row still on screen before the rows are replaced, which is why only the
page after the last visited one can be reached.

**An empty table is two different findings.** A catalog that never committed a transaction (still
warming up, or made alive without one) has no version history at all; a catalog whose versions are
simply not in the retained write-ahead log — bulk-loaded before going alive, or dropped by WAL
retention — has one, and just cannot show it. `newestVersion` tells the two apart, and the `no-data`
slot says which one it is instead of leaving a blank table that reads as a bug.

## Restore to this version

Each reversible row of the catalog-versions table carries *Restore to this version*, which opens
`RestoreCatalogVersionDialog`. The dialog requests one server operation —
`EvitaClientManagement.restoreCatalogToVersion` (gRPC `RestoreCatalogToVersion`, evitaDB PR #1558) —
that backs the version up, restores the archive into a temporary catalog, loads it and swaps it in
under the target name, all as **one server task**. Nothing is uploaded, and the catalog keeps
serving until the final swap; the earlier design, which sent the user to `backup-viewer`'s
point-in-time backup and left the restore-and-replace to them, is gone.

The dialog is `dangerous` and its single field is the catalog the restored state is served under,
a `VCombobox` over the current catalog names that also accepts a free name. The description above
the form is static: it explains the operation and the three things the target can be. The warning
under the form is rewritten for the *current* choice, because which catalog is swapped, and what
the operation destroys, differ between them:

| Target | What the warning says |
|---|---|
| the source catalog (default) | the source keeps serving until the restored copy takes its place; it is purged with its whole history, and every write after the version — including those made while the restore runs — is lost |
| another existing catalog | the source is untouched and keeps its later writes; *that* catalog is the one swapped and purged |
| a free name | the source is untouched; the restored copy is published as a new catalog, nothing is swapped |

Common to all three: the restored catalog carries **no mutation history**, so it cannot itself be
taken back further — the server excludes the write-ahead log on purpose, because a restore that
included it would replay forward to the state being escaped. The name is validated with the
server's classifier rules only; existence is deliberately not checked, since an existing target is
a legitimate choice. A target equal to the source is sent *unset*, so the server applies its own
default (see `CatalogViewerService.test.ts`).

The dialog hands the accepted task back (`restore` event), and `CatalogVersionsTable` **follows it**:
`CatalogViewerService.followTask` polls `getTaskStatus` every 2 s and yields each status until the
task is finished or failed, and the row's button is replaced by the task's own progress figure for
that long. The outcome is toasted from the table — success, the server's failure reason, or "lost
track" when the server no longer knows the task — and a finished restore emits `restored`, on which
the table reloads its versions and `HistoryPage` re-reads its coordinates. Following is tied to the
table: unmounting it aborts the poll (an `AbortController` handed to `followTask`), while the task
itself keeps running and stays visible in `task-viewer` and in `backup-viewer`'s task list under the
type `RestoreCatalogToVersionTask` (`backup-viewer/model/RestoreToVersionTask.ts`). Nothing is
reloaded on acceptance — nothing has changed yet — and the eventual swap reaches every *other* open
view through the system CDC stream, the same way a catalog replacement from the explorer does.
`followTask` is pinned by `CatalogViewerService.test.ts` (terminal status included, failed task ends
it, lost task throws, abort stops it without a further read).

## Related

- [database driver](../database-driver.md#catalog-statistics-snapshots) — the snapshot API, the
  internal model and the conversion rules
- [`backup-viewer`](backup-viewer.md) and [`task-viewer`](task-viewer.md) — where the restore task
  shows up
- [`connection-explorer`](connection-explorer.md) — the catalog tree row and menu that open this tab
- [design language](../design-language.md) — the conventions every page here follows

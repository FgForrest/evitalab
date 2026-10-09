<script setup lang="ts">
/**
 * Identity and counters of the catalog — cheap, in-memory, and the only page besides Activity that is polled.
 *
 * Renders even for a corrupted catalog: name and read-only flag are known without loading anything, and everything
 * the engine could not compute is shown as unavailable with the server's own reason rather than as zero.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { List as ImmutableList } from 'immutable'
import VPropertiesTable from '@/modules/base/component/VPropertiesTable.vue'
import VLoadingCircular from '@/modules/base/component/VLoadingCircular.vue'
import { Property } from '@/modules/base/model/properties-table/Property'
import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import {
    CatalogStatisticsComponent
} from '@/modules/database-driver/request-response/statistics/CatalogStatisticsComponent'
import { catalogViewerComponents } from '@/modules/catalog-viewer/service/CatalogViewerService'
import { CatalogViewerPage } from '@/modules/catalog-viewer/model/CatalogViewerPage'
import { useCatalogSnapshot } from '@/modules/catalog-viewer/composable/useCatalogSnapshot'
import CatalogHeader from '@/modules/catalog-viewer/component/overview/CatalogHeader.vue'
import CollectionsTable from '@/modules/catalog-viewer/component/overview/CollectionsTable.vue'
import ComponentAvailabilityChips from '@/modules/catalog-viewer/component/ComponentAvailabilityChips.vue'
import { formatNumber, notApplicable } from '@/modules/catalog-viewer/service/statisticsFormatting'

const { t } = useI18n()

const props = defineProps<{
    catalogName: string
    catalog: CatalogStatistics | undefined
    active: boolean
    reloadToken: number
}>()
const emit = defineEmits<{
    /**
     * Asks the tab to display another page, optionally already narrowed down to one entity collection.
     */
    (e: 'openPage', page: CatalogViewerPage, entityType?: string): void
}>()

const { snapshot, loading } = useCatalogSnapshot(
    () => props.catalogName,
    catalogViewerComponents.overview,
    () => props.active,
    () => props.reloadToken,
    { pollIntervalMillis: 5000, notificationKey: 'catalogViewer.overview.notification.couldNotLoad' }
)

/**
 * Lifecycle state and catalog version are deliberately absent: both are chips in the header above, and repeating them
 * one row below would only invite the reader to check whether the two agree.
 */
const identityProperties = computed<Property[]>(() => {
    const identity = snapshot.value?.identity
    if (identity == undefined) {
        return []
    }
    return [
        new Property(
            t('catalogViewer.overview.identity.catalogName'),
            new PropertyValue(identity.catalogName),
            t('catalogViewer.overview.help.catalogName')
        ),
        new Property(
            t('catalogViewer.overview.identity.catalogId'),
            new PropertyValue(identity.catalogId?.toString() ?? notApplicable()),
            t('catalogViewer.overview.help.catalogId')
        ),
        new Property(
            t('catalogViewer.overview.identity.transactional'),
            new PropertyValue(
                identity.transactional,
                identity.transactional ? undefined : t('catalogViewer.overview.note.nonTransactional')
            ),
            t('catalogViewer.overview.help.transactional')
        ),
        new Property(
            t('catalogViewer.overview.identity.readOnly'),
            new PropertyValue(identity.readOnly),
            t('catalogViewer.overview.help.readOnly')
        ),
        new Property(
            t('catalogViewer.overview.identity.entityCollections'),
            new PropertyValue(formatNumber(identity.knownEntityCollectionCount)),
            t('catalogViewer.overview.help.entityCollections')
        )
    ]
})

const counterProperties = computed<Property[]>(() => {
    const properties: Property[] = []
    const counts = snapshot.value?.recordCounts
    properties.push(
        new Property(
            t('catalogViewer.overview.counters.totalRecords'),
            new PropertyValue(formatNumber(counts?.totalRecords)),
            t('catalogViewer.overview.help.totalRecords')
        ),
        new Property(
            t('catalogViewer.overview.counters.liveRecords'),
            new PropertyValue(formatNumber(counts?.liveRecords)),
            t('catalogViewer.overview.help.liveRecords')
        ),
        new Property(
            t('catalogViewer.overview.counters.archivedRecords'),
            new PropertyValue(formatNumber(counts?.archivedRecords)),
            t('catalogViewer.overview.help.archivedRecords')
        ),
        new Property(
            t('catalogViewer.overview.counters.indexes'),
            new PropertyValue(formatNumber(snapshot.value?.indexSummary?.totalIndexCount)),
            t('catalogViewer.overview.help.indexes')
        )
    )

    const sessions = snapshot.value?.sessions
    properties.push(
        new Property(
            t('catalogViewer.overview.counters.openSessions'),
            new PropertyValue(
                sessions == undefined
                    ? notApplicable()
                    : t('catalogViewer.overview.counters.openSessionsValue', {
                        total: formatNumber(sessions.activeSessions),
                        readOnly: formatNumber(sessions.activeReadOnlySessions),
                        readWrite: formatNumber(sessions.activeReadWriteSessions)
                    })
            ),
            t('catalogViewer.overview.help.openSessions')
        )
    )
    return properties
})

const collections = computed(() => snapshot.value?.collections ?? undefined)

const shownComponents: readonly CatalogStatisticsComponent[] = ImmutableList(catalogViewerComponents.overview)
    .filter(it => it !== CatalogStatisticsComponent.Identity)
    .toArray()
</script>

<template>
    <div class="overview-page">
        <CatalogHeader :catalog="catalog" :identity="snapshot?.identity" />

        <VLoadingCircular v-if="loading && snapshot == undefined" />

        <template v-else-if="snapshot != undefined">
            <ComponentAvailabilityChips
                :components="shownComponents"
                :statuses="(component) => snapshot?.statusOf(component)"
            />

            <div class="overview-page__columns">
                <VPropertiesTable
                    :title="t('catalogViewer.overview.identity.title')"
                    :properties="identityProperties"
                />
                <VPropertiesTable
                    :title="t('catalogViewer.overview.counters.title')"
                    :properties="counterProperties"
                />
            </div>

            <div>
                <h3 class="overview-page__section-title">
                    {{ t('catalogViewer.overview.collections.title') }}
                </h3>
                <CollectionsTable
                    :catalog-name="catalogName"
                    :collections="collections"
                    :reload-token="reloadToken"
                    @open-page="(page, entityType) => emit('openPage', page, entityType)"
                />
            </div>
        </template>
    </div>
</template>

<style lang="scss" scoped>
.overview-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;

    &__columns {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(24rem, 1fr));
        gap: 1.5rem;
        align-items: start;
    }

    &__section-title {
        font-size: 1rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
    }
}
</style>

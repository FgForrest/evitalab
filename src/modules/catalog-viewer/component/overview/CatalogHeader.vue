<script setup lang="ts">
/**
 * Identity row of the catalog preview: name, lifecycle state, write mode and current version.
 *
 * Carries no actions. The catalog's own actions live in the connection explorer's catalog menu, which is one click
 * away and is the single place a user learns them.
 *
 * The chips and the version beside them are the only place state and version are stated - the identity table below
 * does not repeat them, so each figure has exactly one rendering that can be right or wrong.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import { CatalogState } from '@/modules/database-driver/request-response/CatalogState'
import { formatNumber, notApplicable } from '@/modules/catalog-viewer/service/statisticsFormatting'
import { CatalogIdentity } from '@/modules/database-driver/request-response/statistics/CatalogIdentity'

const { t } = useI18n()

const props = defineProps<{
    catalog: CatalogStatistics | undefined
    /**
     * Identity of the polled snapshot. Carries the live catalog version and the transactional flag, which the
     * cached catalog listing does not.
     */
    identity: CatalogIdentity | undefined
}>()

const stateColor = computed<string | undefined>(() => {
    switch (props.catalog?.catalogState) {
        case CatalogState.Alive:
            return 'success'
        case CatalogState.WarmingUp:
            return 'warning'
        case CatalogState.Corrupted:
        case CatalogState.Missing:
            return 'error'
        default:
            return undefined
    }
})

const version = computed<string>(() => {
    const knownVersion: bigint | undefined = props.identity?.knownCatalogVersion
    return knownVersion == undefined ? notApplicable() : formatNumber(knownVersion)
})
</script>

<template>
    <div v-if="catalog != undefined" class="catalog-header">
        <h2 class="catalog-header__name">{{ catalog.name }}</h2>

        <VChip v-if="catalog.catalogState" :color="stateColor" variant="flat" size="small">
            {{ t(`common.catalogState.${catalog.catalogState}`) }}
            <VTooltip activator="parent">
                <span>{{ t('catalogViewer.overview.help.state') }}</span>
            </VTooltip>
        </VChip>

        <!-- rendered only once the snapshot identity has answered: an unknown flag asserted as
             "non-transactional" would be a wrong claim for the seconds the first read takes -->
        <VChip v-if="identity != undefined" size="small">
            {{
                identity.transactional
                    ? t('catalogViewer.overview.flag.transactional')
                    : t('catalogViewer.overview.flag.nonTransactional')
            }}
            <VTooltip activator="parent">
                <span>{{ t('catalogViewer.overview.help.transactional') }}</span>
            </VTooltip>
        </VChip>

        <VChip v-if="catalog.readOnly" size="small" prepend-icon="mdi-lock-outline">
            {{ t('catalogViewer.overview.flag.readOnly') }}
        </VChip>

        <!-- a version is a measurement, not a keyword, so it is a plain value next to the chips rather than a chip -->
        <span class="catalog-header__version text-medium-emphasis">
            {{ t('catalogViewer.overview.flag.version', { version }) }}
            <VTooltip activator="parent">
                <span>{{ t('catalogViewer.overview.help.catalogVersion') }}</span>
            </VTooltip>
        </span>
    </div>
</template>

<style lang="scss" scoped>
.catalog-header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;

    &__name {
        font-size: 1.25rem;
        font-weight: 500;
        margin-right: 0.25rem;
    }

    &__version {
        font-size: 0.875rem;
        font-variant-numeric: tabular-nums;
    }
}
</style>

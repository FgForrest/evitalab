<script setup lang="ts">
/**
 * Reports the statistics components the server declined to compute, and why.
 *
 * Only the declined ones: that a section was delivered is already said by the section itself carrying numbers, while
 * a declined one is the difference between "this catalog has no activity" and "this catalog is warming up, so the
 * transactional counters do not apply". With nothing declined the component renders nothing at all.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { List as ImmutableList } from 'immutable'
import {
    CatalogStatisticsComponent
} from '@/modules/database-driver/request-response/statistics/CatalogStatisticsComponent'
import { ComponentStatus } from '@/modules/database-driver/request-response/statistics/ComponentStatus'

const { t } = useI18n()

const props = defineProps<{
    /**
     * Components whose availability is worth showing. Components absent from the snapshot's status map were never
     * requested and are skipped.
     */
    components: readonly CatalogStatisticsComponent[]
    statuses: (component: CatalogStatisticsComponent) => ComponentStatus | undefined
}>()

const shownStatuses = computed<ImmutableList<ComponentStatus>>(() =>
    ImmutableList(
        props.components
            .map(it => props.statuses(it))
            .filter((it): it is ComponentStatus => it != undefined && !it.delivered)
    )
)

function chipLabel(status: ComponentStatus): string {
    return t('catalogViewer.component.label', {
        component: t(`catalogViewer.component.name.${status.component}`),
        availability: t(`catalogViewer.component.availability.${status.availability}`)
    })
}

function chipTooltip(status: ComponentStatus): string {
    // the server's own explanation is the only accurate one; the enum only classifies it
    return status.reason ?? t(`catalogViewer.component.reason.${status.availability}`)
}
</script>

<template>
    <div v-if="!shownStatuses.isEmpty()" class="availability-chips">
        <VChip
            v-for="status in shownStatuses"
            :key="status.component"
            size="small"
            color="warning"
            base-color="warning"
            prepend-icon="mdi-alert-outline"
        >
            {{ chipLabel(status) }}
            <VTooltip activator="parent">
                <span>{{ chipTooltip(status) }}</span>
            </VTooltip>
        </VChip>
    </div>
</template>

<style lang="scss" scoped>
.availability-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}
</style>

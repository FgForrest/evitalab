<script setup lang="ts">
/**
 * Stands in for a statistics component the server could not deliver.
 *
 * Never renders `0` or `-1` in place of a value the engine does not have: an unavailable component and an empty one
 * are different findings, and only the second says anything about the catalog's data.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'
import { ComponentAvailability } from '@/modules/database-driver/request-response/statistics/ComponentAvailability'
import { ComponentStatus } from '@/modules/database-driver/request-response/statistics/ComponentStatus'

const { t } = useI18n()

const props = defineProps<{
    /**
     * The component's status, or `undefined` when it was never requested — which is a bug in the page, and is
     * reported as such rather than silently rendering nothing.
     */
    status: ComponentStatus | undefined
}>()

const icon = computed<string>(() => {
    switch (props.status?.availability) {
        case ComponentAvailability.CatalogUnusable:
            return 'mdi-database-alert-outline'
        case ComponentAvailability.FeatureDisabled:
            return 'mdi-toggle-switch-off-outline'
        default:
            return 'mdi-help-circle-outline'
    }
})

const title = computed<string>(() => {
    if (props.status == undefined) {
        return t('catalogViewer.component.notRequested')
    }
    return props.status.reason ?? t(`catalogViewer.component.reason.${props.status.availability}`)
})
</script>

<template>
    <VMissingDataIndicator :icon="icon" :title="title" />
</template>

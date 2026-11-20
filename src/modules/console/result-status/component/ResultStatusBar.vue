<script setup lang="ts">
/**
 * Status bar at the top of a console's result pane: status chip, duration, optional size and optional request.
 * Shared by the evitaQL, GraphQL and REST consoles.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ConsoleResultStatus } from '@/modules/console/result-status/model/ConsoleResultStatus'
import {
    type FormattedResultSize,
    formatResultDuration,
    formatResultSize
} from '@/modules/console/result-status/service/resultStatusFormatting'

const { t } = useI18n()

const props = defineProps<{
    status: ConsoleResultStatus
}>()

const durationLabel = computed<string>(() => t('resultStatus.duration', {
    duration: formatResultDuration(props.status.durationMs)
}))

const sizeLabel = computed<string | undefined>(() => {
    if (props.status.sizeBytes == undefined) {
        return undefined
    }
    const size: FormattedResultSize = formatResultSize(props.status.sizeBytes)
    return t(`resultStatus.size.${size.unit}`, { size: size.value })
})
</script>

<template>
    <div class="result-status-bar">
        <VChip
            :color="status.successful ? 'success' : 'error'"
            variant="tonal"
            size="small"
            label
            class="result-status-bar__metric"
        >
            {{ status.label }}
        </VChip>
        <span class="text-caption result-status-bar__metric">{{ durationLabel }}</span>
        <span v-if="sizeLabel != undefined" class="text-caption result-status-bar__metric">{{ sizeLabel }}</span>
        <span v-if="status.request != undefined" class="text-caption text-disabled result-status-bar__request">
            {{ status.request }}
        </span>
    </div>
</template>

<style lang="scss" scoped>
.result-status-bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0 1rem;
    height: 2.5rem;
    min-width: 0;
    flex-shrink: 0;
    border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));

    &__metric {
        flex-shrink: 0;
        white-space: nowrap;
    }

    &__request {
        font-family: monospace;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}
</style>

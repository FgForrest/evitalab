<script setup lang="ts">
/**
 * Status-bar indicator for the system change-data-capture stream maintained by the
 * {@link DataCacheRefresher}. Shows a check icon with the date of the last observed change while the
 * stream is live, and an alert icon while the stream is broken (and reconnecting). It only reads the
 * refresher's reactive state — no server calls, no error handling needed.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataCacheRefresher } from '@/modules/database-driver/DataCacheRefresher'
import { ChangeStreamStatus } from '@/modules/database-driver/model/ChangeStreamStatus'

const { t } = useI18n()
const dataCacheRefresher = useDataCacheRefresher()

const streamStatus = dataCacheRefresher.streamStatus
const lastChangeAt = dataCacheRefresher.lastChangeAt

const broken = computed<boolean>(() => streamStatus.value === ChangeStreamStatus.Broken)

const tooltip = computed<string>(() => {
    if (broken.value) {
        return t('common.statusBar.changeStream.broken')
    }
    if (lastChangeAt.value == undefined) {
        return t('common.statusBar.changeStream.upToDateNoChanges')
    }
    return t('common.statusBar.changeStream.upToDate', {
        lastChange: lastChangeAt.value.getPrettyPrintableString()
    })
})
</script>

<template>
    <div class="change-stream-indicator">
        <VIcon
            :icon="broken ? 'mdi-sync-alert' : 'mdi-check-circle-outline'"
            :color="broken ? 'warning' : undefined"
            size="small"
        />
        <VTooltip activator="parent">{{ tooltip }}</VTooltip>
    </div>
</template>

<style scoped lang="scss">
.change-stream-indicator {
    display: flex;
    align-items: center;
}
</style>

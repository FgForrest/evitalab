<script setup lang="ts">
/**
 * Status-bar indicator telling the user that part of what they see was restored from evitaLab's on-disk cache
 * and **could not be verified** against the server, so it may be outdated. Hidden entirely while everything is
 * verified — the absence of the icon is the "all good" state, which keeps the bar quiet on a healthy startup.
 *
 * It complements {@link ChangeStreamIndicator}, and the two answer different questions: that one reports
 * whether the *live update channel* works, this one whether *what you are looking at* is confirmed. They may
 * legitimately disagree — an unreachable server with nothing cached shows a broken stream and verified data.
 *
 * Reads the driver's reactive freshness signal only — no server calls, no error handling needed.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { EvitaClient, useEvitaClient } from '@/modules/database-driver/EvitaClient'
import { DataFreshness } from '@/modules/database-driver/model/DataFreshness'

const { t } = useI18n()
const evitaClient: EvitaClient = useEvitaClient()

const dataFreshness = evitaClient.dataFreshness
const unverifiedRecordCount = evitaClient.unverifiedCachedRecordCount

const servingUnverifiedData = computed<boolean>(() => dataFreshness.value === DataFreshness.Cached)
</script>

<template>
    <div v-if="servingUnverifiedData" class="cached-data-indicator">
        <VIcon
            icon="mdi-database-clock-outline"
            color="warning"
            size="small"
        />
        <VTooltip activator="parent">
            {{ t('common.statusBar.dataFreshness.cached', { count: unverifiedRecordCount }) }}
        </VTooltip>
    </div>
</template>

<style scoped lang="scss">
.cached-data-indicator {
    display: flex;
    align-items: center;
}
</style>

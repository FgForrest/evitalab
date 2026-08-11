<script setup lang="ts">
/**
 * Status-bar indicator telling the user that evitaLab cannot store server data on disk, so it will start cold
 * after every reload. Hidden while persistence works — the absence of the icon is the "all good" state, which
 * keeps the bar quiet in the overwhelmingly common case.
 *
 * The browser is what refuses storage (a hardened profile, blocked site data, an opaque origin, a full disk that
 * cost us the connection), so there is nothing for the user to retry here. It is reported only because a lab that
 * silently never remembers anything is otherwise indistinguishable from a slow one.
 *
 * Distinct from {@link CachedDataIndicator}: that one reports that cached data *is* being shown but could not be
 * verified, this one that nothing can be cached at all. Both can be lit at once — storage that dies mid-session
 * leaves whatever it already restored in memory, still unverified.
 *
 * Reads the driver's reactive signal only — no server calls, no error handling needed.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { EvitaClient, useEvitaClient } from '@/modules/database-driver/EvitaClient'

const { t } = useI18n()
const evitaClient: EvitaClient = useEvitaClient()

const persistentCacheAvailable = evitaClient.persistentCacheAvailable

const persistenceUnavailable = computed<boolean>(() => !persistentCacheAvailable.value)
</script>

<template>
    <div v-if="persistenceUnavailable" class="persistent-cache-indicator">
        <VIcon
            icon="mdi-database-off-outline"
            color="warning"
            size="small"
        />
        <VTooltip activator="parent">
            {{ t('common.statusBar.persistentCache.unavailable') }}
        </VTooltip>
    </div>
</template>

<style scoped lang="scss">
.persistent-cache-indicator {
    display: flex;
    align-items: center;
}
</style>

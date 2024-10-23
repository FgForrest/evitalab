<script setup lang="ts">

import { ServerStatus } from '@/modules/connection/model/status/ServerStatus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
    serverStatus: ServerStatus
}>()
</script>

<template>
    <VCard variant="text">
        <VCardText>
            <p class="status-title text-h4 font-weight-black">{{ serverStatus.instanceId }}</p>

            <VChipGroup>
                <VChip>
                    {{ t('serverViewer.serverTitle.flags.version', { version: serverStatus.version }) }}
                </VChip>
                <VChip v-if="serverStatus.readOnly">
                    {{ t('serverViewer.serverTitle.flags.readOnly') }}
                </VChip>
            </VChipGroup>
        </VCardText>
    </VCard>
</template>

<style lang="scss" scoped>

</style>

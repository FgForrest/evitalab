<script setup lang="ts">

import { ref } from 'vue'
import { ApiType } from '@/modules/connection/model/status/ApiType'
import { ApiStatus } from '@/modules/connection/model/status/ApiStatus'
import ApiDetailDialog from '@/modules/server-viewer/component/server-status/ApiDetailDialog.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
    apiType: ApiType,
    apiStatus: ApiStatus
}>()

const showApiDetailDialog = ref<boolean>(false)
</script>

<template>
    <ApiDetailDialog
        v-model="showApiDetailDialog"
        :api-type="apiType"
        :api-status="apiStatus"
    >
        <template #activator="{ props }">
            <VBtn
                icon
                variant="text"
                density="compact"
                v-bind="props"
                @click="showApiDetailDialog = true"
            >
                <VIcon>mdi-dots-horizontal</VIcon>

                <VTooltip activator="parent">
                    {{ t('serverViewer.serverStatus.button.openApiDetail') }}
                </VTooltip>
            </VBtn>
        </template>
    </ApiDetailDialog>
</template>

<style lang="scss" scoped>

</style>

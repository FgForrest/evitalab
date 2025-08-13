<script setup lang="ts">

import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import { useI18n } from 'vue-i18n'
import type { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics.ts'
import { type Toaster, useToaster } from '@/modules/notification/service/Toaster.ts'
import { CatalogItemService, useCatalogItemService } from '@/modules/connection-explorer/service/CatalogItemService.ts'

const props = defineProps<{
    modelValue: boolean
    catalog: CatalogStatistics
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const { t } = useI18n()
const toaster: Toaster = useToaster()
const catalogItemService: CatalogItemService = useCatalogItemService()
const changed = computed<boolean>(() => props.catalog != undefined)

async function activateCatalog(): Promise<boolean> {
    try {
        catalogItemService.activateCatalogWithProgress(props.catalog)
        await toaster.info(t('explorer.catalog.activateCatalog.notification.catalogActivationStarted', {
            catalogName: props.catalog.name
        }))
        return true
    } catch (e: any) {
        await toaster.error(t('explorer.catalog.activateCatalog.notification.couldNotActivateCatalog', {
            catalogName: props.catalog.name,
            reason: e.message
        }))
        return false
    }
}
</script>

<template>
    <VFormDialog
        :model-value="modelValue"
        :confirm="activateCatalog"
        :changed="changed"
        confirm-button-icon="mdi-check-circle-outline"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #title>
            <I18nT keypath="explorer.catalog.activateCatalog.title">
                <template #catalogName>
                    <strong>{{ catalog.name }}</strong>
                </template>
            </I18nT>
        </template>

        <template #prepend-form>
            {{ t('explorer.catalog.activateCatalog.description') }}
        </template>

        <template #confirm-button-body>
            {{ t('common.button.activateCatalog') }}
        </template>
    </VFormDialog>
</template>

<style scoped lang="scss">

</style>

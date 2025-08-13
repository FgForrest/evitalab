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
const catalogItemService: CatalogItemService = useCatalogItemService()
const toaster: Toaster = useToaster()
const changed = computed<boolean>(() => props.catalog != undefined)

async function deactivateCatalog(): Promise<boolean> {
    try {
        catalogItemService.deactivateCatalogWithProgress(props.catalog)
        await toaster.info(t('explorer.catalog.deactivateCatalog.notification.catalogDeactivationStarted'))
        return true
    } catch (e: any) {
        await toaster.error(t('explorer.catalog.deactivateCatalog.notification.couldNotDeactivateCatalog', {
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
        :confirm="deactivateCatalog"
        :changed="changed"
        confirm-button-icon="mdi-close-circle-outline"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #title>
            <I18nT keypath="explorer.catalog.deactivateCatalog.title">
                <template #catalogName>
                    <strong>{{ catalog.name }}</strong>
                </template>
            </I18nT>
        </template>

        <template #prepend-form>
            {{ t('explorer.catalog.deactivateCatalog.description') }}
        </template>

        <template #confirm-button-body>
            {{ t('common.button.deactivateCatalog') }}
        </template>
    </VFormDialog>
</template>

<style scoped lang="scss">

</style>

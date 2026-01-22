<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CatalogItemService, useCatalogItemService } from '@/modules/connection-explorer/service/CatalogItemService'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import type { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics.ts'

const catalogItemService: CatalogItemService = useCatalogItemService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean
    catalog: CatalogStatistics
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void,
}>()

async function switchCatalog(): Promise<boolean> {
    try {
        catalogItemService.switchCatalogAliveWithProgress(props.catalog)
        await toaster.info(t('explorer.catalog.switchToAliveState.notification.catalogSwitchStarted', {
            catalogName: props.catalog.name,
        }))
        return true
    } catch (e: unknown) {
        await toaster.error(t(
            'explorer.catalog.switchToAliveState.notification.couldNotSwitchCatalog',
            {
                catalogName: props.catalog.name,
                reason: e instanceof Error ? e.message : String(e)
            }
        ))
        return false
    }
}
</script>

<template>
    <VFormDialog
        :model-value="modelValue"
        dangerous
        changed
        confirm-button-icon="mdi-toggle-switch-outline"
        :confirm="switchCatalog"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #title>
            <I18nT keypath="explorer.catalog.switchToAliveState.title">
                <template #catalogName>
                    <strong>{{ catalog.name }}</strong>
                </template>
            </I18nT>
        </template>

        <template #prepend-form>
            {{ t('explorer.catalog.switchToAliveState.description') }}
        </template>

        <template #append-form>
            <VAlert icon="mdi-alert-outline" type="warning">
                {{ t('explorer.catalog.switchToAliveState.warning') }}
            </VAlert>
        </template>

        <template #confirm-button-body>
            {{ t('common.button.switch') }}
        </template>
    </VFormDialog>
</template>

<style lang="scss" scoped>

</style>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CatalogItemService, useCatalogItemService } from '@/modules/connection-explorer/service/CatalogItemService'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import { getErrorMessage } from '@/utils/errorHandling'

const catalogItemService: CatalogItemService = useCatalogItemService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean
    catalogName: string
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void,
}>()

async function deleteCatalog(): Promise<boolean> {
    try {
        const deleted: boolean = await catalogItemService.deleteCatalog(props.catalogName)
        if (deleted) {
            await toaster.success(t(
                'explorer.catalog.delete.notification.catalogDeleted',
                { catalogName: props.catalogName }
            ))
        } else {
            await toaster.info(t(
                'explorer.catalog.delete.notification.catalogNotDeleted',
                { catalogName: props.catalogName }
            ))
        }
        return true
    } catch (e: unknown) {
        await toaster.error(t(
            'explorer.catalog.delete.notification.couldNotDeleteCatalog',
            {
                catalogName: props.catalogName,
                reason: getErrorMessage(e)
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
        confirm-button-icon="mdi-delete-outline"
        :confirm="deleteCatalog"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #title>
            <I18nT keypath="explorer.catalog.delete.title">
                <template #catalogName>
                    <strong>{{ catalogName }}</strong>
                </template>
            </I18nT>
        </template>

        <template #prepend-form>
            {{ t('explorer.catalog.delete.question') }}
        </template>

        <template #confirm-button-body>
            {{ t('common.button.delete') }}
        </template>
    </VFormDialog>
</template>

<style lang="scss" scoped>

</style>

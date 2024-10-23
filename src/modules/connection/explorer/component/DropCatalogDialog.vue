<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Connection } from '@/modules/connection/model/Connection'
import { CatalogItemService, useCatalogItemService } from '@/modules/connection/explorer/service/CatalogItemService'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import VFormDialog from '@/modules/base/component/VFormDialog.vue'

const catalogItemService: CatalogItemService = useCatalogItemService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean
    connection: Connection
    catalogName: string
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void,
    (e: 'drop'): void
}>()

async function drop(): Promise<boolean> {
    try {
        const dropped: boolean = await catalogItemService.dropCatalog(props.connection, props.catalogName)
        if (dropped) {
            toaster.success(t(
                'explorer.catalog.drop.notification.catalogDropped',
                { catalogName: props.catalogName }
            ))
            emit('drop')
        } else {
            toaster.info(t(
                'explorer.catalog.drop.notification.catalogNotDropped',
                { catalogName: props.catalogName }
            ))
        }
        return true
    } catch (e: any) {
        toaster.error(t(
            'explorer.catalog.drop.notification.couldNotDropCatalog',
            {
                catalogName: props.catalogName,
                reason: e.message
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
        :confirm="drop"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #title>
            <I18nT keypath="explorer.catalog.drop.title">
                <template #catalogName>
                    <strong>{{ catalogName }}</strong>
                </template>
            </I18nT>
        </template>

        <template #prepend-form>
            {{ t('explorer.catalog.drop.question') }}
        </template>

        <template #confirm-button-body>
            {{ t('common.button.drop') }}
        </template>
    </VFormDialog>
</template>

<style lang="scss" scoped>

</style>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CatalogItemService, useCatalogItemService } from '@/modules/connection-explorer/service/CatalogItemService'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import VFormDialog from '@/modules/base/component/VFormDialog.vue'

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

async function switchCatalog(): Promise<boolean> {
    try {
        const switched: boolean = await catalogItemService.switchCatalogToAliveState(props.catalogName)
        if (switched) {
            await toaster.success(t(
                'explorer.catalog.switchToAliveState.notification.catalogSwitched',
                { catalogName: props.catalogName }
            ))
        } else {
            await toaster.info(t(
                'explorer.catalog.switchToAliveState.notification.catalogNotSwitched',
                { catalogName: props.catalogName }
            ))
        }
        return true
    } catch (e: any) {
        await toaster.error(t(
            'explorer.catalog.switchToAliveState.notification.couldNotSwitchCatalog',
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
        confirm-button-icon="mdi-toggle-switch-outline"
        :confirm="switchCatalog"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #title>
            <I18nT keypath="explorer.catalog.switchToAliveState.title">
                <template #catalogName>
                    <strong>{{ catalogName }}</strong>
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

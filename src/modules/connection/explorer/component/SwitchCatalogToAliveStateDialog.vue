<script setup lang="ts">
import VCardTitleWithActions from '@/modules/base/component/VCardTitleWithActions.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Connection } from '@/modules/connection/model/Connection'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
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
    (e: 'switch'): void
}>()

async function switchCatalog(): Promise<boolean> {
    try {
        const switched: boolean = await catalogItemService.switchCatalogToAliveState(props.connection, props.catalogName)
        if (switched) {
            toaster.success(t(
                'explorer.catalog.switchToAliveState.notification.catalogSwitched',
                { catalogName: props.catalogName }
            ))
            emit('switch')
        } else {
            toaster.info(t(
                'explorer.catalog.switchToAliveState.notification.catalogNotSwitched',
                { catalogName: props.catalogName }
            ))
        }
        return true
    } catch (e: any) {
        toaster.error(t(
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

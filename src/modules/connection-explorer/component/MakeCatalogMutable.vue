<script setup lang="ts">

import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import { useI18n } from 'vue-i18n'
import type { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics.ts'
import {
    type CatalogItemService,
    useCatalogItemService
} from '@/modules/connection-explorer/service/CatalogItemService.ts'
import type { Toaster } from '@/modules/notification/service/Toaster.ts'
import { useToaster } from '@/modules/notification/service/Toaster.ts'

const props = defineProps<{
   modelValue: boolean
    catalog: CatalogStatistics
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void,
}>()

const { t } = useI18n()
const catalogItemService: CatalogItemService = useCatalogItemService()
const toaster: Toaster = useToaster()

const changed = computed<boolean>(() => props.catalog != undefined)

async function makeCatalogMutable(): Promise<boolean> {
    try {
        await toaster.info(t('explorer.catalog.makeCatalogMutable.notification.catalogMutableSwitchStarted', {
            catalogName: props.catalog.name
        }))
        catalogItemService.makeCatalogMutableWithProgress(props.catalog)
        return true
    } catch (e: any) {
        await toaster.error(t('explorer.catalog.makeCatalogMutable.notification.couldNotMakeCatalogMutable', {
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
        :confirm="makeCatalogMutable"
        :changed="changed"
        confirm-button-icon="mdi-lock-open-variant-outline"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #title>
            <I18nT keypath="explorer.catalog.makeCatalogMutable.title">
                <template #catalogName>
                    <strong>{{ catalog.name }}</strong>
                </template>
            </I18nT>
        </template>

        <template #prepend-form>
            {{ t('explorer.catalog.makeCatalogMutable.description') }}
        </template>

        <template #confirm-button-body>
            {{ t('common.button.switch') }}
        </template>
    </VFormDialog>
</template>

<style scoped lang="scss">

</style>

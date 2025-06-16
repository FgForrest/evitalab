<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import {
    CollectionItemService,
    useCollectionItemService
} from '@/modules/connection-explorer/service/CollectionItemService'
import VFormDialog from '@/modules/base/component/VFormDialog.vue'

const collectionItemService: CollectionItemService = useCollectionItemService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean
    catalogName: string
    entityType: string
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

async function deleteCollection(): Promise<boolean> {
    try {
        const deleted: boolean = await collectionItemService.deleteCollection(props.catalogName, props.entityType)
        if (deleted) {
            await toaster.success(t(
                'explorer.collection.delete.notification.collectionDeleted',
                { entityType: props.entityType }
            ))
        } else {
            await toaster.info(t(
                'explorer.collection.delete.notification.collectionNotDeleted',
                { entityType: props.entityType }
            ))
        }
        return true
    } catch (e: any) {
        await toaster.error(t(
            'explorer.collection.delete.notification.couldNotDeleteCollection',
            {
                entityType: props.entityType,
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
        :confirm="deleteCollection"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #title>
            <I18nT keypath="explorer.collection.delete.title">
                <template #entityType>
                    <strong>{{ entityType }}</strong>
                </template>
            </I18nT>
        </template>

        <template #prepend-form>
            {{ t('explorer.collection.delete.question') }}
        </template>

        <template #confirm-button-body>
            {{ t('common.button.delete') }}
        </template>
    </VFormDialog>
</template>

<style lang="scss" scoped>

</style>

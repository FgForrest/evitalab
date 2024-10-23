<script setup lang="ts">
import { Connection } from '@/modules/connection/model/Connection';
import { useI18n } from 'vue-i18n'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import {
    CollectionItemService,
    useCollectionItemService
} from '@/modules/connection/explorer/service/CollectionItemService'
import VFormDialog from '@/modules/base/component/VFormDialog.vue'

const collectionItemService: CollectionItemService = useCollectionItemService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean
    connection: Connection
    catalogName: string
    entityType: string
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'drop'): void
}>()

async function drop(): Promise<boolean> {
    try {
        const deleted: boolean = await collectionItemService.dropCollection(props.connection, props.catalogName, props.entityType)
        if (deleted) {
            toaster.success(t(
                'explorer.collection.drop.notification.collectionDropped',
                { entityType: props.entityType }
            ))
            emit('drop')
        } else {
            toaster.info(t(
                'explorer.collection.drop.notification.collectionNotDropped',
                { entityType: props.entityType }
            ))
        }
        return true
    } catch (e: any) {
        toaster.error(t(
            'explorer.collection.drop.notification.couldNotDropCollection',
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
        :confirm="drop"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #title>
            <I18nT keypath="explorer.collection.drop.title">
                <template #entityType>
                    <strong>{{ entityType }}</strong>
                </template>
            </I18nT>
        </template>

        <template #prepend-form>
            {{ t('explorer.collection.drop.question') }}
        </template>

        <template #confirm-button-body>
            {{ t('common.button.drop') }}
        </template>
    </VFormDialog>
</template>

<style lang="scss" scoped>

</style>

<script setup lang="ts">
import { Connection } from '@/modules/connection/model/Connection'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
    CollectionItemService,
    useCollectionItemService
} from '@/modules/connection/explorer/service/CollectionItemService'
import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import { ClassifierValidationErrorType } from '@/modules/connection/model/data-type/ClassifierValidationErrorType'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'

const collectionItemService: CollectionItemService = useCollectionItemService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean
    connection: Connection
    catalogName: string
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'create'): void
}>()

const entityTypeRules = [
    (value: string): any => {
        if (value != undefined && value.trim().length > 0) return true
        return t('explorer.collection.create.form.entityType.validations.required')
    },
    async (value: string): Promise<any> => {
        const classifierValidationResult : ClassifierValidationErrorType | undefined =
            await collectionItemService.isEntityTypeValid(props.connection, value)
        if (classifierValidationResult == undefined) return true
        return t(`explorer.collection.create.form.entityType.validations.${classifierValidationResult}`)
    },
    async (value: string): Promise<any> => {
        const available: boolean = await collectionItemService.isEntityTypeAvailable(props.connection, props.catalogName, value)
        if (available) return true
        return t('explorer.collection.create.form.entityType.validations.notAvailable')
    }
]

const entityType = ref<string>('')
const changed = computed<boolean>(() => entityType.value.length > 0)

function reset(): void {
    entityType.value = ''
}

async function create(): Promise<boolean> {
    try {
        await collectionItemService.createCollection(
            props.connection,
            props.catalogName,
            entityType.value
        )
        toaster.success(t(
            'explorer.collection.create.notification.collectionCreated',
            { entityType: entityType.value }
        ))
        emit('create')
        return true
    } catch (e: any) {
        toaster.error(t(
            'explorer.collection.create.notification.couldNotCreateCollection',
            {
                entityType: entityType.value,
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
        :changed="changed"
        confirm-button-icon="mdi-plus"
        :confirm="create"
        :reset="reset"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #title>
            <I18nT keypath="explorer.collection.create.title">
                <template #catalogName>
                    <strong>{{ catalogName }}</strong>
                </template>
            </I18nT>
        </template>

        <template #default>
            <VTextField
                v-model="entityType"
                :label="t('explorer.collection.create.form.entityType.label')"
                :rules="entityTypeRules"
                required
            />
        </template>

        <template #confirm-button-body>
            {{ t('common.button.create') }}
        </template>
    </VFormDialog>
</template>

<style lang="scss" scoped>

</style>

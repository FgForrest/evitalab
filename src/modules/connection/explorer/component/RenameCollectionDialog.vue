<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n';
import { Connection } from '@/modules/connection/model/Connection';
import { ClassifierValidationErrorType } from '@/modules/connection/model/data-type/ClassifierValidationErrorType'
import {
    CollectionItemService,
    useCollectionItemService
} from '@/modules/connection/explorer/service/CollectionItemService'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
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
    (e: 'update:modelValue', value: boolean): void,
    (e: 'rename'): void
}>()

const newNameRules = [
    (value: string): any => {
        if (value != undefined && value.trim().length > 0) return true
        return t('explorer.collection.rename.form.newName.validations.required')
    },
    async (value: string): Promise<any> => {
        const classifierValidationResult : ClassifierValidationErrorType | undefined =
            await collectionItemService.isEntityTypeValid(props.connection, value)
        if (classifierValidationResult == undefined) return true
        return t(`explorer.collection.rename.form.newName.validations.${classifierValidationResult}`)
    },
    async (value: string): Promise<any> => {
        if (value === props.entityType) {
            return true
        }
        const available: boolean = await collectionItemService.isEntityTypeAvailable(props.connection, props.catalogName, value)
        if (available) return true
        return t('explorer.collection.rename.form.newName.validations.notAvailable')
    }
]

const newName = ref<string>(props.entityType)
const changed = computed<boolean>(() => newName.value !== props.entityType)

function reset(): void {
    newName.value = props.entityType
}

async function rename(): Promise<boolean> {
    try {
        const renamed: boolean = await collectionItemService.renameCollection(
            props.connection,
            props.catalogName,
            props.entityType,
            newName.value
        )
        if (renamed) {
            await toaster.success(t(
                'explorer.collection.rename.notification.collectionRenamed',
                {
                    entityType: props.entityType,
                    newName: newName.value
                },
            ))
            emit('rename')
        } else {
            await toaster.info(t(
                'explorer.collection.rename.notification.collectionNotRenamed',
                {
                    entityType: props.entityType
                },
            ))
        }
        return true
    } catch (e: any) {
        await toaster.error(t(
            'explorer.collection.rename.notification.couldNotRenameCollection',
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
        :changed="changed"
        dangerous
        confirm-button-icon="mdi-pencil-outline"
        :confirm="rename"
        :reset="reset"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #title>
            <I18nT keypath="explorer.collection.rename.title">
                <template #entityType>
                    <strong>{{ entityType }}</strong>
                </template>
            </I18nT>
        </template>

        <template #default>
            <VTextField
                v-model="newName"
                :label="t('explorer.collection.rename.form.newName.label')"
                :rules="newNameRules"
                required
            />
        </template>

        <template #confirm-button-body>
            {{ t('common.button.rename') }}
        </template>
    </VFormDialog>
</template>

<style lang="scss" scoped>
</style>

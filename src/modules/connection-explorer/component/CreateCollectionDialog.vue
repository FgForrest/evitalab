<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
    CollectionItemService,
    useCollectionItemService
} from '@/modules/connection-explorer/service/CollectionItemService'
import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import { ClassifierValidationErrorType } from '@/modules/database-driver/data-type/ClassifierValidationErrorType'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { getErrorMessage } from '@/utils/errorHandling'

const collectionItemService: CollectionItemService = useCollectionItemService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean
    catalogName: string
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const entityTypeRules = [
    (value: string): string | true => {
        if (value != undefined && value.trim().length > 0) return true
        return t('explorer.collection.create.form.entityType.validations.required')
    },
    async (value: string): Promise<string | true> => {
        const classifierValidationResult : ClassifierValidationErrorType | undefined =
            await collectionItemService.isEntityTypeValid(value)
        if (classifierValidationResult == undefined) return true
        return t(`explorer.collection.create.form.entityType.validations.${classifierValidationResult}`)
    },
    async (value: string): Promise<string | true> => {
        const available: boolean = await collectionItemService.isEntityTypeAvailable(props.catalogName, value)
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
            props.catalogName,
            entityType.value
        )
        await toaster.success(t(
            'explorer.collection.create.notification.collectionCreated',
            { entityType: entityType.value }
        ))
        return true
    } catch (e: unknown) {
        await toaster.error(t(
            'explorer.collection.create.notification.couldNotCreateCollection',
            {
                entityType: entityType.value,
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

<script setup lang="ts">
import { Connection } from '@/modules/connection/model/Connection'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CatalogItemService, useCatalogItemService } from '@/modules/connection/explorer/service/CatalogItemService'
import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { ClassifierValidationErrorType } from '@/modules/connection/model/data-type/ClassifierValidationErrorType'

const catalogItemService: CatalogItemService = useCatalogItemService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean
    connection: Connection
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'create'): void
}>()

const catalogNameRules = [
    (value: string): any => {
        if (value != undefined && value.trim().length > 0) return true
        return t('explorer.catalog.create.form.catalogName.validations.required')
    },
    async (value: string): Promise<any> => {
        const classifierValidationResult : ClassifierValidationErrorType | undefined =
            await catalogItemService.isCatalogNameValid(props.connection, value)
        if (classifierValidationResult == undefined) return true
        return t(`explorer.catalog.create.form.catalogName.validations.${classifierValidationResult}`)
    },
    async (value: string): Promise<any> => {
        const available: boolean = await catalogItemService.isCatalogNameAvailable(props.connection, value)
        if (available) return true
        return t('explorer.catalog.create.form.catalogName.validations.notAvailable')
    }
]

const catalogName = ref<string>('')
const changed = computed<boolean>(() => catalogName.value.length > 0)

function reset(): void {
    catalogName.value = ''
}

async function create(): Promise<boolean> {
    try {
        await catalogItemService.createCatalog(props.connection, catalogName.value)
        toaster.success(t(
            'explorer.catalog.create.notification.catalogCreated',
            { catalogName: catalogName.value }
        ))
        emit('create')
        return true
    } catch (e: any) {
        toaster.error(t(
            'explorer.catalog.create.notification.couldNotCreateCatalog',
            {
                catalogName: catalogName.value,
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
            {{ t('explorer.catalog.create.title') }}
        </template>

        <template #default>
            <VTextField
                v-model="catalogName"
                :label="t('explorer.catalog.create.form.catalogName.label')"
                :rules="catalogNameRules"
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

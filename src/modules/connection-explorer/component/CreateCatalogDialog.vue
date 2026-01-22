<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CatalogItemService, useCatalogItemService } from '@/modules/connection-explorer/service/CatalogItemService'
import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { ClassifierValidationErrorType } from '@/modules/database-driver/data-type/ClassifierValidationErrorType'
import { getErrorMessage } from '@/utils/errorHandling'

const catalogItemService: CatalogItemService = useCatalogItemService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

defineProps<{
    modelValue: boolean
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const catalogNameRules = [
    (value: string): string | true => {
        if (value != undefined && value.trim().length > 0) return true
        return t('explorer.catalog.create.form.catalogName.validations.required')
    },
    async (value: string): Promise<string | true> => {
        const classifierValidationResult : ClassifierValidationErrorType | undefined =
            await catalogItemService.isCatalogNameValid(value)
        if (classifierValidationResult == undefined) return true
        return t(`explorer.catalog.create.form.catalogName.validations.${classifierValidationResult}`)
    },
    async (value: string): Promise<string | true> => {
        const available: boolean = await catalogItemService.isCatalogNameAvailable(value)
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
        await catalogItemService.createCatalog(catalogName.value)
        await toaster.success(t(
            'explorer.catalog.create.notification.catalogCreated',
            { catalogName: catalogName.value }
        ))
        return true
    } catch (e: unknown) {
        await toaster.error(t(
            'explorer.catalog.create.notification.couldNotCreateCatalog',
            {
                catalogName: catalogName.value,
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

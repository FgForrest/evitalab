<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CatalogItemService, useCatalogItemService } from '@/modules/connection-explorer/service/CatalogItemService'
import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import { ClassifierValidationErrorType } from '@/modules/database-driver/data-type/ClassifierValidationErrorType'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import type { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics.ts'

const catalogItemService: CatalogItemService = useCatalogItemService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean
    catalog: CatalogStatistics
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const newNameRules = [
    (value: string): string | boolean => {
        if (value != undefined && value.trim().length > 0) return true
        return t('explorer.catalog.rename.form.newName.validations.required')
    },
    async (value: string): Promise<string | boolean> => {
        const classifierValidationResult: ClassifierValidationErrorType | undefined =
            await catalogItemService.isCatalogNameValid(value)
        if (classifierValidationResult == undefined) return true
        return t(`explorer.catalog.rename.form.newName.validations.${classifierValidationResult}`)
    },
    async (value: string): Promise<string | boolean> => {
        if (value === props.catalog.name) {
            return true
        }
        const available: boolean = await catalogItemService.isCatalogNameAvailable(value)
        if (available) return true
        return t('explorer.catalog.rename.form.newName.validations.notAvailable')
    }
]

const newCatalogName = ref<string>(props.catalog.name)
const changed = computed<boolean>(() => props.catalog.name !== newCatalogName.value)

function reset(): void {
    newCatalogName.value = props.catalog.name
}

async function rename(): Promise<boolean> {
    try {
        catalogItemService.renameCatalogWithProgress(props.catalog, newCatalogName.value)
        await toaster.info(t('explorer.catalog.rename.notification.catalogRenameStarted', {
            catalogName: props.catalog.name
        }))
        return true
    } catch (e: unknown) {
        await toaster.error(t(
            'explorer.catalog.rename.notification.couldNotRenameCatalog',
            {
                catalogName: props.catalog.name,
                reason: e instanceof Error ? e.message : String(e)
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
            <I18nT keypath="explorer.catalog.rename.title">
                <template #catalogName>
                    <strong>{{ catalog.name }}</strong>
                </template>
            </I18nT>
        </template>

        <template #default>
            <VTextField
                v-model="newCatalogName"
                :label="t('explorer.catalog.rename.form.newName.label')"
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

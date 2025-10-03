<script setup lang="ts">

import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import { useI18n } from 'vue-i18n'
import { ClassifierValidationErrorType } from '@/modules/database-driver/data-type/ClassifierValidationErrorType.ts'
import { CatalogItemService, useCatalogItemService } from '@/modules/connection-explorer/service/CatalogItemService.ts'
import { computed } from 'vue'
import { type Toaster, useToaster } from '@/modules/notification/service/Toaster.ts'
import type { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics.ts'

const { t } = useI18n()
const catalogItemService: CatalogItemService = useCatalogItemService()
const toaster: Toaster = useToaster()

const props = defineProps<{
    modelValue: boolean
    catalog: CatalogStatistics
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const duplicationCatalogName = ref<string>()

const newNameRules = [
    (value: string): any => {
        if (value != undefined && value.trim().length > 0) return true
        return t('explorer.catalog.duplication.form.duplicationName.validations.required')
    },
    async (value: string): Promise<any> => {
        const classifierValidationResult : ClassifierValidationErrorType | undefined =
            await catalogItemService.isCatalogNameValid(value)
        if (classifierValidationResult == undefined) return true
        return t(`explorer.catalog.duplication.form.duplicationName.validations.${classifierValidationResult}`)
    },
    async (value: string): Promise<any> => {
        if (value === props.catalog.name) {
            return true
        }
        const available: boolean = await catalogItemService.isCatalogNameAvailable(value)
        if (available) return true
        return t('explorer.catalog.duplication.form.duplicationName.validations.notAvailable')
    }
]
const changed = computed<boolean>(() => props.catalog.name !== duplicationCatalogName.value)

async function duplicateCatalog():Promise<boolean> {
    try {
        catalogItemService.duplicateCatalogWithProgress(props.catalog, duplicationCatalogName.value!)
        await toaster.info(t('explorer.catalog.duplication.notification.catalogDuplicationStarted', {
            catalogName: props.catalog.name
        }))
        return true
    } catch (e: any) {
        await toaster.error(t(
            'explorer.catalog.duplication.notification.couldNotDuplicateCatalog',
            {
                catalogName: props.catalog.name,
                reason: e.message
            }
        ))
        return false
    }
}

async function reset() {
    duplicationCatalogName.value = ''
}
</script>

<template>
    <VFormDialog :model-value="modelValue" :confirm="duplicateCatalog" confirm-button-icon="mdi-content-duplicate" :changed="changed" :reset="reset" @update:model-value="emit('update:modelValue', $event)">
        <template #title>
            <I18nT keypath="explorer.catalog.duplication.title">
                <template #catalogName>
                    <strong>{{ catalog.name }}</strong>
                </template>
            </I18nT>
        </template>

        <template #default>
            <VTextField
                v-model="duplicationCatalogName"
                :label="t('explorer.catalog.duplication.form.duplicationName.label')"
                :rules="newNameRules"
                required
            />
        </template>

        <template #confirm-button-body>
            {{ t('common.button.duplicate') }}
        </template>
    </VFormDialog>
</template>

<style scoped lang="scss">

</style>

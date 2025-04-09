<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Connection } from '@/modules/connection/model/Connection'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { CatalogItemService, useCatalogItemService } from '@/modules/connection/explorer/service/CatalogItemService'
import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import { ClassifierValidationErrorType } from '@/modules/connection/model/data-type/ClassifierValidationErrorType'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'

const catalogItemService: CatalogItemService = useCatalogItemService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean
    connection: Connection
    catalogName: string
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void,
    (e: 'rename'): void
}>()

const newNameRules = [
    (value: string): any => {
        if (value != undefined && value.trim().length > 0) return true
        return t('explorer.catalog.rename.form.newName.validations.required')
    },
    async (value: string): Promise<any> => {
        const classifierValidationResult : ClassifierValidationErrorType | undefined =
            await catalogItemService.isCatalogNameValid(props.connection, value)
        if (classifierValidationResult == undefined) return true
        return t(`explorer.catalog.rename.form.newName.validations.${classifierValidationResult}`)
    },
    async (value: string): Promise<any> => {
        if (value === props.catalogName) {
            return true
        }
        const available: boolean = await catalogItemService.isCatalogNameAvailable(props.connection, value)
        if (available) return true
        return t('explorer.catalog.rename.form.newName.validations.notAvailable')
    }
]

const newCatalogName = ref<string>(props.catalogName)
const changed = computed<boolean>(() => props.catalogName !== newCatalogName.value)

function reset(): void {
    newCatalogName.value = props.catalogName
}

async function rename(): Promise<boolean> {
    try {
        const renamed: boolean = await catalogItemService.renameCatalog(props.connection, props.catalogName, newCatalogName.value)
        if (renamed) {
            await toaster.success(t(
                'explorer.catalog.rename.notification.catalogRenamed',
                {
                    catalogName: props.catalogName,
                    newName: newCatalogName.value
                }
            ))
            emit('rename')
        } else {
            await toaster.info(t(
                'explorer.catalog.rename.notification.catalogNotRenamed',
                {
                    catalogName: props.catalogName
                }
            ))
        }
        return true
    } catch (e: any) {
        await toaster.error(t(
            'explorer.catalog.rename.notification.couldNotRenameCatalog',
            {
                catalogName: props.catalogName,
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
            <I18nT keypath="explorer.catalog.rename.title">
                <template #catalogName>
                    <strong>{{ catalogName }}</strong>
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

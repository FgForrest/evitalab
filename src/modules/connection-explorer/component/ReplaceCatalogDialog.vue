<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CatalogItemService, useCatalogItemService } from '@/modules/connection-explorer/service/CatalogItemService'
import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { useToaster } from '@/modules/notification/service/Toaster'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'

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


const catalogNameToBeReplacedWithRules = [
    (value: string): string | boolean => {
        if (value != undefined && value.trim().length > 0) return true
        return t('explorer.catalog.replace.form.catalogNameToBeReplacedWith.validations.required')
    },
    async (value: string): Promise<string | boolean> => {
        if (value === props.catalog.name) {
            return true
        }
        const available: boolean = await catalogItemService.isCatalogExists(value)
        if (available) return true
        return t('explorer.catalog.replace.form.catalogNameToBeReplacedWith.validations.notExists')
    }
]

const catalogs = ref<CatalogStatistics[]>()
const catalogItems = computed<string[]>(() => {
    if (catalogs.value == undefined) {
        return []
    }
    return catalogs.value.map(it => it.name)
})
const loadedCatalogs = ref<boolean>(false)

const catalogNameToBeReplacedWith = ref<string | undefined>()
const changed = computed<boolean>(() =>
    catalogNameToBeReplacedWith.value != undefined && catalogNameToBeReplacedWith.value.length > 0)

void catalogItemService.getCatalogs()
    .then((fetchedCatalogs) => {
        catalogs.value = fetchedCatalogs
            .filter(it => it.name !== props.catalog.name)
            .toArray()
        loadedCatalogs.value = true
    })

function reset(): void {
    catalogs.value = []
    loadedCatalogs.value = false
    catalogNameToBeReplacedWith.value = ''
}

async function replace(): Promise<boolean> {
    try {
        catalogItemService.replaceCatalogWithProgress(
            props.catalog,
            catalogNameToBeReplacedWith.value!
        )
        await toaster.info(t('explorer.catalog.replace.notification.catalogReplacementStarted', {
            catalogName: props.catalog.name
        }))
        return true
    } catch (e: unknown) {
        await toaster.error(t(
            'explorer.catalog.replace.notification.couldNotReplaceCatalog',
            {
                catalogNameToBeReplaced: props.catalog.name,
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
        dangerous
        :changed="changed"
        confirm-button-icon="mdi-file-replace-outline"
        :confirm="replace"
        :reset="reset"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #title>
            <I18nT keypath="explorer.catalog.replace.title">
                <template #catalogNameToBeReplaced>
                    <strong>{{ catalog.name }}</strong>
                </template>
            </I18nT>
        </template>

        <template #default>
            <VAutocomplete
                v-model="catalogNameToBeReplacedWith"
                :label="t('explorer.catalog.replace.form.catalogNameToBeReplacedWith.label')"
                :items="catalogItems"
                :rules="catalogNameToBeReplacedWithRules"
            />
        </template>

        <template #append-form>
            <VAlert icon="mdi-information-outline" type="info">
                <I18nT keypath="explorer.catalog.replace.info">
                    <template #catalogNameToBeReplaced>
                        <strong>{{ catalog.name }}</strong>
                    </template>
                    <template v-if="changed" #catalogNameToBeReplacedWith>
                        <strong>{{ catalogNameToBeReplacedWith }}</strong>
                    </template>
                    <template v-else #catalogNameToBeReplacedWith>
                        <strong>?</strong>
                    </template>
                </I18nT>
            </VAlert>
        </template>

        <template #confirm-button-body>
            {{ t('common.button.replace') }}
        </template>
    </VFormDialog>
</template>

<style lang="scss" scoped>

</style>

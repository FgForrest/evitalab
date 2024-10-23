<script setup lang="ts">
import { Connection } from '@/modules/connection/model/Connection'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Catalog } from '@/modules/connection/model/Catalog'
import { CatalogItemService, useCatalogItemService } from '@/modules/connection/explorer/service/CatalogItemService'
import VFormDialog from '@/modules/base/component/VFormDialog.vue'
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
    (e: 'update:modelValue', value: boolean): void
    (e: 'replace'): void
}>()


const catalogNameToBeReplacedWithRules = [
    (value: string): any => {
        if (value != undefined && value.trim().length > 0) return true
        return t('explorer.catalog.replace.form.catalogNameToBeReplacedWith.validations.required')
    },
    async (value: string): Promise<any> => {
        if (value === props.catalogName) {
            return true
        }
        const available: boolean = await catalogItemService.isCatalogExists(props.connection, value)
        if (available) return true
        return t('explorer.catalog.replace.form.catalogNameToBeReplacedWith.validations.notExists')
    }
]

const catalogs = ref<Catalog[]>()
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

catalogItemService.getCatalogs(props.connection)
    .then((fetchedCatalogs) => {
        catalogs.value = fetchedCatalogs.filter(it => it.name !== props.catalogName)
        loadedCatalogs.value = true
    })

function reset(): void {
    catalogs.value = []
    loadedCatalogs.value = false
    catalogNameToBeReplacedWith.value = ''
}

async function replace(): Promise<boolean> {
    try {
        const replaced: boolean = await catalogItemService.replaceCatalog(
            props.connection,
            catalogNameToBeReplacedWith.value!,
            props.catalogName
        )
        if (replaced) {
            toaster.success(t(
                'explorer.catalog.replace.notification.catalogReplaced',
                {
                    catalogNameToBeReplaced: props.catalogName,
                    catalogNameToBeReplacedWith: catalogNameToBeReplacedWith.value
                }
            ))
            emit('replace')
        } else {
            toaster.info(t(
                'explorer.catalog.replace.notification.catalogNotReplaced',
                { catalogNameToBeReplaced: props.catalogName }
            ))
        }
        return true
    } catch (e: any) {
        toaster.error(t(
            'explorer.catalog.replace.notification.couldNotReplaceCatalog',
            {
                catalogNameToBeReplaced: props.catalogName,
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
        :changed="changed"
        confirm-button-icon="mdi-file-replace-outline"
        :confirm="replace"
        :reset="reset"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #title>
            <I18nT keypath="explorer.catalog.replace.title">
                <template #catalogNameToBeReplaced>
                    <strong>{{ catalogName }}</strong>
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
                        <strong>{{ catalogName }}</strong>
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

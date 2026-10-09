<script setup lang="ts">
/**
 * Confirms putting a catalog back to one of its listed versions — the only write the catalog viewer offers.
 *
 * The form has a single field: the catalog the restored state is served under. It defaults to the source catalog.
 * The description above the form explains the operation and the three shapes the target can take — the source
 * itself, another existing catalog, or a free name; the warning under the form states what the *current* choice
 * does, because which catalog is swapped, and what the operation destroys, differ between them. The server performs
 * the whole backup-restore-swap sequence as one task; this dialog only requests it.
 */

import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { asError } from '@/utils/error'
import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { useToaster } from '@/modules/notification/service/Toaster'
import { ClassifierValidationErrorType } from '@/modules/database-driver/data-type/ClassifierValidationErrorType'
import { CatalogVersionSummary } from '@/modules/catalog-viewer/model/CatalogVersionSummary'
import { TaskStatus } from '@/modules/database-driver/request-response/task/TaskStatus'
import { CatalogViewerService, useCatalogViewerService } from '@/modules/catalog-viewer/service/CatalogViewerService'
import { formatDateTime, formatNumber } from '@/modules/catalog-viewer/service/statisticsFormatting'

const catalogViewerService: CatalogViewerService = useCatalogViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean
    catalogName: string
    version: CatalogVersionSummary
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    /**
     * The restore was accepted by the server; carries the task tracking it, so the caller can follow its progress.
     */
    (e: 'restore', task: TaskStatus): void
}>()

/**
 * What the chosen target name refers to, which decides which warning the dialog shows.
 */
type TargetKind = 'source' | 'existing' | 'new'

const catalogNames = ref<string[]>([])
const targetCatalogName = ref<string>(props.catalogName)

const normalizedTargetCatalogName = computed<string>(() => targetCatalogName.value?.trim() ?? '')
const targetKind = computed<TargetKind>(() => {
    if (normalizedTargetCatalogName.value.length === 0 || normalizedTargetCatalogName.value === props.catalogName) {
        return 'source'
    }
    return catalogNames.value.includes(normalizedTargetCatalogName.value) ? 'existing' : 'new'
})

const targetCatalogNameRules = [
    (value: string): boolean | string => {
        if (value != undefined && value.trim().length > 0) return true
        return t('catalogViewer.history.versions.restore.form.targetCatalogName.validations.required')
    },
    async (value: string): Promise<boolean | string> => {
        const validationResult: ClassifierValidationErrorType | undefined =
            await catalogViewerService.isCatalogNameValid(value)
        if (validationResult == undefined) return true
        return t(`catalogViewer.history.versions.restore.form.targetCatalogName.validations.${validationResult}`)
    }
]

const formattedVersion = computed<string>(() => formatNumber(props.version.version))
const formattedTimestamp = computed<string>(() => formatDateTime(props.version.commitTimestamp))

onMounted(async () => {
    try {
        catalogNames.value = (await catalogViewerService.getCatalogNames()).toArray()
    } catch (e) {
        await toaster.error(t('catalogViewer.history.versions.restore.notification.couldNotLoadCatalogs'), asError(e))
    }
})

function reset(): void {
    targetCatalogName.value = props.catalogName
}

async function restore(): Promise<boolean> {
    try {
        const task: TaskStatus = await catalogViewerService.restoreCatalogToVersion(
            props.catalogName,
            props.version.version,
            normalizedTargetCatalogName.value
        )
        await toaster.success(t(
            'catalogViewer.history.versions.restore.notification.restoreRequested',
            {
                catalogName: props.catalogName,
                version: formattedVersion.value,
                targetCatalogName: normalizedTargetCatalogName.value
            }
        ))
        emit('restore', task)
        return true
    } catch (e) {
        await toaster.error(
            t(
                'catalogViewer.history.versions.restore.notification.couldNotRequestRestore',
                { catalogName: props.catalogName, version: formattedVersion.value }
            ),
            asError(e)
        )
        return false
    }
}
</script>

<template>
    <VFormDialog
        :model-value="modelValue"
        dangerous
        changed
        confirm-button-icon="mdi-backup-restore"
        :confirm="restore"
        :reset="reset"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #title>
            <I18nT keypath="catalogViewer.history.versions.restore.title">
                <template #catalogName>
                    <strong>{{ catalogName }}</strong>
                </template>
                <template #version>
                    <strong>{{ formattedVersion }}</strong>
                </template>
            </I18nT>
        </template>

        <template #prepend-form>
            <I18nT keypath="catalogViewer.history.versions.restore.description" tag="p">
                <template #catalogName>
                    <strong>{{ catalogName }}</strong>
                </template>
                <template #version>
                    <strong>{{ formattedVersion }}</strong>
                </template>
                <template #timestamp>
                    <strong>{{ formattedTimestamp }}</strong>
                </template>
            </I18nT>
        </template>

        <template #default>
            <VCombobox
                v-model="targetCatalogName"
                :label="t('catalogViewer.history.versions.restore.form.targetCatalogName.label')"
                :items="catalogNames"
                :rules="targetCatalogNameRules"
                :hint="t('catalogViewer.history.versions.restore.form.targetCatalogName.hint')"
                persistent-hint
                required
            />
        </template>

        <template #append-form>
            <VAlert icon="mdi-alert-outline" type="warning" class="restore-warning">
                <ul class="restore-warning__list">
                    <li>
                        <I18nT :keypath="`catalogViewer.history.versions.restore.warning.target.${targetKind}`">
                            <template #catalogName>
                                <strong>{{ catalogName }}</strong>
                            </template>
                            <template #targetCatalogName>
                                <strong>{{ normalizedTargetCatalogName }}</strong>
                            </template>
                        </I18nT>
                    </li>
                    <li>
                        <I18nT
                            :keypath="targetKind === 'source'
                                ? 'catalogViewer.history.versions.restore.warning.laterWritesLost'
                                : 'catalogViewer.history.versions.restore.warning.laterWritesLeft'"
                        >
                            <template #catalogName>
                                <strong>{{ catalogName }}</strong>
                            </template>
                            <template #version>
                                <strong>{{ formattedVersion }}</strong>
                            </template>
                        </I18nT>
                    </li>
                    <li>{{ t('catalogViewer.history.versions.restore.warning.noHistory') }}</li>
                </ul>
            </VAlert>
            <VAlert icon="mdi-information-outline" type="info">
                {{ t('catalogViewer.history.versions.restore.info') }}
            </VAlert>
        </template>

        <template #confirm-button-body>
            {{ t('catalogViewer.history.versions.restore.button.restore') }}
        </template>
    </VFormDialog>
</template>

<style lang="scss" scoped>
.restore-warning {
    margin-bottom: 1rem;

    &__list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding-left: 1.25rem;
    }
}
</style>

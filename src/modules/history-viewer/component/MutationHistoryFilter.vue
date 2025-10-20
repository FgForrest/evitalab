<script setup lang="ts">

/**
 * Allows specifying filter for mutationHistory records history
 */

import VDateTimeInput from '@/modules/base/component/VDateTimeInput.vue'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { Toaster } from '@/modules/notification/service/Toaster'
import { useToaster } from '@/modules/notification/service/Toaster'
import {
    MutationHistoryViewerService,
    useMutationHistoryViewerService
} from '@/modules/history-viewer/service/MutationHistoryViewerService.ts'
import { MutationHistoryCriteria } from '@/modules/history-viewer/model/MutationHistoryCriteria.ts'
import type { MutationHistoryDataPointer } from '@/modules/history-viewer/model/MutationHistoryDataPointer.ts'
import { UserMutationType } from '@/modules/history-viewer/model/UserMutationHistoryType.ts'
import type { DateTime } from 'luxon'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime.ts'
import {
    GrpcChangeCaptureOperation,
    GrpcChangeCaptureContainerType
} from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb.ts'
import { useEvitaClient } from '@/modules/database-driver/EvitaClient'

const mutationHistoryViewerService: MutationHistoryViewerService = useMutationHistoryViewerService()
const evitaClient = useEvitaClient()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const userMutationHistoryMutationOperation: any[] = ['UPSERT', 'REMOVE'].map(type => {
    return {
        value: type,
        title: t(`mutationHistoryViewer.filter.form.mutationOperation.items.${type}`)
    }
})

const userMutationHistoryContainerType: any[] = [
    'CONTAINER_CATALOG',
    'CONTAINER_ATTRIBUTE',
    'CONTAINER_ASSOCIATED_DATA',
    'CONTAINER_PRICE',
    'CONTAINER_REFERENCE'
]
    .map(type => {
        return {
            value: type,
            title: t(`mutationHistoryViewer.filter.form.containerType.items.${type}`)
        }
    })

const props = defineProps<{
    modelValue: MutationHistoryCriteria
    dataPointer: MutationHistoryDataPointer
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: MutationHistoryCriteria): void,
    (e: 'apply'): void
}>()

const criteria = ref<MutationHistoryCriteria>(new MutationHistoryCriteria(
    props.modelValue.from,
    props.modelValue.to,
    props.modelValue.entityPrimaryKey,
    props.modelValue.operationList,
    props.modelValue.containerNameList,
    props.modelValue.containerTypeList,
    props.modelValue.entityType,
    props.modelValue.areaType ?? 'both'
))
const criteriaChanged = ref<boolean>(false)
watch(criteria.value, (newValue) => {
    emit('update:modelValue', newValue)
    criteriaChanged.value = true
})

const form = ref<HTMLFormElement | null>(null)
const formValidationState = ref<boolean | null>(null)

const from = ref<DateTime | undefined>(criteria.value.from?.toDateTime())
watch(from, async (newValue) => {
    if (await assertFormValidated()) {
        if (newValue == undefined) {
            criteria.value.from = undefined
        } else {
            criteria.value.from = OffsetDateTime.fromDateTime(newValue)
        }
    }
})

const to = ref<DateTime | undefined>(criteria.value.to?.toDateTime())
watch(to, async (newValue) => {
    if (await assertFormValidated()) {
        if (newValue == undefined) {
            criteria.value.to = undefined
        } else {
            criteria.value.to = OffsetDateTime.fromDateTime(newValue)
        }
    }
})

const operationList = ref<GrpcChangeCaptureOperation[]>(
    criteria.value.operationList != undefined
        ? criteria.value.operationList
        : []
)
watch(operationList, async (newValue) => {
    if (await assertFormValidated()) {
        criteria.value.operationList = newValue
    }
})

const entityPrimaryKey = ref<number | undefined>(criteria.value.entityPrimaryKey || undefined)
watch(entityPrimaryKey, async (newValue) => {
    if (await assertFormValidated()) {
        if (newValue == undefined || newValue === 0) {
            criteria.value.entityPrimaryKey = undefined
        } else {
            criteria.value.entityPrimaryKey = newValue
        }
    }
})
const entityPrimaryKeyRules = [
    (value: string): any => {
        if (value == undefined || value === '') {
            return true
        }
        // todo number validation
        // const uuidPattern: RegExp = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/
        // if (!uuidPattern.exec(value)) {
        //     return t('mutationHistoryViewer.recordHistory.filter.form.entityPrimaryKey.validations.notValid')
        // }
        return true
    }
]

const entityTypeItems = ref<string[]>([])
const entityType = ref<string | undefined>(criteria.value.entityType)
watch(entityType, async (newValue) => {
    if (await assertFormValidated()) {
        criteria.value.entityType = newValue
    }
})

const containerNameList = ref<string[]>(criteria.value.containerNameList ?? [])
watch(containerNameList, async (newValue) => {
    if (await assertFormValidated()) {
        criteria.value.containerNameList = newValue
    }
})

const containerTypeList = ref<GrpcChangeCaptureContainerType[]>(criteria.value.containerTypeList ?? [])
watch(containerTypeList, async (newValue) => {
    if (await assertFormValidated()) {
        criteria.value.containerTypeList = newValue
    }
})

async function loadEntityTypes(): Promise<void> {
    const schema = await evitaClient.queryCatalog(
        props.dataPointer.catalogName,
        async session => await session.getCatalogSchema()
    )
    const map = await schema.entitySchemas()
    entityTypeItems.value = Array.from(map.keys())
}

onMounted(async () => {
    await loadEntityTypes()
})

const areaTypeItems = [
    { value: 'both', title: t('mutationHistoryViewer.filter.form.areaType.items.both') },
    { value: 'dataSite', title: t('mutationHistoryViewer.filter.form.areaType.items.dataSite') },
    { value: 'schemaSite', title: t('mutationHistoryViewer.filter.form.areaType.items.schemaSite') }
]
const areaType = ref<'both' | 'dataSite' | 'schemaSite'>(criteria.value.areaType ?? 'both')
watch(areaType, async (newValue) => {
    if (await assertFormValidated()) {
        criteria.value.areaType = newValue
    }
})

async function assertFormValidated(): Promise<boolean> {
    if (form.value == undefined) {
        throw new UnexpectedError('Missing form reference.')
    }

    //@ts-ignore
    const { valid }: any = await form.value.validate()
    return valid
}

async function applyChangedCriteria(): Promise<void> {
    //@ts-ignore
    const { valid }: any = await form.value.validate()
    if (!valid) {
        await toaster.error(t('mutationHistoryViewer.recordHistory.filter.notification.invalidFilter'))
        return
    }

    emit('apply')
    criteriaChanged.value = false
}
</script>

<template>
    <VForm
        v-model="formValidationState"
        ref="form"
        validate-on="blur"
        @submit="applyChangedCriteria"
        class="record-history-filter-form"
    >
        <div class="record-history-filter">
            <span class="record-history-filter__label text-disabled">{{ t('mutationHistoryViewer.filter.label')
                }}:</span>
            <VTooltip>
                <template #activator="{ props }">
                    <VDateTimeInput
                        v-model="from"
                        :label="t('mutationHistoryViewer.filter.form.from.label')"
                        hide-details
                        clearable
                        class="record-history-filter__input"
                        v-bind="props"
                    />
                </template>
                <template #default>
                    {{ t('mutationHistoryViewer.filter.form.from.hint') }}
                </template>
            </VTooltip>
            <VTooltip>
                <template #activator="{ props }">
                    <VDateTimeInput
                        v-model="to"
                        :label="t('mutationHistoryViewer.filter.form.to.label')"
                        hide-details
                        clearable
                        class="record-history-filter__input"
                        v-bind="props"
                    />
                </template>
                <template #default>
                    {{ t('mutationHistoryViewer.filter.form.to.hint') }}
                </template>
            </VTooltip>
            <VTooltip>
                <template #activator="{ props }">
                    <VSelect
                        v-model="operationList"
                        :items="userMutationHistoryMutationOperation"
                        :label="t('mutationHistoryViewer.filter.form.mutationOperation.label')"
                        multiple
                        clearable
                        hide-details
                        class="record-history-filter__input"
                        v-bind="props"
                    >
                        <template #selection="{ index }">
                        <span
                            v-if="index === 0"
                            class="text-grey text-caption align-self-center text-truncate"
                        >
                            {{ t('mutationHistoryViewer.filter.form.mutationOperation.valueDescriptor', { count: operationList.length })
                            }}
                          </span>
                        </template>
                    </VSelect>
                </template>
                <template #default>
                    {{ t('mutationHistoryViewer.filter.form.mutationOperation.hint') }}
                </template>
            </VTooltip>

            <VTooltip>
                <template #activator="{ props }">
                    <VCombobox
                        v-model="entityType"
                        :items="entityTypeItems"
                        :label="t('mutationHistoryViewer.filter.form.entityType.label')"
                        hide-details
                        clearable
                        class="record-history-filter__input"
                        v-bind="props"
                    />
                </template>
                <template #default>
                    {{ t('mutationHistoryViewer.filter.form.entityType.hint') }}
                </template>
            </VTooltip>

            <VTooltip>
                <template #activator="{ props }">
                    <VSelect
                        v-model="containerTypeList"
                        :items="userMutationHistoryContainerType"
                        :label="t('mutationHistoryViewer.filter.form.containerType.label')"
                        multiple
                        clearable
                        hide-details
                        class="record-history-filter__input"
                        v-bind="props"
                    >
                        <template #selection="{ index }">
                        <span
                            v-if="index === 0"
                            class="text-grey text-caption align-self-center text-truncate"
                        >
                            {{ t('mutationHistoryViewer.filter.form.containerType.valueDescriptor', { count: containerTypeList.length })
                            }}
                          </span>
                        </template>
                    </VSelect>
                </template>
                <template #default>
                    {{ t('mutationHistoryViewer.filter.form.containerType.hint') }}
                </template>
            </VTooltip>

            <VTooltip>
                <template #activator="{ props }">
                    <VCombobox
                        v-model="containerNameList"
                        :label="t('mutationHistoryViewer.filter.form.containerName.label')"
                        :items="[]"
                        multiple
                        chips
                        clearable
                        hide-details
                        class="record-history-filter__input"
                        v-bind="props"
                    />
                </template>
                <template #default>
                    {{ t('mutationHistoryViewer.filter.form.containerName.hint') }}
                </template>
            </VTooltip>

            <!-- area type selector -->
            <VTooltip>
                <template #activator="{ props }">
                    <VSelect
                        v-model="areaType"
                        :items="areaTypeItems"
                        :label="t('mutationHistoryViewer.filter.form.areaType.label')"
                        hide-details
                        clearable
                        class="record-history-filter__input"
                        v-bind="props"
                    />
                </template>
                <template #default>
                    {{ t('mutationHistoryViewer.filter.form.areaType.hint') }}
                </template>
            </VTooltip>
            -->


            <!--            pokud je vybrána "area type" == dataSite, tak zde zobrazit tento input na entityPrimaryKey- -->
            <VTooltip v-if="areaType === 'dataSite'">
                <template #activator="{ props }">
                    <VTextField
                        v-model="entityPrimaryKey"
                        :label="t('mutationHistoryViewer.filter.form.entityPrimaryKey.label')"
                        :rules="entityPrimaryKeyRules"
                        clearable
                        hide-details
                        class="record-history-filter__input"
                        v-bind="props"
                    />
                </template>
                <template #default>
                    {{ t('mutationHistoryViewer.filter.form.entityPrimaryKey.hint') }}
                </template>
            </VTooltip>

        </div>

        <VTooltip v-if="criteriaChanged">
            <template #activator="{ props }">
                <VBtn
                    type="submit"
                    icon
                    @click="applyChangedCriteria"
                    v-bind="props"
                >
                    <VIcon>mdi-send</VIcon>
                </VBtn>
            </template>
            <template #default>
                {{ t('mutationHistoryViewer.filter.button.apply') }}
            </template>
        </VTooltip>
    </VForm>
</template>

<style lang="scss" scoped>
.record-history-filter-form {
    width: 100%;
    display: flex;
    height: 3.5rem;
    padding: 0 0.25rem;
    align-items: center;
    gap: 0.25rem;
}

.record-history-filter {
    width: 100%;
    height: 3.5rem;
    display: flex;
    gap: 0.5rem;
    flex-wrap: nowrap;
    justify-content: space-evenly;
    align-items: center;
    padding: 0 0.25rem;
    // todo lho not working properly
    overflow-x: auto;

    &__label {
        flex: 0;
        padding: 0 0.25rem;
        display: block;
    }

    &__input {
        flex: 1;
        min-width: 10rem;
    }
}
</style>

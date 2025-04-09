<script setup lang="ts">

/**
 * Allows specifying filter for traffic records history
 */

import { TrafficRecordHistoryCriteria } from '@/modules/traffic-viewer/model/TrafficRecordHistoryCriteria'
import VDateTimeInput from '@/modules/base/component/VDateTimeInput.vue'
import { DateTime, Duration } from 'luxon'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Label } from '@/modules/connection/model/traffic/Label'
import { TrafficViewerService, useTrafficViewerService } from '@/modules/traffic-viewer/service/TrafficViewerService'
import { Uuid } from '@/modules/connection/model/data-type/Uuid'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { OffsetDateTime } from '@/modules/connection/model/data-type/OffsetDateTime'
import { TrafficRecordHistoryDataPointer } from '@/modules/traffic-viewer/model/TrafficRecordHistoryDataPointer'
import Immutable from 'immutable'
import {
    UserTrafficRecordType
} from '@/modules/traffic-viewer/model/UserTrafficRecordType'
import VLabelSelect from '@/modules/traffic-viewer/components/VLabelSelect.vue'
import { parseHumanDurationToMs } from '@/utils/duration'
import { parseHumanByteSizeToNumber } from '@/utils/number'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'

const trafficViewerService: TrafficViewerService = useTrafficViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const userTrafficRecordTypeItems: any[] = Object.values(UserTrafficRecordType).map(type => {
    return {
        value: type,
        title: t(`trafficViewer.recordHistory.filter.form.types.type.${type}`)
    }
})

const props = defineProps<{
    modelValue: TrafficRecordHistoryCriteria
    dataPointer: TrafficRecordHistoryDataPointer
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: TrafficRecordHistoryCriteria): void,
    (e: 'apply'): void
}>()

const criteria = ref<TrafficRecordHistoryCriteria>(new TrafficRecordHistoryCriteria(
    props.modelValue.since,
    props.modelValue.types,
    props.modelValue.sessionId,
    props.modelValue.longerThanInHumanFormat,
    props.modelValue.fetchingMoreBytesThanInHumanFormat,
    props.modelValue.labels
))
const criteriaChanged = ref<boolean>(false)
watch(criteria.value, (newValue) => {
    emit('update:modelValue', newValue)
    criteriaChanged.value = true
})

const form = ref<HTMLFormElement | null>(null)
const formValidationState = ref<boolean | null>(null)

const since = ref<DateTime | undefined>(criteria.value.since?.toDateTime())
watch(since, async (newValue) => {
    if (await assertFormValidated()) {
        if (newValue == undefined) {
            criteria.value.since = undefined
        } else {
            criteria.value.since = OffsetDateTime.fromDateTime(newValue)
        }
    }
})

const types = ref<UserTrafficRecordType[]>(
    criteria.value.types != undefined
        ? criteria.value.types
        : []
)
watch(types, async (newValue) => {
    if (await assertFormValidated()) {
        criteria.value.types = newValue
    }
})

const sessionId = ref<string>(criteria.value.sessionId?.toString() || '')
watch(sessionId, async (newValue) => {
    if (await assertFormValidated()) {
        if (newValue == undefined || newValue.trim().length === 0) {
            criteria.value.sessionId = undefined
        } else {
            criteria.value.sessionId = Uuid.fromCode(newValue)
        }
    }
})
const sessionIdRules = [
    (value: string): any => {
        if (value == undefined || value === '') {
            return true
        }
        const uuidPattern: RegExp = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/
        if (!uuidPattern.exec(value)) {
            return t('trafficViewer.recordHistory.filter.form.sessionId.validations.notUuid')
        }
        return true
    }
]

const longerThan = ref<string | undefined>(criteria.value.longerThanInHumanFormat || '')
const longerThanRules = [
    (value: string): any => {
        if (value == undefined || value === '') {
            return true
        }
        let duration: bigint
        try {
            duration = parseHumanDurationToMs(value.trim())
        } catch (e) {
            return t('trafficViewer.recordHistory.filter.form.longerThan.validations.notNumber')
        }
        if (duration < 0 || duration > Number.MAX_SAFE_INTEGER) {
            return t('trafficViewer.recordHistory.filter.form.longerThan.validations.outOfRange')
        }
        return true
    }
]
watch(longerThan, async (newValue) => {
    if (await assertFormValidated()) {
        if (newValue == undefined || newValue.trim().length === 0) {
            criteria.value.longerThanInHumanFormat = undefined
        } else {
            criteria.value.longerThanInHumanFormat = newValue.trim()
        }
    }
})

const fetchingMoreBytesThan = ref<string>(criteria.value.fetchingMoreBytesThanInHumanFormat || '')
const fetchingMoreBytesThanRules = [
    (value: string): any => {
        if (value == undefined || value === '') {
            return true
        }
        let number: number
        try {
            number = parseHumanByteSizeToNumber(value.trim())[0]
        } catch (e) {
            return t('trafficViewer.recordHistory.filter.form.fetchingMoreBytesThan.validations.notByteSize')
        }
        if (number < 0 || number > Number.MAX_SAFE_INTEGER) {
            return t('trafficViewer.recordHistory.filter.form.fetchingMoreBytesThan.validations.outOfRange')
        }
        return true
    }
]
watch(fetchingMoreBytesThan, async (newValue) => {
    if (await assertFormValidated()) {
        if (newValue == undefined || newValue.trim().length === 0) {
            criteria.value.fetchingMoreBytesThanInHumanFormat = undefined
        } else {
            criteria.value.fetchingMoreBytesThanInHumanFormat = newValue.trim()
        }
    }
})

const labels = ref<Label[]>(criteria.value.labels || [])
watch(labels, async (newValue) => {
    if (await assertFormValidated()) {
        criteria.value.labels = newValue
    }
})

async function loadLabelNames(nameStartsWith: string): Promise<Immutable.List<string>> {
    return trafficViewerService.getLabelNames(
        props.dataPointer.connection,
        props.dataPointer.catalogName,
        nameStartsWith,
        10
    )
}

async function loadLabelValues(labelName: string, valueStartsWith: string): Promise<Immutable.List<string>> {
    return trafficViewerService.getLabelValues(
        props.dataPointer.connection,
        props.dataPointer.catalogName,
        labelName,
        valueStartsWith,
        10
    )
}

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
        await toaster.error(t('trafficViewer.recordHistory.filter.notification.invalidFilter'))
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
            <span class="record-history-filter__label text-disabled">{{ t('trafficViewer.recordHistory.filter.label') }}:</span>
            <VTooltip>
                <template #activator="{ props }">
                    <VDateTimeInput
                        v-model="since"
                        :label="t('trafficViewer.recordHistory.filter.form.since.label')"
                        hide-details
                        clearable
                        class="record-history-filter__input"
                        v-bind="props"
                    />
                </template>
                <template #default>
                    {{ t('trafficViewer.recordHistory.filter.form.since.hint') }}
                </template>
            </VTooltip>
            <VTooltip>
                <template #activator="{ props }">
                    <VSelect
                        v-model="types"
                        :items="userTrafficRecordTypeItems"
                        :label="t('trafficViewer.recordHistory.filter.form.types.label')"
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
                            {{ t('trafficViewer.recordHistory.filter.form.types.valueDescriptor', { count: types.length }) }}
                          </span>
                        </template>
                    </VSelect>
                </template>
                <template #default>
                    {{ t('trafficViewer.recordHistory.filter.form.types.hint') }}
                </template>
            </VTooltip>
            <VTooltip>
                <template #activator="{ props }">
                    <VTextField
                        v-model="sessionId"
                        :label="t('trafficViewer.recordHistory.filter.form.sessionId.label')"
                        :rules="sessionIdRules"
                        clearable
                        hide-details
                        class="record-history-filter__input"
                        v-bind="props"
                    />
                </template>
                <template #default>
                    {{ t('trafficViewer.recordHistory.filter.form.sessionId.hint') }}
                </template>
            </VTooltip>
            <VTooltip>
                <template #activator="{ props }">
                    <VTextField
                        v-model="longerThan"
                        :label="t('trafficViewer.recordHistory.filter.form.longerThan.label')"
                        :rules="longerThanRules"
                        clearable
                        hide-details
                        class="record-history-filter__input"
                        v-bind="props"
                    />
                </template>
                <template #default>
                    {{ t('trafficViewer.recordHistory.filter.form.longerThan.hint') }}
                </template>
            </VTooltip>
            <VTooltip>
                <template #activator="{ props }">
                    <VTextField
                        v-model="fetchingMoreBytesThan"
                        :label="t('trafficViewer.recordHistory.filter.form.fetchingMoreBytesThan.label')"
                        :suffix="t('trafficViewer.recordHistory.filter.form.fetchingMoreBytesThan.unit')"
                        :rules="fetchingMoreBytesThanRules"
                        clearable
                        hide-details
                        class="record-history-filter__input"
                        v-bind="props"
                    />
                </template>
                <template #default>
                    {{ t('trafficViewer.recordHistory.filter.form.fetchingMoreBytesThan.hint') }}
                </template>
            </VTooltip>
            <VTooltip>
                <template #activator="{ props }">
                    <VLabelSelect
                        v-model="labels"
                        :label="t('trafficViewer.recordHistory.filter.form.labels.label')"
                        :label-names-provider="loadLabelNames"
                        :label-values-provider="loadLabelValues"
                        clearable
                        hide-details
                        class="record-history-filter__input"
                        v-bind="props"
                    />
                </template>
                <template #default>
                    {{ t('trafficViewer.recordHistory.filter.form.labels.hint') }}
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
                {{ t('trafficViewer.recordHistory.filter.button.apply') }}
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

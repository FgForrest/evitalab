<script setup lang="ts">

import VLabDialog from '@/modules/base/component/VLabDialog.vue'
import { ApiType } from '@/modules/connection/model/status/ApiType'
import { ApiStatus } from '@/modules/connection/model/status/ApiStatus'
import { useI18n } from 'vue-i18n'
import VPropertiesTable from '@/modules/base/component/VPropertiesTable.vue'
import { computed } from 'vue'
import { Property } from '@/modules/base/model/properties-table/Property'
import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue'
import { PlaceholderValue } from '@/modules/base/model/properties-table/PlaceholderValue'
import { KeywordValue } from '@/modules/base/model/properties-table/KeywordValue'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'

const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean,
    apiType: ApiType,
    apiStatus: ApiStatus
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

function formatUrl(url: string): string {
    return url.replace('0.0.0.0', '127.0.0.1')
}

const baseProperties = computed<Property[]>(() => [
    new Property(
        t('serverViewer.serverStatus.apiDetail.props.enabled'),
        new PropertyValue(props.apiStatus.enabled)
    ),
    new Property(
        t('serverViewer.serverStatus.apiDetail.props.ready'),
        new PropertyValue(props.apiStatus.ready)
    ),
    new Property(
        t('serverViewer.serverStatus.apiDetail.props.baseUrls'),
        !props.apiStatus.baseUrls.isEmpty()
            ? props.apiStatus
                .baseUrls
                .map(baseUrl => formatUrl(baseUrl))
                .map(baseUrl => new PropertyValue(
                    new KeywordValue(baseUrl),
                    undefined,
                    (item) => {
                        navigator.clipboard.writeText(item!).then(() => {
                            toaster.info(t('common.notification.copiedToClipboard')).then()
                        }).catch(() => {
                            toaster.error(t('common.notification.failedToCopyToClipboard')).then()
                        })
                    }
                ))
            : new PropertyValue(new PlaceholderValue(t('common.placeholder.empty')))
    )
])
const endpoints = computed<Property[]>(() => {
    return props.apiStatus
        .endpoints
        .map(endpoint => {
            return new Property(
                endpoint.name,
                endpoint.urls
                    .map(url => formatUrl(url))
                    .map(url => new PropertyValue(
                        new KeywordValue(url),
                        undefined,
                        (item) => {
                            navigator.clipboard.writeText(item!).then(() => {
                                toaster.info(t('common.notification.copiedToClipboard')).then()
                            }).catch(() => {
                                toaster.error(t('common.notification.failedToCopyToClipboard')).then()
                            })
                        }
                    ))
            )
        })
        .toArray()
})
</script>

<template>
    <VLabDialog
        :model-value="modelValue"
        max-width="60rem"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #activator="{ props }">
            <slot name="activator" :props="props" />
        </template>

        <template #title>
            {{ t('serverViewer.serverStatus.apiDetail.title', { apiType: t(`serverViewer.serverStatus.apiType.${apiType}`) }) }}
        </template>

        <template #default>
            <VPropertiesTable :properties="baseProperties" />

            <div v-if="!apiStatus.endpoints.isEmpty()" class="endpoints">
                <VPropertiesTable :properties="endpoints" :title="t('serverViewer.serverStatus.apiDetail.endpoints.title')" />
            </div>
        </template>
    </VLabDialog>
</template>

<style lang="scss" scoped>
.endpoints {
    margin-top: 1rem;
}
</style>

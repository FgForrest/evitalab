<script setup lang="ts">

import VPropertiesTable from '@/modules/base/component/VPropertiesTable.vue'
import { ServerStatus } from '@/modules/connection/model/status/ServerStatus'
import { computed } from 'vue'
import { Property } from '@/modules/base/model/properties-table/Property'
import { useI18n } from 'vue-i18n'
import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue'
import { Duration } from 'luxon'
import { KeywordValue } from '@/modules/base/model/properties-table/KeywordValue'

const { t } = useI18n()

const props = defineProps<{
    serverStatus: ServerStatus
}>()

const stats = computed<Property[]>(() => {
    const stats: Property[] = [
        new Property(
            t('serverViewer.serverStatus.stats.started'),
            new PropertyValue(props.serverStatus.started.getPrettyPrintableString())
        ),
        new Property(
            t('serverViewer.serverStatus.stats.uptime'),
            new PropertyValue(Duration.fromMillis(Number(props.serverStatus.uptime) * 1000).toHuman())
        ),
        new Property(
            t('serverViewer.serverStatus.stats.readiness.label'),
            new PropertyValue(new KeywordValue(t(`serverViewer.serverStatus.stats.readiness.type.${props.serverStatus.readiness}`)))
        ),
        new Property(
            t('serverViewer.serverStatus.stats.catalogsOk'),
            new PropertyValue(props.serverStatus.catalogsOk)
        ),
        new Property(
            t('serverViewer.serverStatus.stats.catalogsCorrupted'),
            new PropertyValue(props.serverStatus.catalogsCorrupted)
        )
    ]

    if (!props.serverStatus.healthProblems.isEmpty()) {
        stats.push(
            new Property(
                t('serverViewer.serverStatus.stats.healthProblems.label'),
                props.serverStatus
                    .healthProblems
                    .map(healthProblem => new PropertyValue(
                        new KeywordValue(
                            t(`serverViewer.serverStatus.stats.healthProblems.type.${healthProblem}`)
                        )
                    ))
                    .toList()
            )
        )
    }

    return stats
})
</script>

<template>
    <VPropertiesTable :properties="stats" dense />
</template>

<style lang="scss" scoped>

</style>

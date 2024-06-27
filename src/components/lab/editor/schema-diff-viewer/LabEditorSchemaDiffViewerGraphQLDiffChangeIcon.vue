<script setup lang="ts">
import { ChangeActionType, GraphQLSchemaChange, GraphQLSchemaChangeSeverity } from '@/model/evitadb'
import { computed } from 'vue'
import { Toaster, useToaster } from '@/services/editor/toaster'
import { UnexpectedError } from '@/model/lab'

const toaster: Toaster = useToaster()

const props = defineProps<{
    change: GraphQLSchemaChange
}>()

const actionTypeIcon = computed<{ icon: string, color: string, tooltip: string } >(() => {
    switch (props.change.type.actionType) {
        case ChangeActionType.Addition:
            return { icon: 'mdi-plus', color: 'success', tooltip: 'Addition' }
        case ChangeActionType.Removal:
            return { icon: 'mdi-delete-outline', color: 'error', tooltip: 'Removal' }
        case ChangeActionType.Modification:
            return { icon: 'mdi-pencil-circle-outline', color: 'warning', tooltip: 'Modification' }
        case ChangeActionType.Deprecation:
            return { icon: 'mdi-alert-circle-outline', color: 'warning', tooltip: 'Deprecation' }
        case ChangeActionType.Unclassified:
            return { icon: 'mdi-help-circle-outline', color: 'warning', tooltip: 'Unclassified' }
        default:
            toaster.error(new UnexpectedError(undefined, `Unsupported action type '${props.change.type.actionType}'`))
            return { icon: 'mdi-help-circle-outline', color: 'warning', tooltip: 'Unsupported action type' }
    }
})
</script>

<template>
    <div>
        <span>
            <VIcon :color="actionTypeIcon.color">
                {{ actionTypeIcon.icon }}
            </VIcon>
            <VTooltip activator="parent">
                {{ actionTypeIcon.tooltip }}
            </VTooltip>
        </span>
    </div>
</template>

<style lang="scss" scoped>

</style>

<script setup lang="ts">
/**
 * Entity property value renderer that tries to render the value in a code editor.
 */

import { EntityPropertyValue, EntityPropertyValueSupportedCodeLanguage } from '@/model/editor/tab/dataGrid/data-grid'
import { computed, ref } from 'vue'
import { Toaster, useToaster } from '@/services/editor/toaster'
import { Extension } from '@codemirror/state'
import { json } from '@codemirror/lang-json'
import { xml } from '@codemirror/lang-xml'
import { UnexpectedError } from '@/model/lab'
import LabEditorDataGridGridCellDetailValueRenderer
    from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridCellDetailValueRenderer.vue'
import { DataGridService, useDataGridService } from '@/services/editor/data-grid.service'
import VPreviewEditor from '@/components/base/VPreviewEditor.vue'

const toaster: Toaster = useToaster()
const dataGridService: DataGridService = useDataGridService()

enum ActionType {
    Copy = 'copy',
    PrettyPrint = 'pretty-print'
}

const props = withDefaults(defineProps<{
    value: EntityPropertyValue | EntityPropertyValue[],
    codeLanguage?: EntityPropertyValueSupportedCodeLanguage,
    fillSpace?: boolean
}>(), {
    codeLanguage: EntityPropertyValueSupportedCodeLanguage.Raw,
    fillSpace: true
})

const prettyPrint = ref<boolean>(true)
const actions = computed(() => {
    const actions = [
        {
            title: 'Copy',
            value: ActionType.Copy,
            props: {
                prependIcon: 'mdi-content-copy'
            }
        }
    ]
    if (props.codeLanguage !== EntityPropertyValueSupportedCodeLanguage.Raw) {
        actions.push({
            title: prettyPrint.value ? 'Display raw value' : 'Pretty print value',
            value: ActionType.PrettyPrint,
            props: {
                prependIcon: prettyPrint.value ? 'mdi-raw' : 'mdi-auto-fix'
            }
        })
    }
    return actions
})
const formattedValue = computed<string>(() => {
    try {
        return dataGridService.formatEntityPropertyValue(props.value, props.codeLanguage, prettyPrint.value)
    } catch (e: any) {
        console.error(e)
        return `Error: Failed to format value as ${props.codeLanguage}. \r\n\r\n` + (e?.message ? `${e.message}.` : '')
    }
})
const codeBlockExtensions = computed<Extension[]>(() => {
    if (!formattedValue.value) {
        return []
    }
    switch (props.codeLanguage) {
        case EntityPropertyValueSupportedCodeLanguage.Raw:
            return []
        case EntityPropertyValueSupportedCodeLanguage.Json:
            return [json()]
        case EntityPropertyValueSupportedCodeLanguage.Xml:
            return [xml()]
        default:
            toaster.error(new UnexpectedError(undefined, 'Unsupported code language.'))
            return []
    }
})

function handleActionClick(action: any) {
    switch (action) {
        case ActionType.Copy:
            copyRenderedValue()
            break
        case ActionType.PrettyPrint:
            prettyPrint.value = !prettyPrint.value
            break
    }
}

function copyRenderedValue() {
    navigator.clipboard.writeText(formattedValue.value).then(() => {
        toaster.info('Copied to clipboard.')
    }).catch(() => {
        toaster.error(new UnexpectedError(undefined, 'Failed to copy to clipboard.'))
    })
}
</script>

<template>
    <LabEditorDataGridGridCellDetailValueRenderer
        :fill-space="fillSpace"
        :actions="actions"
        @click:action="handleActionClick"
    >
        <VPreviewEditor
            :model-value="formattedValue"
            :additional-extensions="codeBlockExtensions"
        />
    </LabEditorDataGridGridCellDetailValueRenderer>
</template>

<style lang="scss" scoped>

</style>

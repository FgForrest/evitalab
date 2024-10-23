<script setup lang="ts">
/**
 * Entity property value renderer that tries to render the value in a code editor.
 */

import { computed, ComputedRef, ref } from 'vue'
import { Extension } from '@codemirror/state'
import { json } from '@codemirror/lang-json'
import { xml } from '@codemirror/lang-xml'
import { useI18n } from 'vue-i18n'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { EntityViewerService, useEntityViewerService } from '@/modules/entity-viewer/viewer/service/EntityViewerService'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import {
    EntityPropertyValueSupportedCodeLanguage
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPropertyValueSupportedCodeLanguage'
import {
    CodeDetailRendererActionType
} from '@/modules/entity-viewer/viewer/model/entity-grid/detail-renderer/CodeDetailRendererActionType'
import { MenuAction } from '@/modules/base/model/menu/MenuAction'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import ValueDetailRenderer
    from '@/modules/entity-viewer/viewer/component/entity-grid/detail-renderer/ValueDetailRenderer.vue'
import VPreviewEditor from '@/modules/code-editor/component/VPreviewEditor.vue'

const toaster: Toaster = useToaster()
const entityViewerService: EntityViewerService = useEntityViewerService()
const { t } = useI18n()

const props = withDefaults(defineProps<{
    value: EntityPropertyValue | EntityPropertyValue[],
    codeLanguage?: EntityPropertyValueSupportedCodeLanguage,
    fillSpace?: boolean
}>(), {
    codeLanguage: EntityPropertyValueSupportedCodeLanguage.Raw,
    fillSpace: true
})

const prettyPrint = ref<boolean>(true)

const actions: ComputedRef<Map<CodeDetailRendererActionType, MenuAction<CodeDetailRendererActionType>>> = computed(() => createActions())
const actionList: ComputedRef<MenuAction<CodeDetailRendererActionType>[]> = computed(() => Array.from(actions.value.values()))

const formattedValue = computed<string>(() => {
    try {
        return entityViewerService.formatEntityPropertyValue(props.value, props.codeLanguage, prettyPrint.value)
    } catch (e: any) {
        console.error(e)
        return t(
            'entityViewer.grid.codeRenderer.placeholder.failedToFormatValue',
            {
                codeLanguage: props.codeLanguage,
                message: e?.message ? `${e.message}.` : ''
            }
        )
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
            toaster.error(new UnexpectedError(t('entityViewer.grid.codeRenderer.notification.unsupportedCodeLanguage')))
            return []
    }
})

function handleActionClick(action: any) {
    actions.value.get(action as CodeDetailRendererActionType)?.execute()
}

function copyRenderedValue() {
    navigator.clipboard.writeText(formattedValue.value).then(() => {
        toaster.info(t('common.notification.copiedToClipboard'))
    }).catch(() => {
        toaster.error(new UnexpectedError(t('common.notification.failedToCopyToClipboard')))
    })
}

function createActions(): Map<CodeDetailRendererActionType, MenuAction<CodeDetailRendererActionType>> {
    const actions: Map<CodeDetailRendererActionType, MenuAction<CodeDetailRendererActionType>> = new Map()
    actions.set(
        CodeDetailRendererActionType.Copy,
        new MenuAction<CodeDetailRendererActionType>(
            CodeDetailRendererActionType.Copy,
            t('common.button.copy'),
            'mdi-content-copy',
            () => copyRenderedValue()
        )
    )
    if (props.codeLanguage !== EntityPropertyValueSupportedCodeLanguage.Raw) {
        actions.set(
            CodeDetailRendererActionType.PrettyPrint,
            new MenuAction<CodeDetailRendererActionType>(
                CodeDetailRendererActionType.PrettyPrint,
                prettyPrint.value ? t('entityViewer.grid.renderer.button.displayRawValue') : t('entityViewer.grid.renderer.button.prettyPrintValue'),
                prettyPrint.value ? 'mdi-raw' : 'mdi-auto-fix',
                () => prettyPrint.value = !prettyPrint.value
            )
        )
    }
    return actions
}
</script>

<template>
    <ValueDetailRenderer
        :fill-space="fillSpace"
        :actions="actionList"
        @click:action="handleActionClick"
    >
        <VPreviewEditor
            :model-value="formattedValue"
            :additional-extensions="codeBlockExtensions"
        />
    </ValueDetailRenderer>
</template>

<style lang="scss" scoped>

</style>

<script setup lang="ts">
/**
 * Viewer tab for all evitaLab supported keybindings.
 */

import { useI18n } from 'vue-i18n'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import { TabComponentEvents } from '@/modules/workspace/tab/model/TabComponentEvents'
import { Property } from '@/modules/base/model/properties-table/Property'
import { Command } from '@/modules/keymap/model/Command'
import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue'
import { KeywordValue } from '@/modules/base/model/properties-table/KeywordValue'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import VTabToolbar from '@/modules/base/component/VTabToolbar.vue'
import VPropertiesTable from '@/modules/base/component/VPropertiesTable.vue'
import Immutable from 'immutable'
import { TabComponentExpose } from '@/modules/workspace/tab/model/TabComponentExpose'
import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import { SystemSubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SystemSubjectPath'
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'
import { KeymapViewerTabDefinition } from '@/modules/keymap/viewer/workspace/model/KeymapViewerTabDefinition'

const keymap: Keymap = useKeymap()
const { t } = useI18n()

const emit = defineEmits<TabComponentEvents>()
defineExpose<TabComponentExpose>({
    path(): SubjectPath | undefined {
        return new SystemSubjectPath([
            SubjectPathItem.significant(
                KeymapViewerTabDefinition.icon(),
                t('keymapViewer.title')
            )
        ])
    }
})

const title: Immutable.List<string> = Immutable.List.of(t('keymapViewer.title'))

type Section = string
type Subsection = string
const defaultSubsection: Subsection = '_default' // used for actions without a subsection
const allBindings: Map<Section, Map<Subsection, Property[]>> = new Map()
keymap.prettyPrintAll().forEach((shortcut: string, command: Command) => {
    const parts: string[] = command.split('.')

    const section: Section = parts[0]
    let sectionMap = allBindings.get(section)
    if (sectionMap == undefined) {
        sectionMap = new Map<Subsection, Property[]>()
        allBindings.set(section, sectionMap)
    }

    if (parts.length === 2) {
        let subsectionList = sectionMap.get(defaultSubsection)
        if (subsectionList == undefined) {
            subsectionList = []
            sectionMap.set(defaultSubsection, subsectionList)
        }

        subsectionList.push(new Property(
            t(`command.${command}`),
            new PropertyValue(new KeywordValue(shortcut))
        ))
    } else if (parts.length === 3) {
        const subsection: Subsection = parts[1]
        let subsectionList = sectionMap.get(subsection)
        if (subsectionList == undefined) {
            subsectionList = []
            sectionMap.set(subsection, subsectionList)
        }

        subsectionList.push(new Property(
            t(`command.${command}`),
            new PropertyValue(new KeywordValue(shortcut))
        ))
    } else {
        throw new UnexpectedError(`Unsupported command syntax '${command}'.`)
    }
})

emit('ready')
</script>

<template>
    <div class="keymap-viewer">
        <VTabToolbar
            :prepend-icon="KeymapViewerTabDefinition.icon()"
            :title="title"
        />

        <VSheet class="keymap-viewer__body">
            <VSheet class="container">
                <VExpansionPanels multiple>
                    <VExpansionPanel
                        v-for="[section, subsections] in allBindings"
                        :key="section"
                    >
                        <VExpansionPanelTitle>
                            {{ t(`command.${section}._title`) }}
                        </VExpansionPanelTitle>
                        <VExpansionPanelText>
                            <VPropertiesTable
                                v-for="[subsection, actions] in subsections"
                                :key="subsection"
                                :title="subsection != defaultSubsection ? t(`command.${section}.${subsection}._title`) : undefined"
                                :properties="actions"
                            />
                        </VExpansionPanelText>
                    </VExpansionPanel>
                </VExpansionPanels>
            </VSheet>
        </VSheet>
    </div>
</template>

<style lang="scss" scoped>
.keymap-viewer {
    display: grid;
    grid-template-rows: 3rem 1fr;

    &__header {
        z-index: 100;
    }

    &__body {
        position: relative;
    }
}

.container {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    padding: 1rem;
    overflow-y: auto;
}
</style>

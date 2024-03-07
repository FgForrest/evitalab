<script setup lang="ts">
/**
 * Viewer tab for all evitaLab supported keybindings.
 */

import VTabToolbar from '@/components/base/VTabToolbar.vue'
import { Keymap, useKeymap } from '@/model/editor/keymap/Keymap'
import { KeywordValue, Property, PropertyValue } from '@/model/properties-table'
import VPropertiesTable from '@/components/base/VPropertiesTable.vue'
import { Command } from '@/model/editor/keymap/Command'
import { UnexpectedError } from '@/model/lab'
import { TabComponentEvents } from '@/model/editor/tab/TabComponentEvents'

const keymap: Keymap = useKeymap()

const emit = defineEmits<TabComponentEvents>()

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

        const action: string = parts[1]
        subsectionList.push({
            name: action, // todo this action will be replaced by full key when we implement the i18n
            value: new PropertyValue(new KeywordValue(shortcut))
        })
    } else if (parts.length === 3) {
        const subsection: Subsection = parts[1]
        let subsectionList = sectionMap.get(subsection)
        if (subsectionList == undefined) {
            subsectionList = []
            sectionMap.set(subsection, subsectionList)
        }

        const action: string = parts[2]
        subsectionList.push({
            name: action, // todo this action will be replaced by full key when we implement the i18n
            value: new PropertyValue(new KeywordValue(shortcut))
        })
    } else {
        throw new UnexpectedError(undefined, `Unsupported command syntax '${command}'.`)
    }
})

emit('ready')
</script>

<template>
    <div class="keymap-viewer">
        <VTabToolbar
            prepend-icon="mdi-keyboard-outline"
            :path="['Keymap']"
        />

        <VSheet class="keymap-viewer__body">
            <VSheet class="container">
                <VExpansionPanels multiple>
                    <VExpansionPanel
                        v-for="[section, subsections] in allBindings"
                        :key="section"
                    >
                        <VExpansionPanelTitle>
                            {{ section }}
                        </VExpansionPanelTitle>
                        <VExpansionPanelText>
                            <VPropertiesTable
                                v-for="[subsection, actions] in subsections"
                                :key="subsection"
                                :title="subsection != defaultSubsection ? subsection : undefined"
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

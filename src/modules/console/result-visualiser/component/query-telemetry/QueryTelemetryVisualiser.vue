<script setup lang="ts">
/**
 * Query telemetry visualiser: a tab strip inside the result visualiser with a pinned Overview (header, phase share
 * bar, flamegraph, query metrics) and closable Steps / Plan / Group tabs opened from it. A tab is identified by
 * `(kind, stepId)` (plus the group key of a Group tab); opening an already open identity activates it. The tab list
 * lives in the {@link QueryTelemetryVisualiserState} of the query result, so it survives remounting.
 */
import { computed, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
    ParsedQueryTelemetry,
    PartialQueryTelemetrySelection,
    type QueryTelemetryParseResult
} from '@/modules/console/result-visualiser/model/query-telemetry/QueryTelemetryParseResult'
import type {
    VisualisedQueryTelemetry
} from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedQueryTelemetry'
import type {
    VisualisedTelemetryStep
} from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedTelemetryStep'
import { TelemetryTab, TelemetryTabKind } from '@/modules/console/result-visualiser/model/query-telemetry/TelemetryTab'
import type {
    QueryTelemetryVisualiserState
} from '@/modules/console/result-visualiser/model/query-telemetry/QueryTelemetryVisualiserState'
import type {
    VisualisedFormulaPlanNode
} from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedFormulaPlanNode'
import { telemetryStepLabel } from '@/modules/console/result-visualiser/service/query-telemetry/telemetryStepLabel'
import {
    visualiseQueryTelemetry
} from '@/modules/console/result-visualiser/service/query-telemetry/visualiseQueryTelemetry'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'
import VisualiserNote from '@/modules/console/result-visualiser/component/VisualiserNote.vue'
import TelemetryOverview from './TelemetryOverview.vue'
import TelemetryStepsView from './TelemetryStepsView.vue'
import TelemetryPlanView from './TelemetryPlanView.vue'
import TelemetryFormulaGroupView from './TelemetryFormulaGroupView.vue'

const { t } = useI18n()

const props = defineProps<{
    parseResult: QueryTelemetryParseResult,
    /**
     * Open tabs and filters of this query result's telemetry.
     */
    state: QueryTelemetryVisualiserState
}>()

const telemetry = computed<VisualisedQueryTelemetry | undefined>(() => {
    if (props.parseResult instanceof ParsedQueryTelemetry) {
        return visualiseQueryTelemetry(props.parseResult)
    }
    return undefined
})

const partialSelectionNote = computed<string | undefined>(() => {
    if (!(props.parseResult instanceof PartialQueryTelemetrySelection)) {
        return undefined
    }
    const fields: string = props.parseResult.missingRequiredSelections.map(it => `\`${it}\``).join(', ')
    return t('resultVisualizer.queryTelemetryVisualiser.help.partialSelection', { fields })
})

const overviewTab: TelemetryTab = TelemetryTab.overview()
const tabs: Ref<TelemetryTab[]> = props.state.tabs
const activeTabKey: Ref<string> = props.state.activeTabKey
const hideNotComputed: Ref<boolean> = props.state.hideNotComputed

const activeTab = computed<TelemetryTab>(() =>
    tabs.value.find(it => it.key === activeTabKey.value) ?? overviewTab
)
const activeStep = computed<VisualisedTelemetryStep | undefined>(() => {
    const stepId: string | undefined = activeTab.value.stepId
    return stepId == undefined ? undefined : telemetry.value?.getStep(stepId)
})

/**
 * Ids of the steps that have an open Steps or Plan tab, outlined in the flamegraph.
 */
const openStepIds = computed<ReadonlySet<string>>(() =>
    new Set(tabs.value.map(it => it.stepId).filter((it): it is string => it != undefined))
)

function openTab(kind: TelemetryTabKind, stepId: string, group?: VisualisedFormulaPlanNode): void {
    const tab: TelemetryTab = new TelemetryTab(kind, stepId, group)
    if (!tabs.value.some(it => it.key === tab.key)) {
        tabs.value = [...tabs.value, tab]
    }
    activeTabKey.value = tab.key
}

function openGroup(group: VisualisedFormulaPlanNode): void {
    const stepId: string | undefined = activeTab.value.stepId
    if (stepId != undefined) {
        openTab(TelemetryTabKind.Group, stepId, group)
    }
}

function closeTab(tab: TelemetryTab): void {
    const index: number = tabs.value.findIndex(it => it.key === tab.key)
    if (index <= 0) {
        return
    }
    const neighbour: TelemetryTab | undefined = tabs.value[index - 1]
    tabs.value = tabs.value.filter(it => it.key !== tab.key)
    if (activeTabKey.value === tab.key) {
        activeTabKey.value = neighbour?.key ?? overviewTab.key
    }
}

function tabStep(tab: TelemetryTab): VisualisedTelemetryStep | undefined {
    return tab.stepId == undefined ? undefined : telemetry.value?.getStep(tab.stepId)
}

/**
 * Short label of the tab's step; when another open tab of the same kind shows a step with the same label (e.g. the
 * top-level and a nested `FILTER`), the parent's label is prepended.
 */
function tabStepTitle(tab: TelemetryTab): string {
    const step: VisualisedTelemetryStep | undefined = tabStep(tab)
    if (step == undefined) {
        return ''
    }
    const label: string = telemetryStepLabel(step)
    const ambiguous: boolean = tabs.value.some(other => {
        if (other.kind !== tab.kind || other.key === tab.key) {
            return false
        }
        const otherStep: VisualisedTelemetryStep | undefined = tabStep(other)
        return otherStep != undefined && telemetryStepLabel(otherStep) === label
    })
    const parent: VisualisedTelemetryStep | undefined =
        ambiguous && step.parentId != undefined ? telemetry.value?.getStep(step.parentId) : undefined
    return parent == undefined
        ? label
        : t('resultVisualizer.queryTelemetryVisualiser.tab.nestedTitle', { parent: telemetryStepLabel(parent), title: label })
}

function tabTitle(tab: TelemetryTab): string {
    switch (tab.kind) {
        case TelemetryTabKind.Steps:
            return t('resultVisualizer.queryTelemetryVisualiser.tab.steps', { title: tabStepTitle(tab) })
        case TelemetryTabKind.Plan:
            return t('resultVisualizer.queryTelemetryVisualiser.tab.plan', { title: tabStepTitle(tab) })
        case TelemetryTabKind.Group:
            return t('resultVisualizer.queryTelemetryVisualiser.tab.group', {
                count: tab.group?.count ?? 0,
                title: tab.group?.description ?? ''
            })
        default:
            return t('resultVisualizer.queryTelemetryVisualiser.tab.overview')
    }
}

function tabColor(tab: TelemetryTab): string | undefined {
    if (tab.kind === TelemetryTabKind.Plan || tab.kind === TelemetryTabKind.Group) {
        return 'rgb(var(--v-theme-primary-lightest))'
    }
    const step: VisualisedTelemetryStep | undefined = tabStep(tab)
    return step == undefined ? undefined : `var(--telemetry-${step.group})`
}
</script>

<template>
    <div class="query-telemetry">
        <VisualiserNote v-if="partialSelectionNote != undefined" :note="partialSelectionNote" />

        <template v-else-if="telemetry != undefined">
            <VTabs
                v-model="activeTabKey"
                density="compact"
                show-arrows
                class="query-telemetry__tabs"
            >
                <VTab
                    v-for="tab in tabs"
                    :key="tab.key"
                    :value="tab.key"
                    class="query-telemetry__tab"
                    @mousedown.middle="tab.closable && closeTab(tab)"
                >
                    <span
                        v-if="tabColor(tab) != undefined"
                        class="query-telemetry__tab-dot"
                        :style="{ background: tabColor(tab) }"
                    />
                    <span class="query-telemetry__tab-title">{{ tabTitle(tab) }}</span>
                    <VBtn
                        v-if="tab.closable"
                        icon
                        variant="plain"
                        density="compact"
                        size="small"
                        class="ml-1"
                        @click.stop="closeTab(tab)"
                    >
                        <VIcon>mdi-close</VIcon>
                        <VActionTooltip>
                            {{ t('resultVisualizer.queryTelemetryVisualiser.button.closeTab') }}
                        </VActionTooltip>
                    </VBtn>
                </VTab>
            </VTabs>

            <!--
                Only the active tab is mounted, switched by `v-if`: a nested `VWindow` would inherit the workspace's
                absolute-fill `.v-window` rule and leave the page flow.
            -->
            <div class="query-telemetry__body">
                <TelemetryOverview
                    v-if="activeTab.kind === TelemetryTabKind.Overview"
                    :telemetry="telemetry"
                    :open-step-ids="openStepIds"
                    @open-steps="stepId => openTab(TelemetryTabKind.Steps, stepId)"
                    @open-plan="stepId => openTab(TelemetryTabKind.Plan, stepId)"
                />
                <TelemetryStepsView
                    v-else-if="activeTab.kind === TelemetryTabKind.Steps && activeStep != undefined"
                    :key="activeTab.key"
                    :telemetry="telemetry"
                    :step="activeStep"
                    @open-plan="stepId => openTab(TelemetryTabKind.Plan, stepId)"
                />
                <TelemetryPlanView
                    v-else-if="activeTab.kind === TelemetryTabKind.Plan && activeStep != undefined"
                    :key="activeTab.key"
                    v-model:hide-not-computed="hideNotComputed"
                    :telemetry="telemetry"
                    :step="activeStep"
                    @open-group="openGroup"
                />
                <TelemetryFormulaGroupView
                    v-else-if="activeTab.kind === TelemetryTabKind.Group && activeStep != undefined && activeTab.group != undefined"
                    :key="activeTab.key"
                    :telemetry="telemetry"
                    :step="activeStep"
                    :group="activeTab.group"
                />
            </div>
        </template>
    </div>
</template>

<style lang="scss" scoped>
@use "./telemetry-colors" as *;

.query-telemetry {
    @include telemetry-custom-properties;

    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    &__tabs {
        flex: 0 0 auto;
        border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
    }

    &__tab {
        text-transform: none;
        letter-spacing: normal;
    }

    &__tab-dot {
        flex: 0 0 auto;
        width: 0.5rem;
        height: 0.5rem;
        margin-right: 0.5rem;
        border-radius: 50%;
    }

    &__tab-title {
        max-width: 16rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__body {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
    }
}
</style>

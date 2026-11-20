<script setup lang="ts">
/**
 * Searchable, grouped picker of the endpoints of a REST API instance. The search matches the group, the display
 * name, the operation ids and the paths; method chips and a "with body" chip filter the list. Localized twins are a
 * single row — the locale is switched outside of the picker.
 */
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { List as ImmutableList } from 'immutable'
import { RestHttpMethod } from '@/modules/database-driver/connector/rest/model/RestHttpMethod'
import { RestOperationCatalog } from '@/modules/rest-console/console/model/RestOperationCatalog'
import { RestOperationGroup } from '@/modules/rest-console/console/model/RestOperationGroup'
import { RestEndpoint } from '@/modules/rest-console/console/model/RestEndpoint'
import {
    resolveRestEndpointDisplayName,
    resolveRestGroupDisplayName
} from '@/modules/rest-console/console/service/restEndpointDisplayName'
import RestMethodChip from '@/modules/rest-console/console/component/RestMethodChip.vue'
import { moveEndpointHighlight } from '@/modules/rest-console/console/service/endpointPickerNavigation'
import {
    matchesEndpointSearchTerms,
    splitEndpointSearchTerms
} from '@/modules/rest-console/console/service/endpointPickerSearch'

const { t } = useI18n()

const props = defineProps<{
    catalog: RestOperationCatalog
    modelValue: RestEndpoint
    /**
     * Whether the localized variant is currently selected, which decides the path shown in the activator.
     */
    localized: boolean
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: RestEndpoint): void
}>()

/**
 * Endpoints of a group that pass the current filters, as shown in the list.
 */
interface FilteredGroup {
    readonly group: RestOperationGroup
    readonly endpoints: ImmutableList<RestEndpoint>
}

const menuOpen = ref<boolean>(false)
// a cleared field is `null`
const search = ref<string | null>('')
const methodFilter = ref<RestHttpMethod[]>([])
const withBodyFilter = ref<boolean>(false)
const searchFieldRef = ref<{ focus: () => void } | undefined>()
const listRef = ref<{ $el: HTMLElement } | undefined>()
// the activator slot's props carry Vuetify's own `ref`, so the activator element is read from the menu instead
const menuRef = ref<{ activatorEl: HTMLElement | undefined } | undefined>()
const dropdownRef = ref<{ $el: HTMLElement } | undefined>()
/**
 * Position of the keyboard-highlighted row among all filtered endpoints (across groups).
 */
const highlightedIndex = ref<number>(0)

const availableMethods = computed<RestHttpMethod[]>(() => {
    const methods: Set<RestHttpMethod> = new Set(props.catalog.endpoints.map(endpoint => endpoint.method))
    return Object.values(RestHttpMethod).filter(method => methods.has(method))
})

const filteredGroups = computed<FilteredGroup[]>(() => {
    const terms: string[] = splitEndpointSearchTerms(search.value)
    return props.catalog.groups
        .map(group => ({
            group,
            endpoints: group.endpoints.filter(endpoint => matches(group, endpoint, terms))
        }))
        .filter(filtered => !filtered.endpoints.isEmpty())
        .toArray()
})

/**
 * The filtered endpoints in display order, which the keyboard navigation walks through.
 */
const filteredEndpoints = computed<RestEndpoint[]>(() =>
    filteredGroups.value.flatMap(filtered => filtered.endpoints.toArray())
)
const highlightedEndpoint = computed<RestEndpoint | undefined>(() => filteredEndpoints.value[highlightedIndex.value])

watch([search, methodFilter, withBodyFilter, () => props.catalog], () => {
    highlightedIndex.value = 0
})

const activatorGroupLabel = computed<string>(() => {
    const group: RestOperationGroup | undefined = props.catalog.groups.find(it => it.name === props.modelValue.groupName)
    return group != undefined ? resolveRestGroupDisplayName(group) : props.modelValue.groupName
})

const activatorPath = computed<string>(() => props.modelValue.variant(props.localized ? '' : undefined).pathTemplate)

function matches(group: RestOperationGroup, endpoint: RestEndpoint, terms: string[]): boolean {
    if (methodFilter.value.length > 0 && !methodFilter.value.includes(endpoint.method)) {
        return false
    }
    if (withBodyFilter.value && !endpoint.hasBody) {
        return false
    }
    return matchesEndpointSearchTerms([
        resolveRestGroupDisplayName(group),
        resolveRestEndpointDisplayName(endpoint),
        endpoint.nonLocalized?.operationId,
        endpoint.localized?.operationId,
        endpoint.nonLocalized?.pathTemplate,
        endpoint.localized?.pathTemplate
    ], terms)
}

function displayedPath(endpoint: RestEndpoint): string {
    return endpoint.hasLocalizedVariant && endpoint.nonLocalized != undefined
        ? `[/{locale}]${endpoint.nonLocalized.pathTemplate}`
        : endpoint.primary.pathTemplate
}

function toggleMethod(method: RestHttpMethod): void {
    methodFilter.value = methodFilter.value.includes(method)
        ? methodFilter.value.filter(it => it !== method)
        : [...methodFilter.value, method]
}

function select(endpoint: RestEndpoint): void {
    emit('update:modelValue', endpoint)
    menuOpen.value = false
}

function selectHighlighted(): void {
    if (highlightedEndpoint.value != undefined) {
        select(highlightedEndpoint.value)
    }
}

function moveHighlight(direction: 'up' | 'down'): void {
    highlightedIndex.value = moveEndpointHighlight(highlightedIndex.value, direction, filteredEndpoints.value.length)
    nextTick(() => {
        listRef.value?.$el.querySelector('.rest-endpoint-picker__item--highlighted')
            ?.scrollIntoView({ block: 'nearest' })
    })
}

/**
 * Closes the picker on a press anywhere outside of it.
 *
 * Vuetify closes a menu on an outside click only while the menu is the top-most overlay, and the selects and
 * comboboxes of the parameter form open their own menu already on mousedown — so a click on such a parameter left
 * the picker open underneath the new menu. Reacting to the press itself, in the capture phase, closes the picker
 * before any other overlay takes over.
 */
function closeOnOutsidePress(e: PointerEvent): void {
    const target: Node | null = e.target instanceof Node ? e.target : null
    if (target == null) {
        return
    }
    if (dropdownRef.value?.$el.contains(target) || menuRef.value?.activatorEl?.contains(target)) {
        return
    }
    menuOpen.value = false
}

watch(menuOpen, (open: boolean) => {
    if (open) {
        document.addEventListener('pointerdown', closeOnOutsidePress, true)
    } else {
        document.removeEventListener('pointerdown', closeOnOutsidePress, true)
    }
})
onUnmounted(() => document.removeEventListener('pointerdown', closeOnOutsidePress, true))

// every opening (click or keyboard) starts on the current endpoint when the filters still show it, otherwise on the
// first row
watch(menuOpen, (open: boolean) => {
    if (open) {
        const currentIndex: number = filteredEndpoints.value.indexOf(props.modelValue)
        highlightedIndex.value = currentIndex >= 0 ? currentIndex : 0
    }
})

/**
 * Activator props without VMenu's own keyboard handling: its ArrowDown/ArrowUp open the menu and then move the focus
 * past the search field into the list. The (focusable) activator opens the menu on ArrowDown/ArrowUp/Enter/Space
 * itself instead, and {@link focusSearch} puts the caret into the search field.
 */
function activatorProps(menuProps: Record<string, unknown>): Record<string, unknown> {
    return { ...menuProps, onKeydown: undefined }
}

/**
 * Moves the caret into the search field once the dropdown is rendered, so that typing and the arrow keys work right
 * after opening. Earlier than `after-enter` the field does not exist yet and the focus call is lost.
 */
function focusSearch(): void {
    searchFieldRef.value?.focus()
}

/**
 * Opens the picker.
 */
function open(): void {
    menuOpen.value = true
}

defineExpose<{
    open: () => void
}>({
    open
})
</script>

<template>
    <VMenu
        ref="menuRef"
        v-model="menuOpen"
        :close-on-content-click="false"
        location="bottom start"
        :max-height="512"
        @after-enter="focusSearch"
    >
        <template #activator="{ props: menuProps }">
            <VCard
                v-bind="activatorProps(menuProps)"
                variant="outlined"
                tabindex="0"
                role="button"
                @keydown.down.prevent="open"
                @keydown.up.prevent="open"
                @keydown.enter.prevent="open"
                @keydown.space.prevent="open"
                class="rest-endpoint-picker__activator"
            >
                <RestMethodChip :method="modelValue.method" />
                <div class="rest-endpoint-picker__activator-text">
                    <span class="text-body-2">
                        {{ activatorGroupLabel }} · {{ resolveRestEndpointDisplayName(modelValue) }}
                    </span>
                    <span class="text-caption text-disabled rest-endpoint-picker__path">{{ activatorPath }}</span>
                </div>
                <VIcon>mdi-chevron-down</VIcon>
            </VCard>
        </template>

        <VCard ref="dropdownRef" class="rest-endpoint-picker__dropdown">
            <div class="rest-endpoint-picker__filters">
                <VTextField
                    ref="searchFieldRef"
                    v-model="search"
                    :placeholder="t('restConsole.picker.search')"
                    :hint="t('restConsole.picker.searchHint')"
                    prepend-inner-icon="mdi-magnify"
                    density="compact"
                    variant="outlined"
                    clearable
                    persistent-hint
                    bg-color="primary-dark"
                    @keydown.enter.prevent.stop="selectHighlighted"
                    @keydown.down.prevent="moveHighlight('down')"
                    @keydown.up.prevent="moveHighlight('up')"
                />
                <div class="rest-endpoint-picker__chips">
                    <VChip
                        v-for="method in availableMethods"
                        :key="method"
                        :variant="methodFilter.includes(method) ? 'flat' : 'outlined'"
                        size="small"
                        label
                        @click="toggleMethod(method)"
                    >
                        {{ method }}
                    </VChip>
                    <VChip
                        :variant="withBodyFilter ? 'flat' : 'outlined'"
                        size="small"
                        label
                        @click="withBodyFilter = !withBodyFilter"
                    >
                        {{ t('restConsole.picker.withBody') }}
                    </VChip>
                </div>
            </div>

            <VDivider />

            <VList ref="listRef" density="compact" class="rest-endpoint-picker__list">
                <template v-for="filtered in filteredGroups" :key="filtered.group.name">
                    <VListSubheader>{{ resolveRestGroupDisplayName(filtered.group) }}</VListSubheader>
                    <VListItem
                        v-for="endpoint in filtered.endpoints"
                        :key="endpoint.id"
                        :active="endpoint.id === modelValue.id"
                        :class="{ 'rest-endpoint-picker__item--highlighted': endpoint === highlightedEndpoint }"
                        @click="select(endpoint)"
                    >
                        <template #prepend>
                            <RestMethodChip :method="endpoint.method" class="mr-3" />
                        </template>
                        <VListItemTitle>{{ resolveRestEndpointDisplayName(endpoint) }}</VListItemTitle>
                        <VListItemSubtitle class="rest-endpoint-picker__path">
                            {{ displayedPath(endpoint) }} · {{ endpoint.id }}
                        </VListItemSubtitle>
                        <template #append>
                            <VChip v-if="endpoint.hasLocalizedVariant" size="x-small" variant="outlined" label>
                                {{ t('restConsole.picker.localized') }}
                            </VChip>
                            <VChip v-else-if="endpoint.hasBody" size="x-small" variant="outlined" label>
                                {{ t('restConsole.picker.body') }}
                            </VChip>
                        </template>
                    </VListItem>
                </template>
                <VListItem v-if="filteredGroups.length === 0">
                    <VListItemSubtitle>{{ t('restConsole.picker.noMatch') }}</VListItemSubtitle>
                </VListItem>
            </VList>
        </VCard>
    </VMenu>
</template>

<style lang="scss" scoped>
.rest-endpoint-picker {
    &__activator {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 0.75rem;
        cursor: pointer;
    }

    &__activator-text {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: 0;
    }

    &__path {
        font-family: monospace;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__dropdown {
        display: flex;
        flex-direction: column;
        // VMenu stretches its overlay content to the activator width; a narrower card would leave an invisible
        // part of the overlay that swallows outside clicks and keeps the menu open
        width: 100%;
    }

    &__filters {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.75rem;
    }

    &__chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
    }

    &__list {
        overflow-y: auto;
    }

    &__item--highlighted {
        background: rgba(var(--v-theme-on-surface), 0.08);
    }
}
</style>

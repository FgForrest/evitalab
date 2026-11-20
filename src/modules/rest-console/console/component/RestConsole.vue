<script setup lang="ts">
/**
 * REST console. Calls the operations of an evitaDB REST API instance (a catalog API or the system API): an endpoint
 * picker built from the OpenAPI specification, a generated parameter form, a JSON body editor with OpenAPI-aware
 * completion, and the raw or visualised response.
 */

import { Pane, Splitpanes } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

import { Compartment, type Extension } from '@codemirror/state'
import { EditorView } from 'codemirror'
import { json } from '@codemirror/lang-json'
import { List as ImmutableList } from 'immutable'

import { computed, onBeforeMount, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { asError } from '@/utils/error'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import { Command } from '@/modules/keymap/model/Command'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import type { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import type { TabComponentEvents } from '@/modules/workspace/tab/model/TabComponentEvents'
import type { TabComponentExpose } from '@/modules/workspace/tab/model/TabComponentExpose'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'
import {
    ConnectionSubjectPath
} from '@/modules/connection/workspace/status-bar/model/subject-path-status/ConnectionSubjectPath'
import ShareTabButton from '@/modules/workspace/tab/component/ShareTabButton.vue'
import VQueryEditor from '@/modules/code-editor/component/VQueryEditor.vue'
import VPreviewEditor from '@/modules/code-editor/component/VPreviewEditor.vue'
import { minifyJson, prettifyJson } from '@/modules/code-editor/service/formatJson'
import { DocumentFormattingMode } from '@/modules/code-editor/model/DocumentFormattingMode'
import ResultVisualiser from '@/modules/console/result-visualiser/component/ResultVisualiser.vue'
import { ResultVisualiserState } from '@/modules/console/result-visualiser/model/ResultVisualiserState'
import {
    QueryTelemetryInjectionError
} from '@/modules/console/exception/QueryTelemetryInjectionError'
import VTabToolbar from '@/modules/base/component/VTabToolbar.vue'
import VTabToolbarActionGroup from '@/modules/base/component/VTabToolbarActionGroup.vue'
import VExecuteQueryButton from '@/modules/base/component/VExecuteQueryButton.vue'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'
import VSideTabs from '@/modules/base/component/VSideTabs.vue'
import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'
import type { ExecuteQueryVariant } from '@/modules/base/model/ExecuteQueryVariant'
import { RestInstanceType } from '@/modules/database-driver/connector/rest/model/RestInstanceType'
import { RestHttpMethod } from '@/modules/database-driver/connector/rest/model/RestHttpMethod'
import { RestRequest } from '@/modules/database-driver/connector/rest/model/RestRequest'
import { RestResponse } from '@/modules/database-driver/connector/rest/model/RestResponse'
import { RestConsoleTabParams } from '@/modules/rest-console/console/workspace/model/RestConsoleTabParams'
import { RestConsoleTabData } from '@/modules/rest-console/console/workspace/model/RestConsoleTabData'
import { RestConsoleTabDefinition } from '@/modules/rest-console/console/workspace/model/RestConsoleTabDefinition'
import {
    type LoadedRestOpenApi,
    type RestCatalogLocales,
    RestConsoleService,
    useRestConsoleService
} from '@/modules/rest-console/console/service/RestConsoleService'
import {
    useRestResultVisualiserService
} from '@/modules/rest-console/console/result-visualiser/service/RestResultVisualiserService'
import type { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import { RestOperationCatalog } from '@/modules/rest-console/console/model/RestOperationCatalog'
import { RestEndpoint } from '@/modules/rest-console/console/model/RestEndpoint'
import { RestOperation } from '@/modules/rest-console/console/model/RestOperation'
import { RestParameter } from '@/modules/rest-console/console/model/RestParameter'
import {
    isRestParameterValueSet,
    type RestParameterValue,
    type RestParameterValues
} from '@/modules/rest-console/console/model/RestParameterValue'
import {
    buildRestRequest,
    isLocaleDrivenParameter,
    localePathParameterName
} from '@/modules/rest-console/console/service/buildRestRequest'
import { findInvalidRestParameters } from '@/modules/rest-console/console/service/validateRestParameterValue'
import {
    type InitialRestSelection,
    resolveInitialRestSelection
} from '@/modules/rest-console/console/service/resolveInitialRestSelection'
import { injectQueryTelemetry } from '@/modules/rest-console/console/service/injectQueryTelemetry'
import { type ParsedRestResult, parseRestResult } from '@/modules/rest-console/console/service/parseRestResultJson'
import { createRestConsoleHistoryKey } from '@/modules/rest-console/console/history/model/RestConsoleHistoryKey'
import type { RestConsoleHistoryKey } from '@/modules/rest-console/console/history/model/RestConsoleHistoryKey'
import {
    createRestConsoleHistoryRecord,
    type RestConsoleHistoryRecord
} from '@/modules/rest-console/console/history/model/RestConsoleHistoryRecord'
import RestConsoleHistory from '@/modules/rest-console/console/history/component/RestConsoleHistory.vue'
import RestEndpointPicker from '@/modules/rest-console/console/component/RestEndpointPicker.vue'
import RestParameterForm from '@/modules/rest-console/console/component/RestParameterForm.vue'
import ResultStatusBar from '@/modules/console/result-status/component/ResultStatusBar.vue'
import { ConsoleResultStatus } from '@/modules/console/result-status/model/ConsoleResultStatus'
import { createRestResultStatus } from '@/modules/rest-console/console/service/createRestResultStatus'

enum RequestTabType {
    Request = 'request',
    History = 'history',
    OpenApi = 'openApi'
}

enum ResultTabType {
    Raw = 'raw',
    Visualiser = 'visualiser'
}

/**
 * Body of a body operation nobody has written anything into yet.
 */
const defaultBody: string = '{\n  \n}'
/**
 * Value of the locale switch selecting the non-localized variant.
 */
const notLocalized: string = ''

const keymap: Keymap = useKeymap()
const restConsoleService: RestConsoleService = useRestConsoleService()
const workspaceService: WorkspaceService = useWorkspaceService()
const visualiserService: ResultVisualiserService = useRestResultVisualiserService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<TabComponentProps<RestConsoleTabParams, RestConsoleTabData>>()
const emit = defineEmits<TabComponentEvents>()
defineExpose<TabComponentExpose>({
    path(): SubjectPath {
        const pathItems: SubjectPathItem[] = []
        if (props.params.dataPointer.instanceType !== RestInstanceType.System) {
            pathItems.push(SubjectPathItem.plain(props.params.dataPointer.catalogName))
        }
        pathItems.push(SubjectPathItem.significant(
            RestConsoleTabDefinition.icon(),
            t(`restConsole.instanceType.${props.params.dataPointer.instanceType}`)
        ))
        return new ConnectionSubjectPath(props.params.dataPointer.connection, pathItems)
    },
    retry(): void {
        initialize()
    }
})

const systemInstance: boolean = props.params.dataPointer.instanceType === RestInstanceType.System

const title: ImmutableList<string> = (() => {
    const title: string[] = []
    if (!systemInstance) {
        title.push(props.params.dataPointer.catalogName)
    }
    title.push(t(`restConsole.instanceType.${props.params.dataPointer.instanceType}`))
    return ImmutableList(title)
})()

/**
 * Path of the REST API instance on the server, shown in front of the operation path in the URL preview.
 */
const instanceBasePath: string = (() => {
    const instanceSegment: string = systemInstance
        ? 'system'
        : encodeURIComponent(props.params.dataPointer.catalogName)
    let restPath: string = '/rest'
    try {
        restPath = new URL(props.params.dataPointer.connection.restUrl).pathname.replace(/\/$/, '')
    } catch {
        // a relative or otherwise unparseable URL, the default REST path is the best guess
    }
    return `${restPath}/${instanceSegment}`
})()

const requestTab = ref<RequestTabType>(RequestTabType.Request)
const resultTab = ref<ResultTabType>(ResultTabType.Raw)

const queryPanelVisible = ref<boolean>(true)
const resultPanelVisible = ref<boolean>(props.params.executeOnOpen)
/**
 * Panel the caret currently sits in. Sticky — it only changes when the other panel takes focus, so clicking a
 * toolbar button cannot make that button disappear under the cursor.
 */
const focusedPanel = ref<'query' | 'result'>('query')
const bothPanelsHidden = computed<boolean>(() => !queryPanelVisible.value && !resultPanelVisible.value)
/**
 * The result panel starts hidden and opens itself when the first result arrives; later executions respect the
 * user's choice.
 */
let firstResultPending: boolean = true

const shareTabButtonRef = ref<InstanceType<typeof ShareTabButton> | undefined>()
const endpointPickerRef = ref<InstanceType<typeof RestEndpointPicker> | undefined>()

const initialized = ref<boolean>(false)
const loadedOpenApi = shallowRef<LoadedRestOpenApi | undefined>()
const operationCatalog = computed<RestOperationCatalog | undefined>(() => loadedOpenApi.value?.catalog)
const reloadingOpenApi = ref<boolean>(false)
const openApiChangeCallbackId: string = restConsoleService.registerOpenApiChangeCallback(
    props.params.dataPointer,
    async () => await reloadOpenApi()
)

const catalogLocales = shallowRef<RestCatalogLocales>({ byCollection: new Map(), all: ImmutableList() })

const selectedEndpoint = shallowRef<RestEndpoint | undefined>()
const selectedLocale = ref<string | undefined>()
const parameterValues = ref<RestParameterValues>({})
const bodyCode = ref<string>(props.data.body ?? defaultBody)

const endpointLocales = computed<ImmutableList<string>>(() => {
    const endpoint: RestEndpoint | undefined = selectedEndpoint.value
    if (endpoint == undefined) {
        return ImmutableList()
    }
    const fromSchema: ImmutableList<string> = restConsoleService.resolveEndpointLocales(endpoint, catalogLocales.value)
    if (fromSchema.size > 0) {
        return fromSchema
    }
    // the system API has no catalog schema, and a schema that could not be read must not leave the switch empty
    return endpoint.localized?.parameters
        .find(parameter => parameter.name === localePathParameterName)
        ?.enumValues ?? ImmutableList()
})
const effectiveLocale = computed<string | undefined>(() =>
    selectedEndpoint.value?.hasLocalizedVariant ? selectedLocale.value : undefined
)
const localeSwitchValue = computed<string>(() => effectiveLocale.value ?? notLocalized)
const selectedOperation = computed<RestOperation | undefined>(() =>
    selectedEndpoint.value?.variant(effectiveLocale.value)
)

const request = computed<RestRequest | undefined>(() => {
    const operation: RestOperation | undefined = selectedOperation.value
    if (operation == undefined) {
        return undefined
    }
    return buildRestRequest(operation, effectiveLocale.value, parameterValues.value, bodyCode.value)
})
const resolvedUrl = computed<string>(() => request.value == undefined
    ? ''
    : `${instanceBasePath}${request.value.pathWithQuery}`
)

const bodyEditorRef = ref<InstanceType<typeof VQueryEditor> | undefined>()
// the language support is swapped in place through a compartment so the extensions array stays stable and the
// editor is never remounted (which would discard its undo history)
const bodyEditorView = ref<EditorView>()
const bodyLanguageCompartment = new Compartment()
let bodyLanguageExtension: Extension = json()
const bodyExtensions: Extension[] = [bodyLanguageCompartment.of(bodyLanguageExtension)]

const historyRef = ref<InstanceType<typeof RestConsoleHistory> | undefined>()
const historyKey = computed<RestConsoleHistoryKey>(() => createRestConsoleHistoryKey(props.params.dataPointer))
const historyRecords = computed<RestConsoleHistoryRecord[]>(() => {
    return [...workspaceService.getTabHistoryRecords(historyKey.value)].reverse()
})

const openApiViewerRef = ref<InstanceType<typeof VPreviewEditor> | undefined>()
const openApiViewerInitialized = ref<boolean>(false)
const openApiCode = ref<string>('')
const openApiExtensions: Extension[] = [json()]

/**
 * Fills the OpenAPI viewer on its first opening only — pretty-printing the several megabytes large catalog
 * specification is not free, and most users never open the view.
 */
function initializeOpenApiViewer(): void {
    if (!openApiViewerInitialized.value && loadedOpenApi.value != undefined) {
        openApiCode.value = JSON.stringify(loadedOpenApi.value.openApi.document, undefined, 2)
        openApiViewerInitialized.value = true
    }
}

const loading = ref<boolean>(false)
const response = shallowRef<RestResponse | undefined>()
const executedOperation = shallowRef<RestOperation | undefined>()
const executedRequest = shallowRef<RestRequest | undefined>()

/**
 * Status of the last result, cleared when a request fails in transport so it never sits next to the error.
 */
const resultStatus = ref<ConsoleResultStatus | undefined>()

const rawResultEditorRef = ref<InstanceType<typeof VPreviewEditor> | undefined>()
const resultExtensions: Extension[] = [json()]
/**
 * The response body parsed once for both views, `undefined` when it is not JSON.
 */
const parsedResult = computed<ParsedRestResult | undefined>(() => {
    const bodyText: string | undefined = response.value?.bodyText
    if (bodyText == undefined || bodyText.length === 0) {
        return undefined
    }
    try {
        return parseRestResult(bodyText)
    } catch {
        return undefined
    }
})
/**
 * The response body pretty-printed for the raw view. Numbers are carried over as their original text, so nothing
 * the server sent is rounded; a body that is not JSON is shown as it is.
 */
const resultCode = computed<string>(() => parsedResult.value?.prettyText ?? response.value?.bodyText ?? '')

const resultVisualiserRef = ref<InstanceType<typeof ResultVisualiser> | undefined>()
// lives as long as the console tab, so that the visualiser keeps its view when it is remounted
const resultVisualiserState: ResultVisualiserState = new ResultVisualiserState()
const supportsVisualisation: boolean = !systemInstance
const visualisedResult = computed<unknown>(() => {
    if (!supportsVisualisation || response.value == undefined || !response.value.successful ||
        executedOperation.value == undefined || !executedOperation.value.isQuery) {
        return undefined
    }
    return parsedResult.value?.value
})

// only entity queries can collect query telemetry
const executeQueryVariants = computed<ExecuteQueryVariant[] | undefined>(() => {
    if (!supportsVisualisation || selectedOperation.value == undefined || !selectedOperation.value.isQuery) {
        return undefined
    }
    return [{
        command: Command.RestConsole_ExecuteQueryWithTelemetry,
        title: t('common.button.runWithTelemetry')
    }]
})

const currentData = computed<RestConsoleTabData>(() => {
    const operation: RestOperation | undefined = selectedOperation.value
    if (operation == undefined) {
        return props.data
    }
    return new RestConsoleTabData(
        operation.operationId,
        operation.method,
        operation.pathTemplate,
        effectiveLocale.value,
        valuesOf(operation),
        bodyCode.value
    )
})
watch(currentData, (data) => {
    emit('update:data', data)
})

const formattingAvailable = computed<boolean>(() =>
    queryPanelVisible.value &&
    focusedPanel.value === 'query' &&
    requestTab.value === RequestTabType.Request &&
    selectedOperation.value?.hasBody === true
)

/**
 * Values of the parameter form that belong to the operation and are set.
 */
function valuesOf(operation: RestOperation): RestParameterValues {
    const values: Record<string, RestParameterValue> = {}
    for (const parameter of operation.parameters) {
        const value: RestParameterValue | undefined = parameterValues.value[parameter.name]
        if (!isLocaleDrivenParameter(operation, parameter) && isRestParameterValueSet(value)) {
            values[parameter.name] = value
        }
    }
    return values
}

/**
 * Reformats the body as JSON. The new document is assigned to the bound model, which resets the caret.
 */
async function formatBody(mode: DocumentFormattingMode): Promise<void> {
    if (!formattingAvailable.value) {
        return
    }
    try {
        bodyCode.value = mode === DocumentFormattingMode.Prettify
            ? prettifyJson(bodyCode.value)
            : minifyJson(bodyCode.value)
    } catch (e) {
        await toaster.error(t('restConsole.notification.failedToFormatDocument'), asError(e))
    }
}

/**
 * Loads the specification and marks the tab ready. Any failure is reported to the tab framework, which offers a
 * retry instead of leaving the tab behind the loading screen.
 */
function initialize(): void {
    restConsoleService.getOpenApi(props.params.dataPointer)
        .then((loaded: LoadedRestOpenApi) => {
            loadedOpenApi.value = loaded
            applyInitialData(loaded.catalog)
            void loadCatalogLocales()
            void loadBodyLanguageSupport(loaded)

            initialized.value = true
            emit('ready')

            if (props.params.executeOnOpen) {
                executeRequest()
            }
        })
        .catch(error => {
            emit('error', asError(error))
        })
}

/**
 * Restores the request of the tab data. An operation that no longer exists falls back to the first endpoint and
 * keeps the body.
 */
function applyInitialData(catalog: RestOperationCatalog): void {
    const selection: InitialRestSelection = resolveInitialRestSelection(catalog, props.data)
    if (selection.unknownOperationId != undefined) {
        toaster.warning(t('restConsole.notification.unknownOperation', {
            operationId: selection.unknownOperationId
        })).then()
    }
    selectedEndpoint.value = selection.endpoint
    selectedLocale.value = selection.locale
    parameterValues.value = selection.parameters
    if (selection.body != undefined) {
        bodyCode.value = selection.body
    }
}

async function loadCatalogLocales(): Promise<void> {
    try {
        catalogLocales.value = await restConsoleService.getCatalogLocales(props.params.dataPointer)
    } catch (e) {
        await toaster.error(t('restConsole.notification.couldNotLoadLocales'), asError(e))
    }
    // a fresh console starts on the first locale, as the localized variants are the more useful ones
    if (props.data.operationId == undefined && selectedLocale.value == undefined) {
        selectedLocale.value = endpointLocales.value.first()
    }
}

async function loadBodyLanguageSupport(loaded: LoadedRestOpenApi): Promise<void> {
    try {
        bodyLanguageExtension = await restConsoleService.createBodyLanguageSupport(
            loaded.openApi,
            () => {
                const operation: RestOperation | undefined = selectedOperation.value
                return {
                    method: operation?.method ?? RestHttpMethod.Post,
                    pathTemplate: operation?.pathTemplate ?? '/'
                }
            }
        )
        applyBodyLanguage()
    } catch (e) {
        await toaster.error(t('restConsole.notification.couldNotLoadBodyCompletion'), asError(e))
    }
}

/**
 * Reconfigures the body editor's language compartment. Safe to call before the editor exists.
 */
function applyBodyLanguage(): void {
    bodyEditorView.value?.dispatch({
        effects: bodyLanguageCompartment.reconfigure(bodyLanguageExtension)
    })
}
watch(bodyEditorView, () => applyBodyLanguage())

/**
 * Picks up a changed specification while keeping the request being edited.
 */
async function reloadOpenApi(): Promise<void> {
    try {
        const loaded: LoadedRestOpenApi = await restConsoleService.getOpenApi(props.params.dataPointer)
        const operationId: string | undefined = selectedOperation.value?.operationId
        loadedOpenApi.value = loaded
        // keep the OpenAPI viewer in sync when the specification is reloaded after it was already displayed
        if (openApiViewerInitialized.value) {
            openApiCode.value = JSON.stringify(loaded.openApi.document, undefined, 2)
        }
        selectedEndpoint.value = (operationId != undefined
            ? loaded.catalog.findEndpointOfOperation(operationId)
            : undefined) ?? loaded.catalog.endpoints.first()
        await loadBodyLanguageSupport(loaded)
        // the specification is dropped together with the catalog schema, whose locales may have changed too
        await loadCatalogLocales()
    } catch (e) {
        await toaster.error(t('restConsole.notification.failedToReloadOpenApi'), asError(e))
    }
}

async function refreshOpenApi(): Promise<void> {
    reloadingOpenApi.value = true
    try {
        // downloads first; only a really changed specification triggers the registered change callback
        await restConsoleService.refreshOpenApi(props.params.dataPointer)
    } catch (e) {
        await toaster.error(t('restConsole.notification.failedToReloadOpenApi'), asError(e))
    } finally {
        reloadingOpenApi.value = false
    }
}

/**
 * Switches to another endpoint. Values of parameters with the same name and kind are kept, and so is the body —
 * nothing the user wrote is thrown away silently.
 */
function selectEndpoint(endpoint: RestEndpoint): void {
    const previousOperation: RestOperation | undefined = selectedOperation.value
    selectedEndpoint.value = endpoint
    if (endpoint.hasLocalizedVariant) {
        const locales: ImmutableList<string> = endpointLocales.value
        if (selectedLocale.value != undefined && !locales.includes(selectedLocale.value)) {
            selectedLocale.value = locales.first()
        } else if (selectedLocale.value == undefined && endpoint.nonLocalized == undefined) {
            selectedLocale.value = locales.first()
        }
    }
    parameterValues.value = keepCompatibleValues(previousOperation, endpoint)
}

function keepCompatibleValues(previousOperation: RestOperation | undefined, endpoint: RestEndpoint): RestParameterValues {
    if (previousOperation == undefined) {
        return {}
    }
    const newParameters: RestParameter[] = [
        ...(endpoint.nonLocalized?.parameters ?? []),
        ...(endpoint.localized?.parameters ?? [])
    ]
    const kept: Record<string, RestParameterValue> = {}
    for (const parameter of previousOperation.parameters) {
        const value: RestParameterValue | undefined = parameterValues.value[parameter.name]
        if (value != undefined &&
            newParameters.some(it => it.name === parameter.name && it.kind === parameter.kind)) {
            kept[parameter.name] = value
        }
    }
    return kept
}

function selectLocale(value: string | undefined): void {
    selectedLocale.value = value == undefined || value === notLocalized ? undefined : value
}

function pickHistoryRecord(record: RestConsoleHistoryRecord): void {
    const endpoint: RestEndpoint | undefined = operationCatalog.value?.findEndpointOfOperation(record.operationId)
    if (endpoint == undefined) {
        toaster.warning(t('restConsole.notification.unknownOperation', { operationId: record.operationId })).then()
    } else {
        selectedEndpoint.value = endpoint
        selectedLocale.value = endpoint.localized?.operationId === record.operationId ? record.locale : undefined
        parameterValues.value = { ...record.parameters }
    }
    if (record.body != undefined) {
        bodyCode.value = record.body
    }
    requestTab.value = RequestTabType.Request
    queryPanelVisible.value = true
    focusRequestEditor()
}

function clearHistory(): void {
    workspaceService.clearTabHistory(historyKey.value)
}

/**
 * Sends the request. With `withTelemetry`, a copy of the body requesting the query telemetry is sent instead,
 * while the editor content and the history record keep the body as written. Error statuses are a regular result;
 * only transport failures are reported by a toaster.
 */
async function executeRequest(withTelemetry: boolean = false): Promise<void> {
    const operation: RestOperation | undefined = selectedOperation.value
    if (operation == undefined) {
        return
    }
    const invalidParameters: string[] = findInvalidRestParameters(operation, effectiveLocale.value, parameterValues.value)
    if (invalidParameters.length > 0) {
        await toaster.warning(t('restConsole.notification.invalidParameters', {
            parameters: invalidParameters.join(', ')
        }))
        return
    }

    const writtenBody: string | undefined = operation.hasBody ? bodyCode.value : undefined
    let sentBody: string | undefined = writtenBody
    if (withTelemetry) {
        if (!operation.isQuery || !supportsVisualisation) {
            await toaster.warning(t('restConsole.notification.queryTelemetryNotSupported'))
        } else {
            try {
                sentBody = injectQueryTelemetry(writtenBody ?? '')
            } catch (e) {
                if (!(e instanceof QueryTelemetryInjectionError)) {
                    await toaster.error(t('restConsole.notification.couldNotExecuteRequest'), asError(e))
                    return
                }
                await toaster.warning(t('restConsole.notification.queryTelemetryNotInjected'))
            }
        }
    }

    const sentRequest: RestRequest = buildRestRequest(
        operation,
        effectiveLocale.value,
        parameterValues.value,
        sentBody
    )
    try {
        workspaceService.addTabHistoryRecord(historyKey.value, createRestConsoleHistoryRecord(
            operation.operationId,
            operation.method,
            operation.pathTemplate,
            sentRequest.pathWithQuery,
            effectiveLocale.value,
            valuesOf(operation),
            writtenBody
        ))
    } catch (e) {
        await toaster.error(t('restConsole.notification.failedToSaveRequestToHistory'), asError(e))
    }

    loading.value = true
    try {
        const receivedResponse: RestResponse = await restConsoleService.executeRequest(
            props.params.dataPointer,
            sentRequest
        )
        executedOperation.value = operation
        executedRequest.value = sentRequest
        response.value = receivedResponse
        resultStatus.value = createRestResultStatus(
            receivedResponse,
            `${sentRequest.method} ${instanceBasePath}${sentRequest.pathWithQuery}`
        )
        loading.value = false

        if (firstResultPending) {
            firstResultPending = false
            resultPanelVisible.value = true
        }
        if (resultTab.value === ResultTabType.Raw) {
            focusRawResultEditor()
        }
    } catch (e) {
        loading.value = false
        resultStatus.value = undefined
        await toaster.error(t('restConsole.notification.couldNotExecuteRequest'), asError(e))
    }
}

onBeforeMount(() => {
    initialize()
})
onMounted(() => {
    keymap.bind(Command.RestConsole_ExecuteQuery, props.id, () => executeRequest())
    keymap.bind(Command.RestConsole_ExecuteQueryWithTelemetry, props.id, () => executeRequest(true))
    keymap.bind(Command.RestConsole_ShareTab, props.id, () => shareTabButtonRef.value?.share())
    keymap.bind(Command.RestConsole_Query_RequestEditor, props.id, () => {
        requestTab.value = RequestTabType.Request
        queryPanelVisible.value = true
        focusRequestEditor()
    })
    keymap.bind(Command.RestConsole_Query_History, props.id, () => {
        requestTab.value = RequestTabType.History
        queryPanelVisible.value = true
        focusHistory()
    })
    keymap.bind(Command.RestConsole_Query_OpenApiViewer, props.id, () => {
        requestTab.value = RequestTabType.OpenApi
        queryPanelVisible.value = true
        focusOpenApiViewer()
    })
    keymap.bind(Command.RestConsole_Query_Prettify, props.id, () => formatBody(DocumentFormattingMode.Prettify))
    keymap.bind(Command.RestConsole_Query_Minify, props.id, () => formatBody(DocumentFormattingMode.Minify))
    keymap.bind(Command.RestConsole_Query_TogglePanel, props.id, () => {
        queryPanelVisible.value = !queryPanelVisible.value
    })
    keymap.bind(Command.RestConsole_Result_RawResultViewer, props.id, () => {
        resultTab.value = ResultTabType.Raw
        resultPanelVisible.value = true
        focusRawResultEditor()
    })
    keymap.bind(Command.RestConsole_Result_ResultVisualizer, props.id, () => {
        if (!supportsVisualisation) {
            return
        }
        resultTab.value = ResultTabType.Visualiser
        resultPanelVisible.value = true
        focusResultVisualiser()
    })
    keymap.bind(Command.RestConsole_Result_TogglePanel, props.id, () => {
        resultPanelVisible.value = !resultPanelVisible.value
    })

    focusRequestEditor()
})
onUnmounted(() => {
    restConsoleService.unregisterOpenApiChangeCallback(props.params.dataPointer, openApiChangeCallbackId)

    keymap.unbind(Command.RestConsole_ExecuteQuery, props.id)
    keymap.unbind(Command.RestConsole_ExecuteQueryWithTelemetry, props.id)
    keymap.unbind(Command.RestConsole_ShareTab, props.id)
    keymap.unbind(Command.RestConsole_Query_RequestEditor, props.id)
    keymap.unbind(Command.RestConsole_Query_History, props.id)
    keymap.unbind(Command.RestConsole_Query_OpenApiViewer, props.id)
    keymap.unbind(Command.RestConsole_Query_Prettify, props.id)
    keymap.unbind(Command.RestConsole_Query_Minify, props.id)
    keymap.unbind(Command.RestConsole_Query_TogglePanel, props.id)
    keymap.unbind(Command.RestConsole_Result_RawResultViewer, props.id)
    keymap.unbind(Command.RestConsole_Result_ResultVisualizer, props.id)
    keymap.unbind(Command.RestConsole_Result_TogglePanel, props.id)
})

// the focused panel is recorded up front rather than left to the `focusin` the deferred focus() will fire — a view
// that is not mounted yet swallows the call
function focusRequestEditor(): void {
    focusedPanel.value = 'query'
    setTimeout(() => {
        if (selectedOperation.value?.hasBody) {
            bodyEditorRef.value?.focus()
        }
    })
}
function focusHistory(): void {
    focusedPanel.value = 'query'
    setTimeout(() => historyRef.value?.focus())
}
function focusOpenApiViewer(): void {
    focusedPanel.value = 'query'
    setTimeout(() => openApiViewerRef.value?.focus())
}
function focusRawResultEditor(): void {
    focusedPanel.value = 'result'
    setTimeout(() => rawResultEditorRef.value?.focus())
}
function focusResultVisualiser(): void {
    focusedPanel.value = 'result'
    setTimeout(() => resultVisualiserRef.value?.focus())
}
</script>

<template>
    <div v-if="initialized" class="rest-console">
        <VTabToolbar :prepend-icon="RestConsoleTabDefinition.icon()" :title="title">
            <template #append>
                <VTabToolbarActionGroup v-if="formattingAvailable">
                    <VBtn icon density="compact" @click="formatBody(DocumentFormattingMode.Prettify)">
                        <VIcon>mdi-auto-fix</VIcon>
                        <VActionTooltip :command="Command.RestConsole_Query_Prettify">
                            {{ t('common.button.prettify') }}
                        </VActionTooltip>
                    </VBtn>
                    <VBtn icon density="compact" @click="formatBody(DocumentFormattingMode.Minify)">
                        <VIcon>mdi-arrow-collapse-vertical</VIcon>
                        <VActionTooltip :command="Command.RestConsole_Query_Minify">
                            {{ t('common.button.minify') }}
                        </VActionTooltip>
                    </VBtn>
                </VTabToolbarActionGroup>

                <ShareTabButton
                    ref="shareTabButtonRef"
                    :tab-type="TabType.RestConsole"
                    :tab-params="params"
                    :tab-data="currentData"
                    :command="Command.RestConsole_ShareTab"
                />

                <VBtn :loading="reloadingOpenApi" icon density="compact" @click="refreshOpenApi()">
                    <VIcon>mdi-refresh</VIcon>
                    <VActionTooltip activator="parent">
                        {{ t('restConsole.button.reloadOpenApi') }}
                    </VActionTooltip>
                </VBtn>

                <VExecuteQueryButton
                    :loading="loading"
                    :title="t('common.button.run')"
                    :command="Command.RestConsole_ExecuteQuery"
                    :variants="executeQueryVariants"
                    @click="executeRequest()"
                    @variant="executeRequest(true)"
                />
            </template>
        </VTabToolbar>

        <div class="rest-console__body">
            <VSheet class="rest-console-query-sections">
                <VSideTabs
                    v-model="requestTab"
                    v-model:visible="queryPanelVisible"
                    side="left"
                    collapsible
                >
                    <VTab :value="RequestTabType.Request">
                        <VIcon>mdi-database-search</VIcon>
                        <VActionTooltip :command="Command.RestConsole_Query_RequestEditor">
                            {{ t('restConsole.tooltip.requestView') }}
                        </VActionTooltip>
                    </VTab>
                    <VTab :value="RequestTabType.History">
                        <VIcon>mdi-history</VIcon>
                        <VActionTooltip :command="Command.RestConsole_Query_History">
                            {{ t('restConsole.tooltip.historyView') }}
                        </VActionTooltip>
                    </VTab>
                    <VTab :value="RequestTabType.OpenApi">
                        <VIcon>mdi-file-code</VIcon>
                        <VActionTooltip :command="Command.RestConsole_Query_OpenApiViewer">
                            {{ t('restConsole.tooltip.openApiView') }}
                        </VActionTooltip>
                    </VTab>
                </VSideTabs>
            </VSheet>

            <div class="rest-console__panes-area">
                <Splitpanes
                    vertical
                    :class="[
                        'rest-console__panes',
                        { 'rest-console__panes--collapsed': !queryPanelVisible || !resultPanelVisible }
                    ]"
                >
                    <Pane
                        :class="[
                            'rest-console-pane',
                            { 'rest-console-pane--hidden': !queryPanelVisible },
                            { 'rest-console-pane--full': queryPanelVisible && !resultPanelVisible }
                        ]"
                        @focusin="focusedPanel = 'query'"
                    >
                        <VWindow v-model="requestTab" direction="vertical">
                            <VWindowItem :value="RequestTabType.Request" class="rest-console-request-item">
                                <VMissingDataIndicator
                                    v-if="operationCatalog == undefined || selectedEndpoint == undefined || selectedOperation == undefined"
                                    icon="mdi-api-off"
                                    :title="t('restConsole.placeholder.noEndpoints')"
                                />
                                <div v-else class="rest-console-request">
                                    <div class="rest-console-request__header">
                                        <RestEndpointPicker
                                            ref="endpointPickerRef"
                                            :catalog="operationCatalog"
                                            :model-value="selectedEndpoint"
                                            :localized="effectiveLocale != undefined"
                                            @update:model-value="selectEndpoint"
                                        />
                                        <p
                                            v-if="selectedOperation.description"
                                            class="text-caption text-disabled rest-console-request__description"
                                        >
                                            {{ selectedOperation.description }}
                                        </p>

                                        <div class="rest-console-request__url-row">
                                            <div v-if="selectedEndpoint.hasLocalizedVariant" class="rest-console-request__locale">
                                                <span class="text-overline">{{ t('restConsole.locale.label') }}</span>
                                                <VBtnToggle
                                                    :model-value="localeSwitchValue"
                                                    color="primary-lightest"
                                                    density="compact"
                                                    variant="outlined"
                                                    divided
                                                    mandatory
                                                    @update:model-value="selectLocale"
                                                >
                                                    <VBtn
                                                        v-if="selectedEndpoint.nonLocalized != undefined"
                                                        :value="notLocalized"
                                                        size="small"
                                                    >
                                                        —
                                                        <VTooltip activator="parent">{{ t('restConsole.locale.notLocalized') }}</VTooltip>
                                                    </VBtn>
                                                    <VBtn
                                                        v-for="locale in endpointLocales"
                                                        :key="locale"
                                                        :value="locale"
                                                        size="small"
                                                    >
                                                        {{ locale }}
                                                        <VTooltip activator="parent">{{ t('restConsole.locale.localized') }}</VTooltip>
                                                    </VBtn>
                                                </VBtnToggle>
                                            </div>
                                            <code class="rest-console-request__url">
                                                <strong>{{ selectedOperation.method }}</strong> {{ resolvedUrl }}
                                            </code>
                                        </div>
                                    </div>

                                    <!-- the only scrolling part of the request; it must never scroll the body editor along -->
                                    <div
                                        :class="[
                                            'rest-console-request__params',
                                            { 'rest-console-request__params--fill': !selectedOperation.hasBody }
                                        ]"
                                    >
                                        <RestParameterForm
                                            v-model:values="parameterValues"
                                            :operation="selectedOperation"
                                            :locale="effectiveLocale"
                                            :locales="endpointLocales"
                                        />

                                        <div v-if="!selectedOperation.hasBody" class="rest-console-request__no-body">
                                            <span class="text-body-2">
                                                {{ t('restConsole.placeholder.noBody', {
                                                    method: selectedOperation.method,
                                                    path: selectedOperation.pathTemplate
                                                }) }}
                                            </span>
                                            <span class="text-caption text-disabled">
                                                {{ t('restConsole.placeholder.noBodyHint') }}
                                            </span>
                                        </div>
                                    </div>

                                    <header v-if="selectedOperation.hasBody" class="rest-console-request__body-header">
                                        <span class="text-overline">{{ t('restConsole.section.body') }}</span>
                                        <span class="text-caption text-disabled rest-console-request__schema">
                                            {{ selectedOperation.bodySchemaName }}
                                        </span>
                                    </header>

                                    <!-- kept mounted for operations without a body, so that its undo history survives -->
                                    <div v-show="selectedOperation.hasBody" class="rest-console-request__body">
                                        <VQueryEditor
                                            ref="bodyEditorRef"
                                            v-model="bodyCode"
                                            :additional-extensions="bodyExtensions"
                                            @update:editor="bodyEditorView = $event.view"
                                        />
                                    </div>
                                </div>
                            </VWindowItem>

                            <VWindowItem :value="RequestTabType.History">
                                <RestConsoleHistory
                                    ref="historyRef"
                                    :items="historyRecords"
                                    @select-history-record="pickHistoryRecord"
                                    @update:clear-history="clearHistory"
                                />
                            </VWindowItem>

                            <VWindowItem :value="RequestTabType.OpenApi" @group:selected="initializeOpenApiViewer">
                                <VPreviewEditor
                                    ref="openApiViewerRef"
                                    v-model="openApiCode"
                                    :additional-extensions="openApiExtensions"
                                    style="height: 100%"
                                />
                            </VWindowItem>
                        </VWindow>
                    </Pane>

                    <Pane
                        min-size="20"
                        :class="[
                            'rest-console-pane',
                            { 'rest-console-pane--hidden': !resultPanelVisible },
                            { 'rest-console-pane--full': resultPanelVisible && !queryPanelVisible }
                        ]"
                        @focusin="focusedPanel = 'result'"
                    >
                        <div class="rest-console-result">
                            <ResultStatusBar v-if="resultStatus != undefined" :status="resultStatus" />
                            <div class="rest-console-result__views">
                                <VWindow v-model="resultTab" direction="vertical">
                                    <VWindowItem :value="ResultTabType.Raw">
                                        <VPreviewEditor
                                            v-if="resultTab === ResultTabType.Raw"
                                            ref="rawResultEditorRef"
                                            :model-value="resultCode"
                                            :placeholder="t('restConsole.placeholder.results')"
                                            read-only
                                            :additional-extensions="resultExtensions"
                                        />
                                    </VWindowItem>

                                    <VWindowItem v-if="supportsVisualisation" :value="ResultTabType.Visualiser">
                                        <template v-if="resultTab === ResultTabType.Visualiser">
                                            <ResultVisualiser
                                                v-if="visualisedResult != undefined && executedOperation != undefined"
                                                ref="resultVisualiserRef"
                                                :catalog-pointer="params.dataPointer"
                                                :visualiser-service="visualiserService"
                                                :input-query="executedOperation.pathTemplate"
                                                :result="visualisedResult"
                                                :state="resultVisualiserState"
                                            />
                                            <VMissingDataIndicator
                                                v-else
                                                icon="mdi-file-tree-outline"
                                                :title="t('restConsole.placeholder.visualisationUnavailable')"
                                            />
                                        </template>
                                    </VWindowItem>
                                </VWindow>
                            </div>
                        </div>
                    </Pane>
                </Splitpanes>

                <VMissingDataIndicator
                    v-if="bothPanelsHidden"
                    class="rest-console__no-panels"
                    icon="mdi-arrow-expand-horizontal"
                    :title="t('restConsole.placeholder.noPanelsVisible')"
                >
                    <template #actions>
                        <VBtn variant="outlined" @click="queryPanelVisible = true">
                            {{ t('restConsole.button.showQueryPanel') }}
                        </VBtn>
                        <VBtn variant="outlined" @click="resultPanelVisible = true">
                            {{ t('restConsole.button.showResultPanel') }}
                        </VBtn>
                    </template>
                </VMissingDataIndicator>
            </div>

            <VSheet class="rest-console-result-sections">
                <VSideTabs
                    v-model="resultTab"
                    v-model:visible="resultPanelVisible"
                    side="right"
                    collapsible
                >
                    <VTab :value="ResultTabType.Raw">
                        <VIcon>mdi-code-braces</VIcon>
                        <VActionTooltip :command="Command.RestConsole_Result_RawResultViewer">
                            {{ t('restConsole.tooltip.rawResultViewerView') }}
                        </VActionTooltip>
                    </VTab>
                    <VTab v-if="supportsVisualisation" :value="ResultTabType.Visualiser">
                        <VIcon>mdi-file-tree-outline</VIcon>
                        <VActionTooltip :command="Command.RestConsole_Result_ResultVisualizer">
                            {{ t('restConsole.tooltip.resultVisualizerView') }}
                        </VActionTooltip>
                    </VTab>
                </VSideTabs>
            </VSheet>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.rest-console {
    display: grid;
    grid-template-rows: 3rem 1fr;

    &__body {
        display: grid;
        grid-template-columns: 3rem 1fr 3rem;
    }

    // takes the place of the panes in the body grid so that the both-panels-hidden indicator can overlay only the
    // panes, not the side tab strips
    &__panes-area {
        position: relative;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
    }

    &__panes {
        position: relative;

        &--collapsed :deep(.splitpanes__splitter) {
            display: none;
        }
    }

    &__no-panels {
        position: absolute;
        inset: 0;
        background: rgb(var(--v-theme-background));
    }
}

.rest-console-pane {
    // collapsing a panel is a discrete state change; splitpanes' width animation would turn it into a two-step
    transition: none !important;
    will-change: auto !important;

    & :deep(.v-window) {
        // we need to override the default tab window styles used in LabEditor
        position: absolute;
        left: 0 !important;
        right: 0 !important;
        top: 0 !important;
        bottom: 0 !important;
    }

    // a collapsed pane keeps its box at its original size, anchored to the edge it sits at, below its sibling
    &--hidden {
        position: absolute;
        top: 0;
        bottom: 0;
        visibility: hidden;
        z-index: 0;

        &:first-child {
            left: 0;
        }

        &:last-child {
            right: 0;
        }
    }

    // the width overrides the inline one splitpanes writes on the pane element
    &--full {
        width: 100% !important;
        z-index: 1;
    }
}

.rest-console-request-item {
    height: 100%;
}

.rest-console-request {
    display: flex;
    flex-direction: column;
    height: 100%;
    // the workspace's window item is a grid with a `1fr` row, which would otherwise grow to the content's height and
    // leave nothing to scroll; a non-visible overflow drops the grid item's automatic minimum height to zero
    overflow: hidden;

    &__header {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        flex: none;
        padding: 1rem 1rem 0.75rem;
    }

    // with a body, the parameters take their content height, capped so that the body editor keeps the larger share
    &__params {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        flex: 0 1 auto;
        // in a very low window both sections keep a usable minimum instead of the parameters collapsing to nothing
        min-height: 4rem;
        max-height: 40%;
        overflow-y: auto;
        padding: 0 1rem 0.75rem;

        &--fill {
            flex: 1 1 auto;
            max-height: none;
        }
    }

    &__description {
        margin: -0.25rem 0 0;
    }

    &__url-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;
    }

    &__locale {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    &__url {
        flex: 1 1 18rem;
        padding: 0.5rem 0.75rem;
        border-radius: 4px;
        background: rgba(var(--v-theme-on-surface), 0.05);
        overflow-wrap: anywhere;
        font-size: 0.8125rem;
    }

    &__no-body {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 1rem;
        border: thin dashed rgba(var(--v-border-color), var(--v-border-opacity));
        border-radius: 4px;
    }

    &__body-header {
        flex: none;
        padding: 0.25rem 1rem 0.5rem;
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 1rem;
        white-space: nowrap;
    }

    &__schema {
        font-family: monospace;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &__body {
        position: relative;
        flex: 1;
        min-height: 6rem;
        border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));

        & > * {
            height: 100%;
        }
    }
}

.rest-console-result {
    display: flex;
    flex-direction: column;
    height: 100%;

    &__views {
        position: relative;
        flex: 1;
        min-height: 0;
    }
}

.rest-console-query-sections, .rest-console-result-sections {
    display: flex;
    width: 3rem;
}
</style>

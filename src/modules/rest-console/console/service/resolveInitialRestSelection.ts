import { RestOperationCatalog } from '@/modules/rest-console/console/model/RestOperationCatalog'
import { RestEndpoint } from '@/modules/rest-console/console/model/RestEndpoint'
import type { RestParameterValues } from '@/modules/rest-console/console/model/RestParameterValue'
import { RestConsoleTabData } from '@/modules/rest-console/console/workspace/model/RestConsoleTabData'

/**
 * What a console restores from its tab data.
 */
export interface InitialRestSelection {
    /**
     * `undefined` only when the specification has no endpoint at all.
     */
    readonly endpoint: RestEndpoint | undefined
    readonly locale: string | undefined
    readonly parameters: RestParameterValues
    readonly body: string | undefined
    /**
     * Operation id of the tab data that no longer exists in the specification, so the caller can tell the user.
     */
    readonly unknownOperationId: string | undefined
}

/**
 * Resolves the request a console starts with from its (restored or shared) tab data. The stored operation id is
 * that of the selected variant, so it also decides whether the locale applies. An operation the specification no
 * longer has falls back to the first endpoint and keeps the parameters and the body — nothing the user wrote is
 * thrown away.
 */
export function resolveInitialRestSelection(catalog: RestOperationCatalog, data: RestConsoleTabData): InitialRestSelection {
    const operationId: string | undefined = data.operationId
    const endpoint: RestEndpoint | undefined = operationId != undefined
        ? catalog.findEndpointOfOperation(operationId)
        : undefined
    return {
        endpoint: endpoint ?? catalog.endpoints.first(),
        locale: endpoint != undefined && endpoint.localized?.operationId === operationId ? data.locale : undefined,
        parameters: { ...(data.parameters ?? {}) },
        body: data.body,
        unknownOperationId: operationId != undefined && endpoint == undefined ? operationId : undefined
    }
}

import { i18n } from '@/vue-plugins/i18n'
import { RestEndpoint } from '@/modules/rest-console/console/model/RestEndpoint'
import { RestOperationGroup } from '@/modules/rest-console/console/model/RestOperationGroup'

/**
 * Human-readable name of an endpoint: the localized name of its operation key (`getById` → "Get entity by primary
 * key"), or the raw operation id when the operation is not known.
 */
export function resolveRestEndpointDisplayName(endpoint: RestEndpoint): string {
    const key: string = `restConsole.operationName.${endpoint.operationKey}`
    return i18n.global.te(key) ? i18n.global.t(key) : endpoint.id
}

/**
 * Label of an endpoint group: the collection name, or the localized name of the catalog / system group.
 */
export function resolveRestGroupDisplayName(group: RestOperationGroup): string {
    return group.generic ? i18n.global.t(`restConsole.group.${group.name}`) : group.name
}

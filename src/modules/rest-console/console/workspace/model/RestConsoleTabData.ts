import type { TabData } from '@/modules/workspace/tab/model/TabData'
import type { RestParameterValues } from '@/modules/rest-console/console/model/RestParameterValue'
import type { RestConsoleTabDataDto } from '@/modules/rest-console/console/workspace/model/RestConsoleTabDataDto'

/**
 * User-editable content of a REST console tab — the request being prepared. Shareable.
 *
 * The operation is identified by the id of the selected **variant** (localized or not); method and path template
 * are carried for the reader of a shared link and as a hint when the specification has changed in the meantime.
 */
export class RestConsoleTabData implements TabData<RestConsoleTabDataDto> {
    readonly operationId?: string
    readonly method?: string
    readonly pathTemplate?: string
    readonly locale?: string
    /**
     * Only the parameters that have a value.
     */
    readonly parameters?: RestParameterValues
    readonly body?: string

    constructor(operationId?: string,
                method?: string,
                pathTemplate?: string,
                locale?: string,
                parameters?: RestParameterValues,
                body?: string) {
        this.operationId = operationId
        this.method = method
        this.pathTemplate = pathTemplate
        this.locale = locale
        this.parameters = parameters
        this.body = body
    }

    toSerializable(): RestConsoleTabDataDto {
        return {
            operationId: this.operationId,
            method: this.method,
            pathTemplate: this.pathTemplate,
            locale: this.locale,
            parameters: this.parameters,
            body: this.body
        }
    }
}

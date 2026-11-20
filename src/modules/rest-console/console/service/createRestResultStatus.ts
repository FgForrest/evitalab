import { ConsoleResultStatus } from '@/modules/console/result-status/model/ConsoleResultStatus'
import type { RestResponse } from '@/modules/database-driver/connector/rest/model/RestResponse'

/**
 * Standard reason phrases (RFC 9110) of the statuses an evitaDB REST API answers with or a proxy in front of it may.
 * HTTP/2 carries no reason phrase, so the browser reports an empty `statusText` there.
 */
const reasonPhrases: ReadonlyMap<number, string> = new Map([
    [200, 'OK'], [201, 'Created'], [202, 'Accepted'], [204, 'No Content'],
    [301, 'Moved Permanently'], [302, 'Found'], [304, 'Not Modified'], [307, 'Temporary Redirect'],
    [308, 'Permanent Redirect'],
    [400, 'Bad Request'], [401, 'Unauthorized'], [403, 'Forbidden'], [404, 'Not Found'],
    [405, 'Method Not Allowed'], [406, 'Not Acceptable'], [408, 'Request Timeout'], [409, 'Conflict'],
    [413, 'Content Too Large'], [415, 'Unsupported Media Type'], [422, 'Unprocessable Content'],
    [429, 'Too Many Requests'],
    [500, 'Internal Server Error'], [501, 'Not Implemented'], [502, 'Bad Gateway'], [503, 'Service Unavailable'],
    [504, 'Gateway Timeout']
])

/**
 * Summarizes a REST response for the result status bar: the HTTP status with its reason phrase (the standard one
 * when the response carries none), the duration and size of the response, and the executed request.
 *
 * @param request the executed request as displayed (`METHOD path`)
 */
export function createRestResultStatus(response: RestResponse, request: string): ConsoleResultStatus {
    const reasonPhrase: string = response.statusText.trim().length > 0
        ? response.statusText.trim()
        : reasonPhrases.get(response.status) ?? ''
    return new ConsoleResultStatus(
        response.successful,
        `${response.status} ${reasonPhrase}`.trim(),
        response.durationMs,
        response.sizeBytes,
        request
    )
}

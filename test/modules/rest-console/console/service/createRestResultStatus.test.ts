import { describe, expect, test } from 'vitest'
import { createRestResultStatus } from '@/modules/rest-console/console/service/createRestResultStatus'
import { RestResponse } from '@/modules/database-driver/connector/rest/model/RestResponse'

describe('REST result status', () => {
    test('Should carry the HTTP status, metrics and request', () => {
        const status = createRestResultStatus(
            new RestResponse(400, 'Bad Request', '{}', 'application/json', 20, 176),
            'GET /rest/evita/Product/get'
        )
        expect(status.successful).toBe(false)
        expect(status.label).toBe('400 Bad Request')
        expect(status.durationMs).toBe(20)
        expect(status.sizeBytes).toBe(176)
        expect(status.request).toBe('GET /rest/evita/Product/get')
    })

    test('Should fall back to the standard reason phrase when HTTP/2 carries none', () => {
        expect(createRestResultStatus(new RestResponse(200, '', '', undefined, 1, 0), 'GET /').label).toBe('200 OK')
        expect(createRestResultStatus(new RestResponse(404, '', '', undefined, 1, 0), 'GET /').label).toBe('404 Not Found')
        expect(createRestResultStatus(new RestResponse(500, '  ', '', undefined, 1, 0), 'GET /').label)
            .toBe('500 Internal Server Error')
    })

    test('Should show the bare code of a status without a known reason phrase', () => {
        expect(createRestResultStatus(new RestResponse(299, '', '', undefined, 1, 0), 'GET /').label).toBe('299')
    })
})

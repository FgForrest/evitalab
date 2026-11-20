import { describe, expect, test } from 'vitest'
import { List as ImmutableList } from 'immutable'
import {
    findInvalidRestParameters,
    validateRestParameterValue
} from '@/modules/rest-console/console/service/validateRestParameterValue'
import catalogSpec from '../../fixtures/catalog-openapi.json'
import { buildRestOperationCatalog } from '@/modules/rest-console/console/service/buildRestOperationCatalog'
import { RestInstanceType } from '@/modules/database-driver/connector/rest/model/RestInstanceType'
import type { RestOperation } from '@/modules/rest-console/console/model/RestOperation'
import { RestParameter } from '@/modules/rest-console/console/model/RestParameter'
import { RestParameterKind } from '@/modules/rest-console/console/model/RestParameterKind'
import { RestParameterLocation } from '@/modules/rest-console/console/model/RestParameterLocation'
import { RestParameterValidationFailure } from '@/modules/rest-console/console/model/RestParameterValidationFailure'

function parameter(kind: RestParameterKind, required: boolean = false, enumValues: string[] = []): RestParameter {
    return new RestParameter('p', RestParameterLocation.Query, kind, required, undefined, ImmutableList(enumValues), kind, undefined)
}

describe('REST parameter validation', () => {
    test('Should require a value of a required parameter only', () => {
        expect(validateRestParameterValue(parameter(RestParameterKind.String, true), undefined))
            .toBe(RestParameterValidationFailure.Missing)
        expect(validateRestParameterValue(parameter(RestParameterKind.String, true), '  '))
            .toBe(RestParameterValidationFailure.Missing)
        expect(validateRestParameterValue(parameter(RestParameterKind.Integer), undefined)).toBeUndefined()
    })

    test('Should validate numbers', () => {
        expect(validateRestParameterValue(parameter(RestParameterKind.Integer), '-12')).toBeUndefined()
        expect(validateRestParameterValue(parameter(RestParameterKind.Integer), '1.5'))
            .toBe(RestParameterValidationFailure.NotInteger)
        expect(validateRestParameterValue(parameter(RestParameterKind.Number), '1.5')).toBeUndefined()
        expect(validateRestParameterValue(parameter(RestParameterKind.Number), 'x'))
            .toBe(RestParameterValidationFailure.NotNumber)
    })

    test('Should validate date-times with an offset', () => {
        expect(validateRestParameterValue(parameter(RestParameterKind.DateTime), '2022-09-27T13:28:27.357+02:00'))
            .toBeUndefined()
        expect(validateRestParameterValue(parameter(RestParameterKind.DateTime), '2022-09-27T13:28Z')).toBeUndefined()
        expect(validateRestParameterValue(parameter(RestParameterKind.DateTime), '2022-09-27'))
            .toBe(RestParameterValidationFailure.NotDateTime)
    })

    test('Should validate enum values of every array item', () => {
        const scope: RestParameter = parameter(RestParameterKind.EnumArray, false, ['LIVE', 'ARCHIVED'])
        expect(validateRestParameterValue(scope, ['LIVE', 'ARCHIVED'])).toBeUndefined()
        expect(validateRestParameterValue(scope, ['LIVE', 'DRAFT'])).toBe(RestParameterValidationFailure.NotAllowedValue)
    })

    test('Should validate booleans', () => {
        expect(validateRestParameterValue(parameter(RestParameterKind.Boolean), 'true')).toBeUndefined()
        expect(validateRestParameterValue(parameter(RestParameterKind.Boolean), 'yes'))
            .toBe(RestParameterValidationFailure.NotBoolean)
    })
})

describe('REST request validation', () => {
    const getByIdLocalized: RestOperation | undefined = buildRestOperationCatalog(catalogSpec, RestInstanceType.Catalog)
        .findOperation('getProductByIdLocalized')

    test('Should report a localized variant without a chosen locale instead of sending a literal {locale}', () => {
        expect(findInvalidRestParameters(getByIdLocalized as RestOperation, undefined, { primaryKey: '1' }))
            .toEqual(['locale'])
    })

    test('Should accept a localized variant with a locale and every required value', () => {
        expect(findInvalidRestParameters(getByIdLocalized as RestOperation, 'en', { primaryKey: '1' })).toEqual([])
    })

    test('Should report missing and invalid values by name', () => {
        expect(findInvalidRestParameters(getByIdLocalized as RestOperation, 'en', { primaryKey: 'x', scope: ['DRAFT'] }))
            .toEqual(['primaryKey', 'scope'])
    })
})

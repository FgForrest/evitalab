import { describe, test, expect } from 'vitest'
import { List } from 'immutable'
import {
    resolvePropertyMutationHistoryContainer
} from '../../../../../src/modules/entity-viewer/viewer/model/entity-grid/propertyMutationHistoryContainer'
import {
    EntityPropertyDescriptor
} from '../../../../../src/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import { EntityPropertyKey } from '../../../../../src/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { EntityPropertyType } from '../../../../../src/modules/entity-viewer/viewer/model/EntityPropertyType'
import {
    GrpcChangeCaptureContainerType
} from '../../../../../src/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb'

function descriptor(type: EntityPropertyType, key: EntityPropertyKey): EntityPropertyDescriptor {
    return new EntityPropertyDescriptor(type, key, 'title', 'title', undefined, undefined, List())
}

describe('resolvePropertyMutationHistoryContainer', () => {

    test('resolves attributes to the attribute container named after the attribute', () => {
        expect(resolvePropertyMutationHistoryContainer(
            descriptor(EntityPropertyType.Attributes, EntityPropertyKey.attributes('code'))
        )).toEqual({
            containerType: GrpcChangeCaptureContainerType.CONTAINER_ATTRIBUTE,
            containerName: 'code',
            titleKey: 'entityViewer.grid.cell.menu.attributeHistory'
        })
    })

    test('resolves associated data to the associated data container named after the associated data', () => {
        expect(resolvePropertyMutationHistoryContainer(
            descriptor(EntityPropertyType.AssociatedData, EntityPropertyKey.associatedData('localization'))
        )).toEqual({
            containerType: GrpcChangeCaptureContainerType.CONTAINER_ASSOCIATED_DATA,
            containerName: 'localization',
            titleKey: 'entityViewer.grid.cell.menu.associatedDataHistory'
        })
    })

    test('resolves prices to the unnamed price container', () => {
        expect(resolvePropertyMutationHistoryContainer(
            descriptor(EntityPropertyType.Prices, EntityPropertyKey.prices())
        )).toEqual({
            containerType: GrpcChangeCaptureContainerType.CONTAINER_PRICE,
            containerName: undefined,
            titleKey: 'entityViewer.grid.cell.menu.priceHistory'
        })
    })

    test('resolves references to the reference container named after the reference', () => {
        expect(resolvePropertyMutationHistoryContainer(
            descriptor(EntityPropertyType.References, EntityPropertyKey.references('brand'))
        )).toEqual({
            containerType: GrpcChangeCaptureContainerType.CONTAINER_REFERENCE,
            containerName: 'brand',
            titleKey: 'entityViewer.grid.cell.menu.referenceHistory'
        })
    })

    // regression: the container name used to be taken from the descriptor's schema, which is the
    // attribute schema for reference attributes, so the history was filtered by the attribute name
    test('resolves reference attributes to the reference container named after the reference', () => {
        expect(resolvePropertyMutationHistoryContainer(
            descriptor(
                EntityPropertyType.ReferenceAttributes,
                EntityPropertyKey.referenceAttributes('brand', 'marketShare')
            )
        )).toEqual({
            containerType: GrpcChangeCaptureContainerType.CONTAINER_REFERENCE,
            containerName: 'brand',
            titleKey: 'entityViewer.grid.cell.menu.referenceHistory'
        })
    })

    test('resolves no container for entity properties and missing descriptors', () => {
        expect(resolvePropertyMutationHistoryContainer(
            descriptor(EntityPropertyType.Entity, EntityPropertyKey.entity('primaryKey'))
        )).toBeUndefined()
        expect(resolvePropertyMutationHistoryContainer(undefined)).toBeUndefined()
    })
})

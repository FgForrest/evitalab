import { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { GrpcChangeCaptureContainerType } from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb'

/**
 * Mutation history container an entity property lives in.
 */
export interface PropertyMutationHistoryContainer {
    /**
     * Container type the mutation history should be filtered by.
     */
    readonly containerType: GrpcChangeCaptureContainerType
    /**
     * Name of the container the mutation history should be filtered by, if the container is named.
     */
    readonly containerName: string | undefined
    /**
     * i18n key of the human-readable name of the resolved history target.
     */
    readonly titleKey: string
}

/**
 * Resolves the mutation history container of an entity property. Returns `undefined` for properties that
 * have no property-level container of their own (entity-wide properties like the primary key or version),
 * for which only the entity history exists.
 *
 * Container names are derived from the property key rather than from its schema, because a reference
 * attribute's schema is the *attribute* schema while evitaDB expects the *reference* name.
 *
 * @param propertyDescriptor descriptor of the property to resolve the container for
 */
export function resolvePropertyMutationHistoryContainer(
    propertyDescriptor: EntityPropertyDescriptor | undefined
): PropertyMutationHistoryContainer | undefined {
    switch (propertyDescriptor?.type) {
        case EntityPropertyType.Attributes:
            return {
                containerType: GrpcChangeCaptureContainerType.CONTAINER_ATTRIBUTE,
                containerName: propertyDescriptor.key.name,
                titleKey: 'entityViewer.grid.cell.menu.attributeHistory'
            }
        case EntityPropertyType.AssociatedData:
            return {
                containerType: GrpcChangeCaptureContainerType.CONTAINER_ASSOCIATED_DATA,
                containerName: propertyDescriptor.key.name,
                titleKey: 'entityViewer.grid.cell.menu.associatedDataHistory'
            }
        case EntityPropertyType.Prices:
            return {
                containerType: GrpcChangeCaptureContainerType.CONTAINER_PRICE,
                containerName: undefined,
                titleKey: 'entityViewer.grid.cell.menu.priceHistory'
            }
        case EntityPropertyType.References:
            return {
                containerType: GrpcChangeCaptureContainerType.CONTAINER_REFERENCE,
                containerName: propertyDescriptor.key.name,
                titleKey: 'entityViewer.grid.cell.menu.referenceHistory'
            }
        case EntityPropertyType.ReferenceAttributes:
            return {
                containerType: GrpcChangeCaptureContainerType.CONTAINER_REFERENCE,
                containerName: propertyDescriptor.key.parentName,
                titleKey: 'entityViewer.grid.cell.menu.referenceHistory'
            }
        default:
            return undefined
    }
}

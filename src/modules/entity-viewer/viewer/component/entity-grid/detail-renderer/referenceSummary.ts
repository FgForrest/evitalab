import { Property } from '@/modules/base/model/properties-table/Property'
import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue'
import { KeywordValue } from '@/modules/base/model/properties-table/KeywordValue'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'

/**
 * Minimal translator signature accepted by {@link buildReferenceSummaryProperties} (the `t` returned by
 * `useI18n()`), kept narrow so the helper stays framework-agnostic and testable.
 */
type Translate = (key: string, named?: Record<string, unknown>) => string

/**
 * Builds the shared summary rows for the references and reference-attribute detail panels: referenced entity type,
 * referenced group (only when the reference defines one), cardinality (localized) and the total reference count
 * (with the after-filtering count when a filter narrows the result). The reference-attribute detail appends its own
 * attribute-type row on top of these.
 */
export function buildReferenceSummaryProperties(
    t: Translate,
    referenceSchema: ReferenceSchema,
    totalCount: number,
    filteredCount: number
): Property[] {
    const properties: Property[] = [
        new Property(
            t('entityViewer.grid.referenceDetail.label.referencedType'),
            new PropertyValue(new KeywordValue(referenceSchema.entityType))
        )
    ]

    if (referenceSchema.referencedGroupType != undefined && referenceSchema.referencedGroupType.length > 0) {
        properties.push(new Property(
            t('entityViewer.grid.referenceDetail.label.referencedGroup'),
            new PropertyValue(new KeywordValue(referenceSchema.referencedGroupType))
        ))
    }

    properties.push(new Property(
        t('entityViewer.grid.referenceDetail.label.cardinality'),
        new PropertyValue(new KeywordValue(t(`common.cardinality.${referenceSchema.cardinality}`)))
    ))

    properties.push(new Property(
        t('entityViewer.grid.referenceDetail.label.count'),
        new PropertyValue(
            filteredCount !== totalCount
                ? t('entityViewer.grid.referenceDetail.value.countFiltered', { total: totalCount, filtered: filteredCount })
                : `${totalCount}`
        )
    ))

    return properties
}

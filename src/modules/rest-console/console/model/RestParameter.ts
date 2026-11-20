import { List as ImmutableList } from 'immutable'
import { RestParameterKind } from '@/modules/rest-console/console/model/RestParameterKind'
import { RestParameterLocation } from '@/modules/rest-console/console/model/RestParameterLocation'

/**
 * A single path or query parameter of a REST operation, as declared by the OpenAPI specification.
 */
export class RestParameter {
    readonly name: string
    readonly location: RestParameterLocation
    readonly kind: RestParameterKind
    readonly required: boolean
    readonly description: string | undefined
    /**
     * Allowed values of {@link RestParameterKind.Enum} and {@link RestParameterKind.EnumArray} parameters, and the
     * values the specification lists for locale parameters (used when the catalog schema cannot tell).
     */
    readonly enumValues: ImmutableList<string>
    /**
     * Human-readable type as declared by the specification (`int32`, `array<Scope>`, …), for display.
     */
    readonly displayType: string
    readonly example: string | undefined

    constructor(name: string,
                location: RestParameterLocation,
                kind: RestParameterKind,
                required: boolean,
                description: string | undefined,
                enumValues: ImmutableList<string>,
                displayType: string,
                example: string | undefined) {
        this.name = name
        this.location = location
        this.kind = kind
        this.required = required
        this.description = description
        this.enumValues = enumValues
        this.displayType = displayType
        this.example = example
    }
}

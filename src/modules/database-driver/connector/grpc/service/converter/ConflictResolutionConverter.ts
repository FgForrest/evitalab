import {
    GrpcConflictPolicy,
    GrpcConflictResolutionOverride,
    GrpcGranularConflictPolicy
} from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb.ts'
import type { GrpcConflictResolution } from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb.ts'
import { ConflictPolicy } from '@/modules/database-driver/request-response/schema/ConflictPolicy.ts'
import {
    GranularConflictPolicy
} from '@/modules/database-driver/request-response/schema/GranularConflictPolicy.ts'
import {
    ConflictResolution
} from '@/modules/database-driver/request-response/schema/ConflictResolution.ts'
import {
    ConflictResolutionOverride
} from '@/modules/database-driver/request-response/schema/ConflictResolutionOverride.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import { List as ImmutableList } from 'immutable'

/**
 * Converts transaction conflict-resolution parts of a schema from their gRPC representation into
 * evitaLab's internal model.
 *
 * Note the two different shapes: catalog and entity schemas carry an optional
 * {@link GrpcConflictResolution} message whose absence means "inherits from a less specific level",
 * whereas individual items carry a plain enum in which
 * {@link GrpcConflictResolutionOverride.CONFLICT_RESOLUTION_OVERRIDE_INHERITED} is the "not set" sentinel.
 */
export class ConflictResolutionConverter {

    /**
     * Converts the conflict resolution declared on a catalog or entity schema. Returns undefined when
     * the schema declares none and therefore inherits.
     */
    static convertConflictResolution(
        conflictResolution: GrpcConflictResolution | undefined
    ): ConflictResolution | undefined {
        if (conflictResolution == undefined) {
            return undefined
        }
        return new ConflictResolution(
            ConflictResolutionConverter.convertConflictPolicy(conflictResolution.policy),
            ImmutableList(
                conflictResolution.granularity.map(x =>
                    ConflictResolutionConverter.convertGranularConflictPolicy(x)
                )
            )
        )
    }

    static convertConflictPolicy(conflictPolicy: GrpcConflictPolicy): ConflictPolicy {
        switch (conflictPolicy) {
            case GrpcConflictPolicy.CONFLICT_POLICY_NONE:
                return ConflictPolicy.None
            case GrpcConflictPolicy.CONFLICT_POLICY_CATALOG:
                return ConflictPolicy.Catalog
            case GrpcConflictPolicy.CONFLICT_POLICY_COLLECTION:
                return ConflictPolicy.Collection
            case GrpcConflictPolicy.CONFLICT_POLICY_ENTITY:
                return ConflictPolicy.Entity
            default:
                throw new UnexpectedError(
                    `Could not convert conflict policy '${conflictPolicy}'.`
                )
        }
    }

    static convertGranularConflictPolicy(
        granularConflictPolicy: GrpcGranularConflictPolicy
    ): GranularConflictPolicy {
        switch (granularConflictPolicy) {
            case GrpcGranularConflictPolicy.GRANULAR_CONFLICT_POLICY_ENTITY_ATTRIBUTE:
                return GranularConflictPolicy.EntityAttribute
            case GrpcGranularConflictPolicy.GRANULAR_CONFLICT_POLICY_REFERENCE:
                return GranularConflictPolicy.Reference
            case GrpcGranularConflictPolicy.GRANULAR_CONFLICT_POLICY_REFERENCE_ATTRIBUTE:
                return GranularConflictPolicy.ReferenceAttribute
            case GrpcGranularConflictPolicy.GRANULAR_CONFLICT_POLICY_ASSOCIATED_DATA:
                return GranularConflictPolicy.AssociatedData
            case GrpcGranularConflictPolicy.GRANULAR_CONFLICT_POLICY_PRICE:
                return GranularConflictPolicy.Price
            case GrpcGranularConflictPolicy.GRANULAR_CONFLICT_POLICY_HIERARCHY:
                return GranularConflictPolicy.Hierarchy
            default:
                throw new UnexpectedError(
                    `Could not convert granular conflict policy '${granularConflictPolicy}'.`
                )
        }
    }

    /**
     * Converts the override declared on an individual item. An absent value (a server that does not know
     * the field yet) means the item declares no override.
     */
    static convertConflictResolutionOverride(
        conflictResolutionOverride: GrpcConflictResolutionOverride | undefined
    ): ConflictResolutionOverride {
        if (conflictResolutionOverride == undefined) {
            return ConflictResolutionOverride.Inherited
        }
        switch (conflictResolutionOverride) {
            case GrpcConflictResolutionOverride.CONFLICT_RESOLUTION_OVERRIDE_INHERITED:
                return ConflictResolutionOverride.Inherited
            case GrpcConflictResolutionOverride.CONFLICT_RESOLUTION_OVERRIDE_GRANULAR:
                return ConflictResolutionOverride.Granular
            case GrpcConflictResolutionOverride.CONFLICT_RESOLUTION_OVERRIDE_ENTITY:
                return ConflictResolutionOverride.Entity
            default:
                throw new UnexpectedError(
                    `Could not convert conflict resolution override '${conflictResolutionOverride}'.`
                )
        }
    }
}

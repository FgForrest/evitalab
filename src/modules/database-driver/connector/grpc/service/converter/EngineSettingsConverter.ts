import type {
    GrpcEvitaEngineSettingsResponse
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaManagementAPI_pb.ts'
import { EngineSettings } from '@/modules/database-driver/request-response/status/EngineSettings.ts'
import {
    ConflictResolutionConverter
} from '@/modules/database-driver/connector/grpc/service/converter/ConflictResolutionConverter.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'

/**
 * Converts the engine settings response into evitaLab's internal model.
 */
export class EngineSettingsConverter {

    convert(engineSettings: GrpcEvitaEngineSettingsResponse): EngineSettings {
        const conflictResolution = ConflictResolutionConverter.convertConflictResolution(
            engineSettings.conflictResolution
        )
        if (conflictResolution == undefined) {
            // the engine default is the base of the precedence walk, there is no level below it to inherit from
            throw new UnexpectedError('Server did not report its default conflict resolution.')
        }
        return new EngineSettings(
            conflictResolution,
            engineSettings.timeTravelEnabled,
            engineSettings.changeDataCaptureEnabled,
            engineSettings.trafficRecordingEnabled,
            engineSettings.queryCacheEnabled
        )
    }
}

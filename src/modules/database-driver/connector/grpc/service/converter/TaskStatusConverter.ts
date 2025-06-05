import { List as ImmutableList, Set as ImmutableSet } from 'immutable'
import { TaskStateConverter } from './TaskStateConverter'
import { TaskStatus } from '@/modules/database-driver/request-response/task/TaskStatus'
import { PaginatedList } from '@/modules/database-driver/request-response/PaginatedList'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { GrpcTaskTrait } from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import { ServerFileConverter } from '@/modules/database-driver/connector/grpc/service/converter/ServerFileConverter'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter'
import { GrpcTaskStatusesResponse } from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaManagementAPI_pb'
import { GrpcFile, GrpcTaskStatus } from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaDataTypes_pb'
import { TaskResult } from '@/modules/database-driver/request-response/task/TaskResult'
import { TextTaskResult } from '@/modules/database-driver/request-response/task/TextTaskResult'
import { FileTaskResult } from '@/modules/database-driver/request-response/task/FileTaskResult'
import { TaskTrait } from '@/modules/database-driver/request-response/task/TaskTrait'
import { StringValue } from '@bufbuild/protobuf/wkt'

/**
 * Converts task statuses between evitaLab representation and evitaDB's gRPC
 * representation
 */
export class TaskStatusConverter {
    private readonly evitaValueConverter: EvitaValueConverter
    private readonly taskStateConverter: TaskStateConverter
    private readonly serverFileConverter: ServerFileConverter

    constructor(evitaValueConverter: EvitaValueConverter, taskStateConverter: TaskStateConverter, serverFileConverter: ServerFileConverter) {
        this.evitaValueConverter = evitaValueConverter
        this.taskStateConverter = taskStateConverter
        this.serverFileConverter = serverFileConverter
    }

    convertTaskStatuses(grpcTaskStatuses: GrpcTaskStatusesResponse): PaginatedList<TaskStatus> {
        const taskStatuses: TaskStatus[] = []
        for (const grpcTaskStatus of grpcTaskStatuses.taskStatus) {
            taskStatuses.push(this.convert(grpcTaskStatus))
        }

        return new PaginatedList(
            ImmutableList(taskStatuses),
            grpcTaskStatuses.pageNumber,
            grpcTaskStatuses.pageSize,
            grpcTaskStatuses.totalNumberOfRecords
        )
    }

    convert(grpcTaskStatus: GrpcTaskStatus): TaskStatus {
        const taskTypes: string[] = grpcTaskStatus.taskType
            .split(',')
            .map(it => it.trim())
        const result: TaskResult | undefined = this.convertResult(
            grpcTaskStatus.result.case,
            grpcTaskStatus.result.value
        )
        return new TaskStatus(
            ImmutableList(taskTypes),
            grpcTaskStatus.taskName,
            this.evitaValueConverter.convertGrpcUuid(grpcTaskStatus.taskId!),
            grpcTaskStatus.catalogName,
            this.evitaValueConverter.convertGrpcOffsetDateTime(grpcTaskStatus.created!),
            grpcTaskStatus.issued != undefined
                ? this.evitaValueConverter.convertGrpcOffsetDateTime(grpcTaskStatus.issued!)
                : undefined,
            grpcTaskStatus.started != undefined
                ? this.evitaValueConverter.convertGrpcOffsetDateTime(grpcTaskStatus.started!)
                : undefined,
            grpcTaskStatus.finished != undefined
                ? this.evitaValueConverter.convertGrpcOffsetDateTime(grpcTaskStatus.finished!)
                : undefined,
            grpcTaskStatus.progress,
            grpcTaskStatus.settings!,
            result,
            grpcTaskStatus.exception,
            this.taskStateConverter.convertTaskState(grpcTaskStatus.simplifiedState),
            this.convertTaskTraits(grpcTaskStatus.trait)
        )
    }

    private convertResult(
        caseName: 'text' | 'file' | undefined,
        input: StringValue | GrpcFile | undefined
    ): TaskResult | undefined {
        if (caseName == undefined || input == undefined) {
            return undefined
        }
        switch (caseName) {
            case 'text': return new TextTaskResult((input as StringValue).value)
            case 'file': return new FileTaskResult(
                this.serverFileConverter.convert(input as GrpcFile)
            )
            default:
                throw new UnexpectedError(`Unsupported result type '${caseName}'.`)
        }
    }

    private convertTaskTraits(grpcTaskTraits: GrpcTaskTrait[]): ImmutableSet<TaskTrait> {
        const taskTraits: TaskTrait[] = []
        for (const grpcTaskTrait of grpcTaskTraits) {
            taskTraits.push(this.convertTaskTrait(grpcTaskTrait))
        }
        return ImmutableSet(taskTraits)
    }

    private convertTaskTrait(grpcTaskTrait: GrpcTaskTrait): TaskTrait {
        switch (grpcTaskTrait) {
            case GrpcTaskTrait.TASK_CAN_BE_STARTED: return TaskTrait.CanBeStarted
            case GrpcTaskTrait.TASK_CAN_BE_CANCELLED: return TaskTrait.CanBeCancelled
            case GrpcTaskTrait.TASK_NEEDS_TO_BE_STOPPED: return TaskTrait.NeedsToBeStopped
            default:
                throw new UnexpectedError(`Unsupported task trait '${grpcTaskTrait}'.`)
        }
    }
}

import { GrpcTaskStatusesResponse } from '../gen/GrpcEvitaManagementAPI_pb'
import { GrpcFile, GrpcTaskStatus } from '../gen/GrpcEvitaDataTypes_pb'
import { Uuid } from '@/modules/connection/model/data-type/Uuid'
import { OffsetDateTime } from '@/modules/connection/model/data-type/OffsetDateTime'
import Immutable from 'immutable'
import { StringValue } from '@bufbuild/protobuf'
import { TaskStateConverter } from './TaskStateConverter'
import { TaskStatus } from '@/modules/connection/model/task/TaskStatus'
import { PaginatedList } from '@/modules/connection/model/PaginatedList'
import { TaskResult } from '@/modules/connection/model/task/TaskResult'
import { TextTaskResult } from '@/modules/connection/model/task/TextTaskResult'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { ServerFileConverter } from '@/modules/connection/driver/grpc/service/ServerFileConverter'
import { GrpcTaskTrait } from '@/modules/connection/driver/grpc/gen/GrpcEnums_pb'
import { TaskTrait } from '@/modules/connection/model/task/TaskTrait'
import { FileTaskResult } from '@/modules/connection/model/task/FileTaskResult'

/**
 * Converts task statuses between evitaLab representation and evitaDB's gRPC
 * representation
 */
export class TaskStatusConverter {
    private readonly taskConverter: TaskStateConverter
    private readonly serverFileConverter: ServerFileConverter

    constructor(taskConverter: TaskStateConverter, fileConverter: ServerFileConverter) {
        this.taskConverter = taskConverter
        this.serverFileConverter = fileConverter
    }

    convertTaskStatuses(grpcTaskStatuses: GrpcTaskStatusesResponse): PaginatedList<TaskStatus> {
        const taskStatuses: TaskStatus[] = []
        for (const grpcTaskStatus of grpcTaskStatuses.taskStatus) {
            taskStatuses.push(this.convert(grpcTaskStatus))
        }

        return new PaginatedList(
            Immutable.List(taskStatuses),
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
            Immutable.List(taskTypes),
            grpcTaskStatus.taskName,
            Uuid.createUUID(
                grpcTaskStatus.taskId!.mostSignificantBits!,
                grpcTaskStatus.taskId!.leastSignificantBits!
            ),
            grpcTaskStatus.catalogName,
            new OffsetDateTime(
                grpcTaskStatus.created!.timestamp,
                grpcTaskStatus.created!.offset
            ),
            grpcTaskStatus.issued != undefined
                ? new OffsetDateTime(
                    grpcTaskStatus.issued!.timestamp,
                    grpcTaskStatus.issued!.offset
                )
                : undefined,
            grpcTaskStatus.started != undefined
                ? new OffsetDateTime(
                    grpcTaskStatus.started.timestamp,
                    grpcTaskStatus.started.offset
                )
                : undefined,
            grpcTaskStatus.finished != undefined
                ? new OffsetDateTime(
                    grpcTaskStatus.finished?.timestamp,
                    grpcTaskStatus.finished?.offset
                )
                : undefined,
            grpcTaskStatus.progress,
            grpcTaskStatus.settings!,
            result,
            grpcTaskStatus.exception,
            this.taskConverter.convertTaskState(grpcTaskStatus.simplifiedState),
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

    private convertTaskTraits(grpcTaskTraits: GrpcTaskTrait[]): Immutable.Set<TaskTrait> {
        const taskTraits: TaskTrait[] = []
        for (const grpcTaskTrait of grpcTaskTraits) {
            taskTraits.push(this.convertTaskTrait(grpcTaskTrait))
        }
        return Immutable.Set(taskTraits)
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

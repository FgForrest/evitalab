import { TaskStatuses } from '@/modules/connection/model/data/TaskStatuses'
import { GrpcTaskStatusesResponse } from '../gen/GrpcEvitaManagementAPI_pb'
import { TaskStatus } from '@/modules/connection/model/data/TaskStatus'
import { GrpcFile, GrpcTaskStatus } from '../gen/GrpcEvitaDataTypes_pb'
import { Uuid } from '@/modules/connection/model/data-type/Uuid'
import { OffsetDateTime } from '@/modules/connection/model/data-type/OffsetDateTime'
import { List } from 'immutable'
import { File } from '@/modules/connection/model/data/File'
import { StringValue } from '@bufbuild/protobuf'
import { TaskSimplifiedStateConverter } from './TaskSimplifiedStateConverter'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'

export class JobsConverter {
    private readonly taskConverter: TaskSimplifiedStateConverter

    constructor(taskConverter: TaskSimplifiedStateConverter) {
        this.taskConverter = taskConverter
    }

    convertJobs(job: GrpcTaskStatusesResponse): TaskStatuses {
        const files: GrpcTaskStatus[] = job.taskStatus
        const newFiles: TaskStatus[] = []

        for (const oldFile of files) {
            const file = this.convertResultFile(
                oldFile.result.case,
                oldFile.result.value
            )
                newFiles.push(
                    this.convertJob(oldFile)
                )
        }

        return new TaskStatuses(
            job.pageSize,
            job.pageNumber,
            List(newFiles),
            job.totalNumberOfRecords
        )
    }

    convertJob(oldFile: GrpcTaskStatus): TaskStatus {
        const file = this.convertResultFile(
            oldFile.result.case,
            oldFile.result.value
        )
        return new TaskStatus(
            oldFile.taskType,
            oldFile.taskName,
            Uuid.createUUID(
                oldFile.taskId?.mostSignificantBits!,
                oldFile.taskId?.leastSignificantBits!
            ),
            oldFile.catalogName!,
            new OffsetDateTime(
                oldFile.issued?.timestamp,
                oldFile.issued?.offset
            ),
            new OffsetDateTime(
                oldFile.started?.timestamp,
                oldFile.started?.offset
            ),
            new OffsetDateTime(
                oldFile.finished?.timestamp,
                oldFile.finished?.offset
            ),
            oldFile.progress,
            oldFile.settings!,
            file,
            oldFile.exception!,
            this.taskConverter.convertTaskState(oldFile.simplifiedState))
    }

    private convertResultFile(
        caseName: 'text' | 'file' | undefined,
        input: StringValue | GrpcFile | undefined
    ): string | File | undefined {
        if (caseName === undefined || input === undefined) return undefined
        if (caseName === 'text') {
            return (input as StringValue).value
        } else {
            const file = input as GrpcFile
            return new File(
                Uuid.createUUID(
                    file.fileId?.mostSignificantBits!,
                    file.fileId?.leastSignificantBits!
                ),
                file.name,
                file.description!,
                file.contentType,
                file.totalSizeInBytes,
                new OffsetDateTime(
                    file.created?.timestamp,
                    file.created?.offset
                ),
                file.origin!
            )
        }
    }
}

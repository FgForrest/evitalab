import { TaskState } from "./TaskState"
import { List as ImmutableList, Set as ImmutableSet } from 'immutable'
import { DateTime, Duration } from 'luxon'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { TaskResult } from '@/modules/database-driver/request-response/task/TaskResult'
import { TaskTrait } from '@/modules/database-driver/request-response/task/TaskTrait'

/**
 * Represents a single server task that is being processed by the evitaDB.
 */
export class TaskStatus {
    readonly taskTypes: ImmutableList<string>
    readonly taskName: string
    readonly taskId: Uuid
    readonly catalogName: string | undefined
    readonly created: OffsetDateTime
    readonly issued: OffsetDateTime | undefined
    readonly started: OffsetDateTime | undefined
    readonly finished: OffsetDateTime | undefined
    readonly progress: number
    readonly settings: string
    readonly result: TaskResult | undefined
    readonly exception: string | undefined
    readonly state: TaskState
    readonly traits: ImmutableSet<TaskTrait>

    private _cancelRequested: boolean = false
    private _duration?: Duration = undefined

    constructor(taskTypes: ImmutableList<string>,
                taskName: string,
                taskId: Uuid,
                catalogName: string | undefined,
                created: OffsetDateTime,
                issued: OffsetDateTime | undefined,
                started: OffsetDateTime | undefined,
                finished: OffsetDateTime | undefined,
                progress: number,
                settings: string,
                result: TaskResult | undefined,
                exception: string | undefined,
                state: TaskState,
                traits: ImmutableSet<TaskTrait>){
        this.taskTypes = taskTypes
        this.taskName = taskName
        this.taskId = taskId
        this.catalogName = catalogName
        this.created = created
        this.issued = issued
        this.started = started
        this.finished = finished
        this.progress = progress
        this.settings = settings
        this.result = result
        this.exception = exception
        this.state = state
        this.traits = traits
    }

    get mainTaskType(): string {
        return this.taskTypes.get(0)!
    }

    /**
     * Whether the task was cancelled by the user by was not yet propagated to server
     * and returned back with update.
     */
    get isCancelRequested(): boolean {
        return this._cancelRequested
    }

    cancelRequested(): void {
        if (!this._cancelRequested) {
            this._cancelRequested = true
        }
    }

    get duration(): Duration | undefined {
        if (this._duration == undefined || this.finished == undefined) {
            if (this.started == undefined) {
                this._duration = undefined
            } else {
                const startTime: number = Number(this.started.timestamp!.seconds) * 1000
                const endTime: number = this.finished != null
                    ? Number(this.finished.timestamp!.seconds) * 1000
                    : DateTime.now().toMillis()

                const duration: number = endTime - startTime
                this._duration = Duration.fromMillis(duration)
            }
        }
        return this._duration
    }
}

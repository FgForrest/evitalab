import { TaskState } from '@/modules/database-driver/request-response/task/TaskState'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { GrpcTaskSimplifiedState } from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'

/**
 * Converter for converting task states between evitaLab representation and
 * evitaDB gRPC representation
 */
export class TaskStateConverter {

    convertTaskStates(taskStates: GrpcTaskSimplifiedState[]): TaskState[] {
        const statuses: TaskState[] = []
        for(const status of taskStates) {
            statuses.push(this.convertTaskState(status))
        }
        return statuses
    }

    convertTaskStatesToGrpc(taskStates: TaskState[]): GrpcTaskSimplifiedState[] {
        const statuses: GrpcTaskSimplifiedState[] = [];
        for (const status of taskStates) {
            statuses.push(this.convertTaskStateToGrpc(status))
        }
        return statuses;
    }

    convertTaskStateToGrpc(state: TaskState):GrpcTaskSimplifiedState{
        switch (state) {
            case TaskState.WaitingForPrecondition:
                return GrpcTaskSimplifiedState.TASK_WAITING_FOR_PRECONDITION
            case TaskState.Failed:
                return GrpcTaskSimplifiedState.TASK_FAILED
            case TaskState.Finished:
                return GrpcTaskSimplifiedState.TASK_FINISHED
            case TaskState.Queued:
                return GrpcTaskSimplifiedState.TASK_QUEUED
            case TaskState.Running:
                return GrpcTaskSimplifiedState.TASK_RUNNING
            default:
                throw new UnexpectedError(`Unsupported task state '${state}'.`)
        }
    }

    convertTaskState(state: GrpcTaskSimplifiedState):TaskState{
        switch(state){
            case GrpcTaskSimplifiedState.TASK_WAITING_FOR_PRECONDITION:
                return TaskState.WaitingForPrecondition
            case GrpcTaskSimplifiedState.TASK_FAILED:
                return TaskState.Failed
            case GrpcTaskSimplifiedState.TASK_FINISHED:
                return TaskState.Finished
            case GrpcTaskSimplifiedState.TASK_QUEUED:
                return TaskState.Queued
            case GrpcTaskSimplifiedState.TASK_RUNNING:
                return TaskState.Running
            default:
                throw new UnexpectedError(`Unsupported task state '${state}'.`)
        }
    }
}

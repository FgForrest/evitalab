import Immutable from 'immutable'
import { TaskState } from '@/modules/database-driver/request-response/task/TaskState'

/**
 * Maps {TaskState} to a color for a chip
 */
export const taskStateToColorMapping: Immutable.Map<TaskState, string> = Immutable.Map([
    [TaskState.WaitingForPrecondition, ''],
    [TaskState.Queued, ''],
    [TaskState.Running, 'warning'],
    [TaskState.Finished, 'success'],
    [TaskState.Failed, 'error'],
])

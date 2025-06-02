/**
 * State of a server task
 */
export enum TaskState {
    WaitingForPrecondition = 'waitingForPrecondition',
    Queued = 'queued',
    Running = 'running',
    Finished = 'finished',
    Failed = 'failed'
}

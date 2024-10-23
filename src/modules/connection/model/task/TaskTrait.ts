/**
 * Supported traits of server tasks
 */
export enum TaskTrait {
    CanBeStarted = 'canBeStarted',
    CanBeCancelled = 'canBeCancelled',
    NeedsToBeStopped = 'needsToBeStopped'
}

import { SharedTabTroubleshooterCallback } from '@/modules/workspace/tab/service/SharedTabTroubleshooterCallback'
import { LabError } from '@/modules/base/exception/LabError'

export class InvalidConnectionInSharedTabError extends LabError {

    readonly originalConnectionName: string | undefined
    readonly troubleshooterCallback: SharedTabTroubleshooterCallback

    constructor(originalConnectionName: string | undefined,
                troubleshooterCallback: SharedTabTroubleshooterCallback) {
        super(
            'InvalidConnectionInSharedTabError',
            'Could not resolve shared tab'
        )
        this.originalConnectionName = originalConnectionName
        this.troubleshooterCallback = troubleshooterCallback
    }
}

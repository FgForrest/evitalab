import XXH from 'xxhashjs'
import { Connection } from '@/modules/connection/model/Connection'
import { TabType } from '@/modules/workspace/tab/model/TabType'

const hasher: XXH.HashObject = XXH.h64()

/**
 * History key for uniquely identifying a tab section's execution history (e.g., executed queries).
 * Key is serialized as a stringified hash that can be directly used in {@link Map}.
 * The generic type parameter R represents the type of history records associated with this key.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class TabHistoryKey<R = unknown> {
    readonly hash: string;

    constructor(connection: Connection, tabType: TabType, sectionPath: string[]) {
        const hashObject = hasher.update(connection.id).update(tabType)
        sectionPath.forEach(item => hashObject.update(item))
        this.hash = hashObject.digest().toString(16);
    }

    toString(): string {
        return this.hash;
    }
}

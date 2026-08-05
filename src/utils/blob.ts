/**
 * Accumulates a stream of byte chunks into a single {@link Blob} while keeping only a bounded window
 * of those chunks in the JS heap.
 *
 * `new Blob([chunk])` copies the bytes out of the JS heap into the engine's blob storage. Wrapping
 * chunks into intermediate blobs as soon as a window fills up therefore makes the already-consumed
 * `Uint8Array`s garbage immediately, so heap residency stays at roughly one window instead of growing
 * to the size of the whole file. The bytes still end up copied once into blob storage — that copy is
 * unavoidable without the File System Access API.
 */
export class WindowedBlobAccumulator {
    private readonly windowSizeInBytes: number
    private readonly parts: Blob[] = []
    private window: Uint8Array[] = []
    private windowBytes: number = 0

    /**
     * @param windowSizeInBytes number of accumulated bytes after which the current window is wrapped
     *        into an intermediate {@link Blob}
     */
    constructor(windowSizeInBytes: number) {
        if (windowSizeInBytes <= 0) {
            throw new Error('Window size must be a positive number of bytes.')
        }
        this.windowSizeInBytes = windowSizeInBytes
    }

    /**
     * Number of intermediate blobs created so far. Exposed for tests and diagnostics.
     */
    get partCount(): number {
        return this.parts.length
    }

    /**
     * Appends a chunk, flushing the current window into an intermediate blob once it reaches the
     * configured window size.
     */
    push(chunk: Uint8Array): void {
        this.window.push(chunk)
        this.windowBytes += chunk.length
        if (this.windowBytes >= this.windowSizeInBytes) {
            this.flush()
        }
    }

    /**
     * Wraps everything accumulated so far into the resulting blob. The accumulator must not be used
     * afterwards.
     */
    finish(): Blob {
        this.flush()
        return new Blob(this.parts)
    }

    private flush(): void {
        if (this.window.length === 0) {
            return
        }
        this.parts.push(new Blob(this.window))
        this.window = []
        this.windowBytes = 0
    }
}

import { UnexpectedError } from "@/modules/base/exception/UnexpectedError"

/**
 * Represents a driver model property value with supportability support. This to support cases
 * when a specific version of driver doesn't support particular value of the model. The UI can then
 * handle these cases using this wrapper.
 */
export class Value<T> {
    private readonly supported: boolean
    private readonly actualValue?: T

    private constructor(supported: boolean, actualValue: T) {
        this.supported = supported
        this.actualValue = actualValue
    }

    static notSupported<T>(): Value<T> {
        return new Value(false, undefined as T)
    }

    static of<T>(actualValue: T): Value<T> {
        return new Value(true, actualValue)
    }

    /**
     * Creates new value with transformed the actual value if supported.
     *
     * @param mapper mapper of the actual value if supported
     */
    map<N>(mapper: (value: T) => N): Value<N> {
        if (!this.supported) {
            return Value.notSupported()
        }
        return Value.of(mapper(this.actualValue!))
    }

    // todo docs
    isSupported(): boolean {
        return this.supported
    }

    /**
     * Provides the actual value (calls the given consumer) only if it is supported.
     * @param consumer called when the actual value is supported
     */
    ifSupported(consumer: (actualValue: T) => void): void {
        if (this.supported) {
            consumer(this.actualValue!)
        }
    }

    /**
     * Returns actual value if the value is supported or fallback value if not
     *
     * @param fallbackValue value returned if this value is not supported
     */
    getOrElse(fallbackValue: T): T {
        if (!this.supported) {
            return fallbackValue
        }
        return this.actualValue!
    }

    /**
     * Returns actual value if the value is supported or fallback value if not
     *
     * @param fallbackValue value returned if this value is not supported
     */
    getOrElseGet(fallbackValueSupplier: () => T): T {
        if (!this.supported) {
            return fallbackValueSupplier()
        }
        return this.actualValue!
    }

    // todo docs
    getIfSupported(): T | undefined {
        if (!this.supported) {
            return undefined
        }
        return this.actualValue!
    }

    //todo docs
    getOrThrow(): T {
        if(this.supported){
            return this.actualValue!
        } else {
            throw new UnexpectedError("Value is not supported");
        }
    }

    toString(): string {
        return String(this.actualValue)
    }
}

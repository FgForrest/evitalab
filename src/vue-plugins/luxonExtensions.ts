import { Duration, DurationLikeObject, DurationUnit, ToHumanDurationOptions } from 'luxon'
import { App, Plugin } from 'vue'

interface LuxonExtensionsOptions {}

const LuxonExtensions: Plugin = {
    install(app: App, options: LuxonExtensionsOptions) {
        // from https://github.com/moment/luxon/issues/1134#issuecomment-1282092129
        (Duration.prototype as any).__toHuman__ = Duration.prototype.toHuman;
        (Duration.prototype as any).toHuman = function (
            opts: ToHumanDurationOptions & {
                stripZeroUnits?: 'all' | 'end' | 'none';
                precision?: DurationLikeObject;
                maxUnits?: number;
                smallestUnit?: DurationUnit;
                biggestUnit?: DurationUnit;
            } = { stripZeroUnits: 'all' },
        ): string {
            let duration = this.normalize();
            let durationUnits = [];
            let precision =
                typeof opts.precision == 'object'
                    ? Duration.fromObject(opts.precision)
                    : Duration.fromMillis(0);
            let remainingDuration = duration;
            //list of all available units
            const allUnits = [
                'years',
                'months',
                'days',
                'hours',
                'minutes',
                'seconds',
                'milliseconds',
            ];
            let smallestUnitIndex;
            let biggestUnitIndex;
            // check if user has specified the smallest unit that should be displayed
            if (opts.smallestUnit) {
                smallestUnitIndex = allUnits.indexOf(opts.smallestUnit);
            }
            // check if user has specified a biggest unit
            if (opts.biggestUnit) {
                biggestUnitIndex = allUnits.indexOf(opts.biggestUnit);
            }
            // use seconds and years as default for smallest and biggest unit
            if (
                !smallestUnitIndex ||
                !(smallestUnitIndex >= 0 && smallestUnitIndex < allUnits.length)
            )
                smallestUnitIndex = allUnits.indexOf('seconds');
            if (
                !biggestUnitIndex ||
                !(
                    biggestUnitIndex <= smallestUnitIndex &&
                    biggestUnitIndex < allUnits.length
                )
            )
                biggestUnitIndex = allUnits.indexOf('years');

            for (let unit of allUnits.slice(biggestUnitIndex, smallestUnitIndex + 1)) {
                const durationInUnit = remainingDuration.as(unit);
                if (durationInUnit >= 1) {
                    durationUnits.push(unit);
                    let tmp: any = {};
                    tmp[unit] = Math.floor(remainingDuration.as(unit));
                    remainingDuration = remainingDuration
                        .minus(Duration.fromObject(tmp))
                        .normalize();

                    // check if remaining duration is smaller than precision
                    if (remainingDuration < precision) {
                        // ok, we're allowed to remove the remaining parts and to round the current unit
                        break;
                    }
                }

                // check if we have already the maximum count of units allowed
                if (opts.maxUnits && durationUnits.length >= opts.maxUnits) {
                    break;
                }
            }
            // after gathering of units that shall be displayed has finished, remove the remaining duration to avoid non-integers
            duration = duration.minus(remainingDuration).normalize();
            duration = duration.shiftTo(...durationUnits);
            if (opts.stripZeroUnits == 'all') {
                durationUnits = durationUnits.filter((unit) => duration.values[unit] > 0);
            } else if (opts.stripZeroUnits == 'end') {
                let mayStrip = true;
                durationUnits = durationUnits.reverse().filter((unit /*, index*/) => {
                    if (!mayStrip) return true;
                    if (duration.values[unit] == 0) {
                        return false;
                    } else {
                        mayStrip = false;
                    }
                    return true;
                });
            }

            // if `durationUnits` is empty (i.e. duration is zero), then just shift to the smallest unit
            if (!durationUnits.length) {
                durationUnits.push(allUnits[smallestUnitIndex]);
            }

            return duration.shiftTo(...durationUnits).__toHuman__(opts);
        };
    }
}
export default LuxonExtensions

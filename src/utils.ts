import humanizeDuration from 'humanize-duration';
import moment, {DurationInputArg1, DurationInputArg2} from "moment";

export async function allFulfilled<T>(promises: Promise<T>[]): Promise<T[]> {
    const mappedEntries = await Promise.allSettled(promises)

    return mappedEntries
        .filter(result => {
            const fulfilled = result.status === "fulfilled"
            if (!fulfilled)
                console.warn(result.reason)

            return fulfilled
        })
        .map(result => {
            const filteredResult = result as PromiseFulfilledResult<T>
            return filteredResult.value
        })
}

export async function sleep(duration: DurationInputArg1, unit?: DurationInputArg2): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, moment.duration(duration, unit).asMilliseconds()))
}

/**
 * Remove duplicate elements of an array beyond a given threshold value
 *
 * E.g. [3, 3, 3, 2, 2, 1] with threshold=2 would return [3, 3, 2, 2, 1]
 */
export function cleanDuplicates<T>(values: T[], eq: (a: T, b: T) => boolean = (a, b) => a === b, threshold: number = 1): T[] {
    const filteredValues: T[] = []

    values.forEach(element => {
        let existingCount = 0
        filteredValues.forEach(existingElement => {
            if (eq(element, existingElement))
                existingCount += 1
        })

        if (existingCount < threshold)
            filteredValues.push(element)
    })

    return filteredValues
}

export function cleanUndefined<T>(values: (T | undefined)[]): T[] {
    return values.filter(value => value !== undefined) as T[]
}

export function promiseMap<T, U>(values: T[], fn: (value: T) => Promise<U>): Promise<U[]> {
    return Promise.all(values.map(fn))
}

export type Brand<TYPE, TAG> = TYPE & { __brand: TAG }
export type BrandedBrand<TYPE, TAG> = TYPE & {
    __brand_2: TAG
}

export async function promiseFilter<T>(values: T[], predicate: (value: T) => Promise<boolean>) {
    const filtered = await promiseMap(values, async value => {
        const filter = await predicate(value);
        return filter ? undefined : value;
    });
    return cleanUndefined(filtered);
}

export function round(value: number, decimalPlacements: number) {
    const mult = 10 ** decimalPlacements
    return Math.round(value * mult) / mult
}

export function formatDate(now: moment.MomentInput) {
    return moment(now).utcOffset(0).format("YYYY-MM-DD HH:mm:ss Z");
}

// Define the type for the reducer callback function
type ReducerCallback<T, U> = (accumulator: T, currentValue: U) => Promise<T>;

/**
 * Asynchronous generator reducer function.
 *
 * @param generator - The asynchronous generator.
 * @param callback - The reducer callback function.
 * @param initialValue - The initial value of the accumulator.
 */
export async function asyncGeneratorReducer<T, U>(
    generator: AsyncGenerator<U>,
    callback: ReducerCallback<T, U>,
    initialValue: T
): Promise<T> {
    let accumulator = initialValue;

    // Loop over the generator's yielded values
    for await (const value of generator) {
        // Apply the callback function and update the accumulator
        accumulator = await callback(accumulator, value);
    }

    // Once all values have been processed, return the accumulated result
    return accumulator;
}

/**
 * Collects all values yielded by an asynchronous generator into an array.
 *
 * @param generator - The asynchronous generator.
 */
export async function collectArray<U>(generator: AsyncGenerator<U>): Promise<U[]> {
    // Use the asyncGeneratorReducer function to collect all values into an array
    return asyncGeneratorReducer<U[], U>(generator, async (acc, curr) => {
        acc.push(curr);
        return acc;
    }, []);
}

export async function* mapGenerator<T, U>(generator: AsyncGenerator<T>, callback: (value: T) => Promise<U>): AsyncGenerator<U> {
    for await (const value of generator)
        yield await callback(value)
}

export function filter<R, I>(array: (I | R)[], f: (value: I | R) => value is R): R[] {
    return array.filter(f) as R[];
}

// export async function startJob(action: string, interval: moment.Duration, func: () => Promise<void>) {
//     // sleep for a random interval from 0 to interval
//     const randomStart = moment.duration(Math.random() * interval.asMilliseconds());
//     console.log(`[${action}] Waiting ${formatDuration(randomStart)} before starting job...`);
//
//     await sleep(randomStart);
//
//     while (true) {
//         console.log(`Running job [${action}]...`);
//         await func();
//
//         // every 20 minutes, go through the database and refresh the access tokens
//         await sleep(interval)
//     }
// }
//
export function formatDuration(arg1: moment.DurationInputArg1, unit?: moment.unitOfTime.DurationConstructor) {
    return humanizeDuration(moment.duration(arg1, unit).asMilliseconds(), {
        largest: 2,
        round: true
    });
}

export function truncateString(str: string, maxLength: number) {
    // if description over 500 characters, truncate it and add ellipsis
    if (str.length > maxLength) {
        return str.substring(0, maxLength) + "...";
    }
    return str;
}

export function getErrorMessageStatic(e: unknown) {
    if (e instanceof Error) return e.message;
    if (e) return e.toString();
    return 'Unknown error';
}

export function getErrorText(e: unknown) {
    if (typeof e === "object" && e && "message" in e && "stack" in e && typeof e.stack === "string") {
        return e.stack.replace(/(\n    at[^\n]+)+$/, "")
    }
}
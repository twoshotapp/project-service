import {RateLimiterResponse} from "redis-sliding-rate-limiter";
import {formatDuration} from "../utils.js";

export class CostUsageExceededError extends Error {
    constructor(public limit: RateLimiterResponse) {
        const remaining = Date.now() - limit.firstExpireAtMs;
        super(`Request blocked due to rate limit: ${limit.remaining} requests remaining in ${formatDuration(remaining, "ms")}`);
    }
}

// TODO:
//     type LimitExceeded = { time: Moment, type: "day" | "week" | "month" };
//     export class CostUsageExceededError extends Error {
//         constructor(readonly limitExceeded: LimitExceeded) {
//             super("User has exceeded their cost usage limit: " + JSON.stringify(limitExceeded));
//         }
//     }
export class IterationLimitReachedError extends Error {
    constructor(iterations: number, message?: string) {
        super(`Iteration limit of ${iterations} reached`);
    }
}

export class GptIterationLimitReachedError extends Error {
    constructor(iterations: number, message?: string) {
        super(`Iteration limit of ${iterations} reached`);
    }
}

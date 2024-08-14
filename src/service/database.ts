import pkg from 'pg';
import {getRequiredNumericEnvVar} from "../env.js"
import {Brand} from "../utils.js";

const {DatabaseError, Pool, types} = pkg;

types.setTypeParser(20, BigInt) // Type Id 20 = BIGINT | BIGSERIAL
// @ts-ignore
BigInt.prototype.toJSON = function () {
    return this.toString()
}

const dbPort = getRequiredNumericEnvVar("DB_PORT")

const client = new Pool({
    port: dbPort,
    host: process.env.DB_HOST,
    ssl: process.env.DB_SSL === "true" ? {
        rejectUnauthorized: false,
    } : false,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
})

function getOptionalRow<T>(rows: T[]): T | null {
    if (rows.length === 0) {
        return null
    }
    if (rows.length === 1) {
        return rows[0]
    }

    throw new Error(`Expected 1 result, got ${rows.length}`)
}

export async function execute(queryString: any, ...params: any[]) {
    return client.query(queryString, params)
}

export async function findAll<T>(queryString: any, ...params: any[]): Promise<T[]> {
    const result = await execute(queryString, ...params)
    return result.rows as T[]
}


export async function findOneOptional<T>(queryString: any, ...params: any[]): Promise<T | null> {
    const rows = await findAll<T>(queryString, ...params)
    return getOptionalRow(rows)
}

export class NotFoundError extends Error {
}

export async function findOne<T>(queryString: any, ...params: any[]): Promise<T> {
    const result = await findOneOptional<T>(queryString, ...params)
    if (result === null)
        throw new NotFoundError(`No row found for query: ${queryString} with params: ${params}`)
    return result
}

export async function findOneOptionalField<T>(queryString: any, ...params: any[]): Promise<T | null> {
    const result = await client.query<any>(queryString, params)
    let field: string
    if (result.fields.length === 1) {
        field = result.fields[0].name
    } else {
        throw new Error(`Expected 1 field, got ${result.fields.length}`)
    }

    const row = getOptionalRow(result.rows)

    if (row === null)
        return null

    if (!(field in row))
        throw new Error("Field not present in result row")

    return row[field]
}

export async function findAllField<T>(queryString: any, ...params: any[]): Promise<T[]> {
    const result = await client.query<any>(queryString, params)
    let field: string
    if (result.fields.length === 1) {
        field = result.fields[0].name
    } else {
        throw new Error(`Expected 1 field, got ${result.fields.length}`)
    }

    return result.rows.map(r => r[field])
}

export async function findOneField<T>(queryString: any, ...params: any[]): Promise<T> {
    const optionalField = await findOneOptionalField<T>(queryString, ...params)
    if (optionalField === null)
        throw new Error("Field not found")

    return optionalField
}

/**
 * according to: https://www.postgresql.org/docs/12/errcodes-appendix.html
 */
export enum PsqlErrorCode {
    UNIQUE_ERROR = "23505",
    FOREIGN_KEY_VIOLATION = "23503",
    CHECK_VIOLATION = "23514",
    NOT_NULL_VIOLATION = "23502",
}

export type PGBigInt = bigint;
export type PGTimestamp = Brand<number, "pg-timestamp">

export function getDatabaseErrorCode(error: any): PsqlErrorCode | undefined {
    if (error instanceof DatabaseError) {
        return error.code as PsqlErrorCode
    }
    return undefined
}
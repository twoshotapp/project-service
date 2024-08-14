import {getRequiredEnvVar} from "../env.js";
import jwt from "jsonwebtoken";

const publicKeyPem = getRequiredEnvVar("TWOSHOT_AUTH_PUBLIC_KEY");

type DecodedToken = { exp: number, sub: number, typ: "rt" | "at" };

export function decodeToken(token: string): DecodedToken {
    const decodedToken = jwt.verify(token, publicKeyPem, {algorithms: ['ES256']});

    // assert matches DecodedToken
    if (!decodedToken || typeof decodedToken !== "object") {
        throw new Error("Invalid token");
    }

    if (!("exp" in decodedToken) || typeof decodedToken.exp !== "number") {
        throw new Error("Invalid token - missing exp");
    }

    if (!("sub" in decodedToken) || typeof decodedToken.sub !== "number") {
        throw new Error("Invalid token - missing sub");
    }

    if (!("typ" in decodedToken) || typeof decodedToken.typ !== "string") {
        throw new Error("Invalid token - missing typ");
    }

    if (decodedToken.typ !== "rt" && decodedToken.typ !== "at") {
        throw new Error("Invalid token - typ must be 'rt' or 'at'");
    }

    return decodedToken as unknown as DecodedToken;
}

function assertValidToken(token: string) {
    const decoded = decodeToken(token);

    const now = new Date().getTime() / 1000;

    if (decoded.exp - now < 10) {
        throw new Error("Token is expired");
    }

    return decoded;
}

export function assertValidAccessToken(token: string): void {
    const decoded = assertValidToken(token);

    if (decoded.typ !== "at") {
        throw new Error("Token is not an access token");
    }
}
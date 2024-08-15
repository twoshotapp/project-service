import express from "express";
import {getRequiredNumericEnvVar} from "../env.js";
import {StatusCode} from "status-code-enum";
import {assertValidAccessToken} from "../service/auth.js";
import * as OpenApiValidator from "express-openapi-validator"

const port = getRequiredNumericEnvVar("PORT");
const app = express();

app.use(express.urlencoded({extended: false})); // This is needed to parse the body of incoming POST requests
app.use(express.json()); // This is needed to parse the body of incoming POST requests

app.use(express.urlencoded({extended: true}))

app.use((req, res, next) => {
    // assert valid token using TwoShotTokens.assertValidAccessToken
    const header = req.headers.authorization;
    if (!header) {
        res.sendStatus(StatusCode.ClientErrorUnauthorized);
        return
    }
    try {
        assertValidAccessToken(header);
    } catch (e) {
        console.error("Invalid access token", e);
        res.sendStatus(StatusCode.ClientErrorUnauthorized);
        return
    }

    next()
})

app.use(express.json({strict: false}))
app.use(OpenApiValidator.middleware({apiSpec: "./schema/openapi.yml"}))

/**
 * Client error handler
 */
// @ts-ignore TODO: no types for express 5
app.use((err: unknown, _req, res, _next) => {
    // if (err instanceof AxiosError) {
    //     console.error("Uncaught error in request:", err.response?.status, err.response?.data)
    //
    //     res.sendStatus(HttpStatusCode.InternalServerError);
    //     return
    // }
    console.error("Uncaught error in request:", err)
    res.sendStatus(StatusCode.ServerErrorInternal)
})

app.listen(port, () => {
    console.log(`Express server listening on port ${port}`);
});
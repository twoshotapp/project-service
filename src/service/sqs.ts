import {getRequiredEnvVar} from "../env.js";
import {
    ChangeMessageVisibilityCommand,
    DeleteMessageCommand,
    ReceiveMessageCommand,
    SQSClient
} from "@aws-sdk/client-sqs";

const awsRegion = getRequiredEnvVar("AWS_REGION");
const awsAccessKey = getRequiredEnvVar("AWS_ACCESS_KEY_ID");
const awsSecretKey = getRequiredEnvVar("AWS_SECRET_ACCESS_KEY");
export const deduplicateAudioQueueURL = getRequiredEnvVar("DEDUPLICATE_AUDIO_SQS_QUEUE_URL");

export const sqsClient = new SQSClient({
    region: awsRegion,
    endpoint: process.env.SQS_ENDPOINT,
    credentials: {
        accessKeyId: awsAccessKey,
        secretAccessKey: awsSecretKey,
    },
});


export async function* pullMessages(queueUrl: string, {abortSignal, ...opts}: {
    MaxNumberOfMessages?: number,
    VisibilityTimeout?: number,
    WaitTimeSeconds?: number,
    abortSignal?: AbortSignal
} = {}) {
    // console.debug(`Pulling messages from ${queueUrl}`)
    const data = await sqsClient.send(new ReceiveMessageCommand({
        MessageAttributeNames: ["All"],
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        VisibilityTimeout: opts?.VisibilityTimeout ?? 180,
        WaitTimeSeconds: 20,
        ...opts
    }), {
        abortSignal
    });

    if (data.Messages) {
        for (const message of data.Messages) {
            const handle = message.ReceiptHandle;
            if (!message.Body) {
                console.warn('No body in message', handle);
                continue;
            }
            yield {body: JSON.parse(message.Body), handle};
        }
    }
}

export async function processMessages<T>(queueUrl: string, handler: (body: T) => Promise<void>, visiblityTimeout: number) {
    console.debug(`Processing messages from ${queueUrl}`);

    let currentHandle: string | undefined = undefined;

    async function resetMessage(handle: string | undefined) {
        if (!handle) return;
        await sqsClient.send(new ChangeMessageVisibilityCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: handle,
            VisibilityTimeout: Math.min(visiblityTimeout, 60), // 1 minute
        }));
    }

    process.on('SIGINT', async () => {
        resetMessage(currentHandle);
        process.exit(1);
    });

    process.on('exit', () => resetMessage(currentHandle));


    while (true) {
        for await (const {body, handle} of pullMessages(queueUrl, {VisibilityTimeout: visiblityTimeout})) {
            currentHandle = handle;
            try {
                await handler(body);

                await sqsClient.send(new DeleteMessageCommand({
                    QueueUrl: queueUrl,
                    ReceiptHandle: handle,
                }));
                currentHandle = undefined
            } catch (e) {
                console.error("Error processing job", e);

                // Change the visibility timeout to 1 minute if an error occurs
                await resetMessage(handle);
                currentHandle = undefined
            }
        }
    }
}
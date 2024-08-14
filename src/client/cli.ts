import readline from 'readline';
import {AudioId, FolderId, GenerationId, ModelId, SampleId, UserId} from "../model/id.js";
import {processMessageAiva} from "../service/assistant.js";
import {reportAssistantConnect, reportAssistantDisconnect} from "../service/assistant-event.js";
import {TwoShotTokens} from "../service/auth.js";
import {downloadAudio, ModelFilters, SampleFilters, SamplePackFilters} from "../plugin/twoshot.js";
import {Beats, ClipId, ClipSpeed, Seconds, TrackId} from "../plugin/studio.js";

function getUserInput(): Promise<string> {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Enter your message: ', (input) => {
            rl.close();
            resolve(input);
        });
    });
}

const tokens = new TwoShotTokens("eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiIxMjgiLCJ0eXAiOiJydCIsImV4cCI6MTcyNDUzMjI3NSwiaWF0IjoxNzIxOTQwMjc1fQ.f5TODnwkQRUt_TLzcXWG-FAi7MLMkUpgOuNF0C5sDtBY-vLiJCeTOMdt4RIKuOi8bigYQqgFtito7xUBcf3vuA")
const sessionId = await reportAssistantConnect("cli", {userId: tokens.userId});

// on exit, send the disconnect event
process.on('SIGINT', async () => {
    await reportAssistantDisconnect(sessionId)
    process.exit(0)
})

// on exit, send the disconnect event
process.on('exit', () => reportAssistantDisconnect(sessionId))

while (true) {
    try {
        console.log('Waiting for user input...')
        const message = await getUserInput();

        await processMessageAiva(sessionId,
            message,
            {
                downloadAudio(audioId: AudioId, sampleId?: SampleId) {
                    return downloadAudio(audioId, sampleId, tokens)
                },
                sendMessageUser(message: string) {
                    console.log(`Sending message: `, message);
                },
                navigateProfile(userId) {
                    console.log(`Navigating to profile ${userId}`)
                },
                navigateModel(modelId) {
                    console.log(`Navigating to model ${modelId}`)
                },
                navigateFolder(folderId) {
                    console.log(`Navigating to folder ${folderId}`)
                },
                navigateSample(sampleId) {
                    console.log(`Navigating to sample ${sampleId}`)
                },
                login() {
                    console.log(`Aiva requested user login`)
                },
                signup() {
                    console.log(`Aiva requested user signup`)
                },
                notifyProcessingFinished() {
                    console.log(`Aiva notified processing finished`)
                },
                notifyProcessingStarted() {
                    console.log(`Aiva notified processing started`)
                },
                showUpgrade(message?: string) {
                    console.log(`Aiva requested upgrade: ${message}`)
                },
                showSample(sampleId: SampleId) {
                    console.log(`Aiva requested show sample ${sampleId}`)
                },
                showModel(modelId) {
                    console.log(`Aiva requested show model ${modelId}`)
                },
                showSamplePack(folderId) {
                    console.log(`Aiva requested show sample pack ${folderId}`)
                },
                sendMessageWithSuggestedResponses(message: string, suggestedResponses: string[]) {
                    console.log(`Aiva requested message with suggested responses ${message} ${suggestedResponses}`)
                },
                showUser(userId) {
                    console.log(`Aiva requested show user ${userId}`)
                },
                showAudio(audioId: AudioId) {
                    console.log(`Aiva requested show audio ${audioId}`)
                },
                showModels(modelIds: ModelId[], query?: ModelFilters) {
                    console.log(`Aiva requested show models ${modelIds} ${query}`)
                },
                showSamples(sampleIds: SampleId[], query?: SampleFilters) {
                    console.log(`Aiva requested show samples ${sampleIds} ${query}`)
                },
                showGenerationJob(generationId: GenerationId) {
                    console.log(`Aiva requested show generation job ${generationId}`)
                },
                showSamplePacks(folderIds: FolderId[], query?: SamplePackFilters) {
                    console.log(`Aiva requested show sample packs ${folderIds} ${query}`)
                },
                showUsers(userIds: UserId[]) {
                    console.log(`Aiva requested show users ${userIds}`)
                },
                promptAudioInput() {
                    console.log(`Aiva requested prompt sample input`)
                },
                openJam() {
                    console.log(`Aiva requested opening the TwoShot studio`)
                },
                createTrack(name: string) {
                    console.log(`Aiva requested creating track in the TwoShot studio`)
                },
                deleteTrack(trackId: TrackId) {
                    console.log(`Aiva requested deleting track in the TwoShot studio`)
                },
                deleteClip(clipId: ClipId) {
                    console.log(`Aiva requested deleting clip in the TwoShot studio`)
                },
                createClip(id: ClipId, audioId: AudioId, position?: Beats, name?: string, sampleId?: SampleId, trackId?: TrackId, cutStart?: Seconds, cutEnd?: Seconds, speed?: ClipSpeed, volume?: number, muted?: boolean) {
                    console.log(`Aiva requested creating clip in the TwoShot studio`)
                }
            },
            tokens,
            null,
            null,
            null)
    } catch (e) {
        console.error(e)
    }
}
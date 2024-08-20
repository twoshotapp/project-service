import {AudioId, GenerationJobId, SampleId, UUID} from "./id.js";
import {Brand, BrandedBrand} from "../utils.js";

export type HSL = {
    hue: number;
    saturation: number;
    lightness: number;
}


export type Beats = Brand<number, "beats">
export type Seconds = Brand<number, "seconds">
export type Pixels = Brand<number, "pixels">
export type Percent = Brand<number, "percent">

export type ProjectId = BrandedBrand<UUID, "project-id">;
export type ClipId = BrandedBrand<UUID, "clip-id">;
export type TrackId = BrandedBrand<UUID, "track-id">;

export type ClipPosition = Beats;

export type StudioProject = {
    id: ProjectId,
    name: string,
    // public: boolean,
    created: Date,
    updated: Date,
    // ownerId: UserId,

    /**
     * Beats per minute
     */
    tempo: number,
    /**
     * Number of beats per grid line
     */
    grid: Beats,
    snapToGrid: boolean,
    playHead: {
        start: Beats,
        end?: Beats,
    },

    soloTarget?: { track: TrackId } | { clip: ClipId },
    tracks: ProjectTrack[],
}
export type ProjectTrack = {
    name?: string,
    id: TrackId,

    clips: AudioClip[], // ordered by position

    /**
     * Pan from -1 to 1
     */
    pan: number,
    loopEvery?: Beats | "auto",
    /**
     * Volume from 0 to 1
     */
    volume: Percent,
    muted: boolean,
}
export type ClipSpeed = Percent | "tempo-sync";

export type AudioSourceInfo =
    ({ sampleId?: SampleId } | { generationJobId: GenerationJobId, outputName: string }) &
    {
        /**
         * @cached
         */
        duration: Seconds // TODO: replace these cached vars with real values from AudioSources - will mean we cant do certain actions until we load in the items
        /**
         * Tempo in beats per minute
         * @cached
         */
        tempo?: number,
        colour?: HSL,
        audioId: AudioId
    };

export type AudioClip = {
    id: ClipId,
    source: AudioSourceInfo,
    pitchOffset?: number,
    reversed?: boolean,
    name: string | null,
    color: HSL,
    /**
     * Speed multiplier
     */
    speed: ClipSpeed,
    /**
     * Position in beats
     */
    position: Beats,
    /**
     * Start time as percentage (envelope)
     */
    cutStart: Seconds,
    /**
     * End time as percentage (envelope)
     */
    cutEnd: Seconds,
    /**
     * Volume from 0 to 1
     */
    volume: Percent,
    /**
     * Pan from -1 to 1
     */
    pan: number,
    muted: boolean
}
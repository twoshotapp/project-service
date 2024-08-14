import {Brand} from "../utils.js";

export type UserId = Brand<bigint, "user-id">;
export type SampleId = Brand<bigint, "sample-id">;
export type ModelId = Brand<bigint, "model-id">;
export type FolderId = Brand<bigint, "folder-id">;
export type UUID = Brand<string, "uuid">;
export type AudioId = Brand<UUID, "audio-id">;
export type GenerationJobId = Brand<UUID, "generation-id">;

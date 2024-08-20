// create table studio_project
// (
//     id           uuid      default uuid_generate_v4() primary key,
//     name         text,
//     created      timestamp default now() not null,
//     updated      timestamp default now() not null,
//     tempo        double precision,
//     grid         double precision,
//     snap_to_grid boolean   default false not null,
//     play_head    jsonb,
//     solo_target  jsonb
// );
//
// create table project_track
// (
//     id         uuid default uuid_generate_v4() primary key,
//     name       text,
//     pan        double precision not null,
//     volume     double precision not null,
//     muted      boolean          not null,
//
//     project_id uuid
//         references studio_project
//             on delete cascade
// );
//
// create table project_track_clip
// (
//     id                     uuid default uuid_generate_v4() primary key,
//
//     colour_h               double precision not null,
//     colour_s               double precision not null,
//     colour_l               double precision not null,
//
//
//     audio_id               uuid             not null references audio,
//
//     sample_id              uuid,
//     generation_job_id      uuid,
//     generation_output_name text,
//
//     pitch_offset           double precision,
//     reversed               boolean          not null,
//     name                   text,
//     speed                  text             not null /* "tempo-sync" | number */,
//     position               double precision not null,
//     cut_start              double precision not null,
//     cut_end                double precision not null,
//     volume                 double precision not null,
//     pan                    double precision not null,
//     muted                  boolean          not null,
//
//     track_id               uuid
//         references project_track
//             on delete cascade
// );

import {AudioClip, ClipId, ProjectId, ProjectTrack, StudioProject, TrackId} from "../model/project.js";
import {execute, findAllField, findOneField} from "./database.js";
import {AudioId} from "../model/id.js";
import {deduplicateAudioQueueURL, processMessages} from "./sqs.js";

export async function createClip(trackId: TrackId, clip: AudioClip) {
    const source = clip.source;
    const isGenerationSource = "generationJobId" in source;
    return execute(`insert into project_track_clip (colour_h, colour_s, colour_l, audio_id, sample_id,
                                                    generation_job_id, generation_output_name, pitch_offset, reversed,
                                                    name, speed, position, cut_start, cut_end, volume, pan, muted,
                                                    track_id)
                    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        clip.color?.hue,
        clip.color?.saturation,
        clip.color?.lightness,
        source.audioId,
        isGenerationSource ? null : source.sampleId,
        isGenerationSource ? source.generationJobId : null,
        isGenerationSource ? source.outputName : null,
        clip.pitchOffset,
        clip.reversed,
        clip.name,
        clip.speed,
        clip.position,
        clip.cutStart,
        clip.cutEnd,
        clip.volume,
        clip.pan,
        clip.muted,
        trackId);
}

export async function createTrack(projectId: ProjectId, track: ProjectTrack) {
    const trackId = await findOneField<TrackId>(`insert into project_track (name, pan, volume, muted, project_id)
                                                 values ($1, $2, $3, $4, $5)
                                                 returning id`,
        track.name, track.pan, track.volume, track.muted, projectId);

    for (const clip of track.clips) {
        await createClip(trackId, clip);
    }

    return trackId;
}

export async function insertProject(project: StudioProject) {
    // insert project, then the tracks, then the clips
    const projectId = await findOneField<ProjectId>(`insert into studio_project (name, tempo, grid, snap_to_grid, play_head, solo_target)
                                                     values ($1, $2, $3, $4, $5, $6)
                                                     returning id`,
        project.name, project.tempo, project.grid, project.snapToGrid, project.playHead, project.soloTarget);

    for (const track of project.tracks) {
        await createTrack(projectId, track);
    }

    return projectId;
}

// export async function getFullProject(projectId: ProjectId) {
//     return findOne<{
//
//     }>(`select *,
//        (select jsonagg(project_track)
//         from project_track
//         where project_id = $1)
// from studio_project
// where id = $1`, projectId);
// }

export async function updateProject(projectId: ProjectId, project: StudioProject) {
    const result = await execute(`update studio_project
                                  set name         = $1,
                                      tempo        = $2,
                                      grid         = $3,
                                      snap_to_grid = $4,
                                      play_head    = $5,
                                      solo_target  = $6
                                  where id = $7`,
        project.name, project.tempo, project.grid, project.snapToGrid, project.playHead, project.soloTarget, projectId);

    const affectedRows = result.rowCount;
    if (affectedRows === 0) {
        throw new Error(`No project found with id: ${projectId}`);
    }

    // update tracks
    for (const track of project.tracks) {
        const trackId = track.id;
        if (trackId) {
            const result = await execute(`update project_track
                                          set name   = $1,
                                              pan    = $2,
                                              volume = $3,
                                              muted  = $4
                                          where id = $5`,
                track.name, track.pan, track.volume, track.muted, trackId);
            const affectedRows = result.rowCount;
            if (affectedRows === 0) {
                throw new Error(`No track found with id: ${trackId}`);
            }
        } else {
            await createTrack(projectId, track);
        }

        // update clips
        for (const clip of track.clips) {
            if (clip.id) {
                const result = await execute(`update project_track_clip
                                              set colour_h               = $1,
                                                  colour_s               = $2,
                                                  colour_l               = $3,
                                                  audio_id               = $4,
                                                  sample_id              = $5,
                                                  generation_job_id      = $6,
                                                  generation_output_name = $7,
                                                  pitch_offset           = $8,
                                                  reversed               = $9,
                                                  name                   = $10,
                                                  speed                  = $11,
                                                  position               = $12,
                                                  cut_start              = $13,
                                                  cut_end                = $14,
                                                  volume                 = $15,
                                                  pan                    = $16,
                                                  muted                  = $17
                                              where id = $18`,
                    clip.color?.hue,
                    clip.color?.saturation,
                    clip.color?.lightness,
                    clip.source.audioId,
                    "sampleId" in clip.source ? clip.source.sampleId : null,
                    "generationJobId" in clip.source ? clip.source.generationJobId : null,
                    "generationJobId" in clip.source ? clip.source.outputName : null,
                    clip.pitchOffset,
                    clip.reversed,
                    clip.name,
                    clip.speed,
                    clip.position,
                    clip.cutStart,
                    clip.cutEnd,
                    clip.volume,
                    clip.pan,
                    clip.muted,
                    clip.id);

                const affectedRows = result.rowCount;
                if (affectedRows === 0) {
                    throw new Error(`No clip found with id: ${clip.id}`);
                }
            } else {
                await createClip(trackId, clip);
            }
        }
    }
}

export async function findClipProjectId(clipId: ClipId) {
    return findOneField<ProjectId>(`select project_id
                                    from project_track
                                    where id = (select track_id from project_track_clip where id = $1)`,
        clipId);
}

// subscribe to SQS notifications, updating any affected clips
processMessages(deduplicateAudioQueueURL, async (message: {
        removeDuplicate: AudioId,
        originalReplacement: AudioId
    }) => {
        const {removeDuplicate, originalReplacement} = message;

        const updated = await findAllField<ClipId>(`update project_track_clip
                                                    set audio_id = $1
                                                    where audio_id = $2
                                                    returning id
            `,
            originalReplacement, removeDuplicate);

        if (updated.length > 0) {
            console.log(`Updated ${updated.length} clips to use ${originalReplacement}`);

            // now publish to affected projects, by finding the project ids for all clips
            const projectIds = await findAllField(`select project_id from project_track where id in (select track_id from project_track_clip where id = any($1))`,
                updated);


        }
    },
    60)
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

import {StudioProject} from "../model/project.js";
import {execute, findOneField} from "./database.js";
import {UUID} from "../model/id.js";

export async function insertProject(project: StudioProject) {
    // insert project, then the tracks, then the clips
    const projectId = await findOneField<UUID>(`insert into studio_project (name, tempo, grid, snap_to_grid, play_head, solo_target)
 values ($1, $2, $3, $4, $5, $6) returning id`,
        project.name, project.tempo, project.grid, project.snapToGrid, project.playHead, project.soloTarget);

    for (const track of project.tracks) {
        const trackId = await findOneField<UUID>(`insert into project_track (name, pan, volume, muted, project_id)
    values ($1, $2, $3, $4, $5) returning id`,
            track.name, track.pan, track.volume, track.muted, projectId);

        for (const clip of track.clips) {
            const source = clip.source;
            const isGenerationSource = "generationJobId" in source;
            await execute(`insert into project_track_clip (colour_h, colour_s, colour_l, audio_id, sample_id, generation_job_id, generation_output_name, pitch_offset, reversed, name, speed, position, cut_start, cut_end, volume, pan, muted, track_id)
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
    }
}
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

export async function insertProject(project: StudioProject) {


}
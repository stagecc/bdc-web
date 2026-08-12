# External Sync Sources

This directory contains config files for external documentation sources that are synced at build time.

## Files

- `source.schema.json`: schema for each source YAML file.
- `readme-sevenbridges.yaml`: initial ReadMe source configuration.

## Source file shape

Each `*.yaml` file defines one source and includes:

- Source metadata (`id`, `type`, `base_url`)
- Output placement (`output_dir`, `sidebar_section`)
- Sync behavior (`strict_missing`, `link_policy`)
- Source badge metadata (`badge`)
- Explicit page allowlist (`pages[]`)

`pages[]` supports:

- `target_path` (required): source page path
- `title` (optional): override title
- `result_path` (optional): output path under `output_dir`

If `result_path` is omitted, it is derived from `target_path`.

## Adapter flow (draft)

1. Load all source YAML files and validate against `source.schema.json`.
2. For each source, create a deterministic mapping table:
   - `source_url` = `base_url` + `target_path`
   - `local_slug` = `output_dir` + (`result_path` or derived path)
3. Fetch page content via source adapter (ReadMe first).
4. Fail the build if any configured page cannot be fetched when `strict_missing: true`.
5. Transform fetched content into Starlight-compatible markdown:
   - normalize frontmatter/title
   - rewrite image and asset URLs
   - preserve code blocks/tables where possible
6. Rewrite links inside page content using the mapping table:
   - mirrored target -> rewrite to local slug
   - non-mirrored target -> externalize or fail based on `link_policy`
7. Inject a synced-source callout when `badge.enabled: true`:
   - includes source label and canonical source URL
8. Write generated markdown into `src/content/docs/{output_dir}`.
9. Emit source manifest JSON (sync timestamp, counts, unresolved links, source metadata).

## Build integration (draft)

- Continue using build-time sync in CI like GitBook sync.
- Add an external sync step before `astro build`.
- Keep generated external docs and manifests ignored by git, matching existing GitBook behavior.

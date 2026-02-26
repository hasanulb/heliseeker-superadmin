# Merit Project Architecture Blueprint

This document captures the architecture pattern used in this project and turns it into a copy-ready blueprint for a fresh Next.js App Router app.

## 1) Core Rules (Must Follow)

1. Use feature-first routing under `src/app` with nested dynamic route folders.
2. Keep feature internals in underscored folders: `_components`, `_contexts`, `_hooks`, `_schemas`, `_types`, `_constants`, `_utils`.
3. Use shared custom UI from `src/components/custom` (especially form wrappers in `src/components/custom/form`).
4. All forms must use `react-hook-form` + `zod` schema validation.
5. All client data fetching and mutation must use `tRPC + React Query` (`trpc.<router>.<procedure>.useQuery/useMutation`).
6. All database access must be inside server routers using Drizzle (`src/db/index.ts` + `drizzle/schema.ts`).
7. Do not call DB from UI layers.
8. Do not use direct `fetch`/`axios`/service-class calls inside feature components, hooks, or contexts.

## 2) Target Folder Structure

Use this structure as baseline:

```text
src/
  app/
    _trpc/
      client.ts
      Provider.tsx
    api/
      trpc/
        [trpc]/
          route.ts
    (protected)/
      <module-name>/
        <entity-group>/
          [<entity-id>]/
            <feature-name>/
              _components/
              _constants/
              _contexts/
              _hooks/
              _schemas/
              _types/
              _utils/
              create/
                _components/
                _constants/
                _contexts/
                _hooks/
                _schemas/
                _types/
                _utils/
                page.tsx
              [<feature-record-id>]/
                _components/
                page.tsx

  components/
    custom/
      buttons/
      form/
      section/
      table/
      index.ts
    sections/
      index.ts

  db/
    index.ts

  server/
    trpc.ts
    index.ts
    routers/
      auth.ts
      master.ts
      <module-name>.ts
      <another-module>.ts
      ...

drizzle/
  schema.ts
```

## 3) Feature Module Contract

For each feature (example: `<feature-name>`):

- `_schemas`: zod schemas and inferred form types.
- `_types`: feature-specific API/view types.
- `_constants`: static labels/options/default values.
- `_utils`: pure helpers (formatters, local adapters).
- `_contexts`: UI/form state provider only (no server calls).
- `_hooks`: orchestration hooks (use only `trpc` hooks for server IO).
- `_components`: page sections and form blocks.
- `page.tsx`: route entry, layout composition, provider wiring.

## 4) UI/Form Layer Pattern

Use custom field wrappers from `src/components/custom/form` so all fields are consistent and RHF-ready.

Example:

```tsx
<FormFieldTextInput control={form.control} name="overview.client_name" label="Client Name" />
<FormFieldSelect control={form.control} name="overview.service_type" label="Service Type" options={options} />
```

Rules:

- Pass `form.control` into custom field components.
- Keep validation messages driven by RHF + zod.
- Use section wrappers like `GeneralSectionComponent` and `ButtonsSectionComponent` for consistent layout.

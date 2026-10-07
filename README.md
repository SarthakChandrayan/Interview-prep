# PrepDeck

**Interview prep that remembers what you'll forget.**

PrepDeck is a spaced-repetition tracker for technical interviews. Log the
LeetCode problems you've solved, the CS concepts you need to explain, and your
behavioral (STAR) stories, and PrepDeck brings each one back for review just
before you'd forget it. Items you struggle with come back sooner, and the
dashboard shows which topics are weakest.

## Features

- **Three kinds of item:** coding problems (with difficulty and link), concepts, and behavioral stories.
- **Spaced-repetition reviews** using a simplified SM-2 algorithm (the one Anki is built on). Grade each recall Again / Hard / Good / Easy; each button previews the next interval.
- **Keyboard-driven review:** <kbd>Space</kbd> reveals your notes, <kbd>1</kbd>–<kbd>4</kbd> grades.
- **Dashboard:** items due, review streak, a 12-week activity heatmap, and topics ranked by how often you forget them.
- **Library** with search (title or tag) and filters by type and topic.
- **Per-item history:** every review, with the interval it produced.
- **Starter pack** of 20 common problems, concepts and behavioral prompts, to try the app in one click.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions, Cache Components / Partial Prerendering) |
| Language | TypeScript |
| Database | MongoDB with Mongoose |
| Validation | Zod |
| Styling | Tailwind CSS v4 (light and dark mode) |
| Tests | Vitest |
| CI | GitHub Actions: lint, typecheck, test, build |

## How it works

```
src/
├── app/
│   ├── actions.ts          # Server Actions: create / update / delete / review
│   ├── page.tsx            # Dashboard
│   ├── review/             # Review session
│   └── items/              # Library, detail, add, edit
├── components/             # UI (review session and item form are client components)
├── lib/
│   ├── srs.ts              # Spaced-repetition scheduler (pure, unit tested)
│   ├── stats.ts            # Streak and day helpers (pure, unit tested)
│   ├── validation.ts       # Zod schema for the item form (unit tested)
│   ├── data.ts             # Read queries and MongoDB aggregations
│   └── db.ts               # Cached Mongoose connection
└── models/
    ├── Item.ts             # Item with embedded SRS state
    └── Review.ts           # One document per review (powers stats)
```

**Data model.** Each `Item` embeds its scheduling state (`ease`, `interval`,
`reps`, `lapses`, `dueAt`), because it is always read and written together with
the item. Reviews live in their own collection: history grows without limit and
is queried by date for the streak and heatmap. The dashboard's per-topic
weakness ranking and daily activity are MongoDB aggregation pipelines.

**Scheduling.** New items are due immediately. "Good" moves an item along
1 → 3 → interval × ease days. "Easy" jumps further and raises ease. "Hard"
grows the interval slowly and lowers ease. "Again" resets the item to one day
and records a lapse. Ease never drops below 1.3.

**Rendering.** Pages prerender a static shell (nav, headings, skeletons), and
the database-backed parts stream in through `<Suspense>`. Mutations are Server
Actions that revalidate the affected pages.

## Running locally

You need Node 22+ and a MongoDB instance: local, Docker, or a free
[MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

```bash
# Start MongoDB, for example with Docker:
docker run -d -p 27017:27017 --name prepdeck-mongo mongo:8

cp .env.example .env.local   # set MONGODB_URI if you're not using localhost
npm install
npm run dev
```

Open http://localhost:3000 and click **Load the starter pack** to get going.

```bash
npm test           # unit tests
npm run lint
npm run typecheck
npm run build
```

## Deploying

The simplest setup is Vercel plus a free MongoDB Atlas cluster. Set
`MONGODB_URI` in the Vercel project's environment variables, and allow
Vercel's IPs (or `0.0.0.0/0`) in Atlas network access.

## Roadmap

- [ ] Accounts (Auth.js), so each user has a private deck
- [ ] AI mock interviewer: practise answering an item out loud and get feedback
- [ ] Paste a job description and get a generated study plan and items
- [ ] Import solved problems from a LeetCode profile
- [ ] User time zones for streaks (currently UTC)

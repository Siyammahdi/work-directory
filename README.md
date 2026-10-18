# Techwitpro Work Library

Internal tool for the sales team to find our work (branding, UI/UX, web, mobile, menus, video, marketing), share it with clients as a link, and present it live.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` (Neon pooled connection string), `TEAM_PASSWORD` and `AUTH_SECRET`.
3. `npm run db:setup` creates the tables and sample data (skips seeding if projects already exist).
4. `npm run dev` and open http://localhost:3000

`npm run db:reset` drops everything and reseeds the sample data.

## What sales can do

- **Find work fast**: search across title, client, industry, description and `#tags`; filter by category, industry or featured; press `/` to jump to search. Filters live in the URL, so a filtered view can be bookmarked or sent to a colleague.
- **Open a project**: big preview, `←` / `→` to move between results, `A` to add it to the share list, copy a client link or the image, download, and "More like this".
- **Share**: tick projects, drag to set their order, add a client name and personal note, and create a link. The link is copied automatically.
- **Present**: full-screen slideshow from the library, the share list, or the client page. Use the arrow keys or swipe, `F` for full screen, `G` for all slides and `Esc` to exit.
- **Follow up**: the Share links page shows which links clients opened, how often and when.
- **Keep it current**: add, edit, feature or delete projects. Media is linked by URL (CDN, Drive, Dropbox, Behance).

## Structure

- `app/(team)` holds the password-protected library (`/`) and share links (`/links`).
- `app/s/[slug]` and `app/p/[id]` are the public client pages. Visits from signed-in team members don't count as views.
- `app/actions.ts` contains the server actions; each one checks the team session and validates its input.
- `lib/queries.ts` holds all SQL (Neon serverless driver). The schema is in `neon/schema.sql`.
- `middleware.ts` is the team password gate.

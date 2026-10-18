import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
loadEnvLocal(join(root, ".env.local"));

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL in .env.local");
  process.exit(1);
}

const reset = process.argv.includes("--reset");
const sql = neon(url);

if (reset) {
  await sql.query("DROP TABLE IF EXISTS collection_items, collections, items CASCADE");
  console.log("Dropped existing tables.");
}

const schema = readFileSync(join(root, "neon", "schema.sql"), "utf8")
  .replace(/--.*$/gm, "")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);
for (const statement of schema) await sql.query(statement);
console.log("Schema applied.");

const [{ count }] = await sql`SELECT count(*)::int AS count FROM items`;
if (count > 0) {
  console.log(`Items table already has ${count} row(s); skipping seed. Use "npm run db:reset" to start over.`);
  process.exit(0);
}

const img = (seed, w, h) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const thumbOf = (seed, w, h) => img(seed, Math.round(w / 2), Math.round(h / 2));
const VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample";

const image = (seed, w, h) => ({ media_type: "image", file_url: img(seed, w, h), thumb_url: thumbOf(seed, w, h) });
const video = (file, seed) => ({ media_type: "video", file_url: `${VIDEO}/${file}`, thumb_url: img(seed, 800, 450) });
const link = (href, seed) => ({ media_type: "link", link_url: href, thumb_url: img(seed, 800, 600) });

const items = [
  { title: "Northwind Rebrand", category: "Logo & Branding", industry: "Retail", client: "Northwind Grocers", featured: true,
    description: "Wordmark, color system and packaging refresh for a regional grocery chain with 40 stores. Rolled out across signage, carts and private-label products.",
    tags: ["wordmark", "packaging", "minimal"], ...image("northwind", 1600, 1200) },
  { title: "Kopi Kita Identity", category: "Logo & Branding", industry: "Food & Beverage", client: "Kopi Kita Roasters",
    description: "Playful logo, cup sleeves and bag labels for a Dhaka specialty coffee roaster.",
    tags: ["coffee", "illustration", "warm"], ...image("kopikita", 1200, 1500) },
  { title: "Meridian Legal Mark", category: "Logo & Branding", industry: "Legal", client: "Meridian & Partners",
    description: "Monogram and stationery suite for a boutique law firm. Serif-led, quiet and confident.",
    tags: ["monogram", "serif", "corporate"], ...image("meridian", 1600, 1100) },
  { title: "Aurora Skincare Brand", category: "Logo & Branding", industry: "Beauty", client: "Aurora Labs",
    description: "Brand identity and label system for a clean-beauty D2C launch.",
    tags: ["beauty", "packaging", "pastel"], ...image("aurora", 1200, 1500) },
  { title: "Harbor Finance Dashboard", category: "UI/UX Design", industry: "Fintech", client: "Harbor Finance", featured: true,
    description: "Portfolio overview, transfers and spending insights for a retail banking web app. Reduced support tickets about balances by 31%.",
    tags: ["dashboard", "data-viz", "fintech"], ...image("harbor", 1600, 1000) },
  { title: "Clinic Flow Booking", category: "UI/UX Design", industry: "Healthcare", client: "CarePoint Clinics",
    description: "Appointment booking and patient intake flow, cutting no-shows by 22%.",
    tags: ["booking", "healthcare", "forms"], ...image("clinicflow", 1600, 1200) },
  { title: "Lumen SaaS Admin", category: "UI/UX Design", industry: "SaaS", client: "Lumen Analytics",
    description: "Design system and admin console for a B2B analytics product, with full dark mode.",
    tags: ["design-system", "b2b", "dark-mode"], ...image("lumen", 1600, 1100) },
  { title: "Studio Atlas Website", category: "Web Design", industry: "Architecture", client: "Studio Atlas", featured: true,
    description: "Portfolio site with case-study layouts and a motion-led hero.",
    tags: ["portfolio", "motion", "editorial"], ...link("https://example.com/studio-atlas", "studioatlas") },
  { title: "Greenline Solar Landing", category: "Web Design", industry: "Energy", client: "Greenline Solar",
    description: "Lead-gen landing page with savings calculator and testimonials. 4.8% visitor-to-lead conversion.",
    tags: ["landing-page", "conversion", "calculator"], ...image("greenline", 1200, 1600), link_url: "https://example.com/greenline" },
  { title: "Bloom Florist Shop", category: "Web Design", industry: "E-commerce", client: "Bloom & Co.",
    description: "Shopify storefront with same-day delivery checkout and gift-note flow.",
    tags: ["shopify", "e-commerce", "pastel"], ...image("bloom", 1600, 1200) },
  { title: "Vertex Logistics Site", category: "Web Design", industry: "Logistics", client: "Vertex Freight",
    description: "Corporate site with live shipment tracking and quote request.",
    tags: ["corporate", "b2b", "tracking"], ...link("https://example.com/vertex", "vertexsite") },
  { title: "Ride Share Driver App", category: "Mobile App", industry: "Transportation", client: "GoRide",
    description: "Driver onboarding, trip queue and earnings screens for iOS and Android.",
    tags: ["ios", "android", "maps"], ...image("rideshare", 1000, 1700) },
  { title: "FitTrack Habit App", category: "Mobile App", industry: "Health & Fitness", client: "FitTrack", featured: true,
    description: "Streak-based workout tracker with social challenges. 4.7 stars on the App Store.",
    tags: ["habits", "gamification", "fitness"], ...image("fittrack", 1000, 1600) },
  { title: "Pocket Pantry Grocery App", category: "Mobile App", industry: "E-commerce", client: "Pocket Pantry",
    description: "Quick-commerce grocery app with 15-minute delivery tracking.",
    tags: ["q-commerce", "ios", "android"], ...image("pantry", 1000, 1700) },
  { title: "Spice Route Menu", category: "Menu Design", industry: "Restaurant", client: "Spice Route", featured: true,
    description: "Two-page dine-in menu and QR digital version for a modern Bengali restaurant.",
    tags: ["print", "qr", "restaurant"], ...image("spiceroute", 1200, 1600) },
  { title: "Brew Lab Chalkboard Menu", category: "Menu Design", industry: "Food & Beverage", client: "Brew Lab",
    description: "Hand-lettered wall menu and seasonal specials cards.",
    tags: ["lettering", "cafe", "print"], ...image("brewlab", 1600, 1100) },
  { title: "Sakura Sushi Bar Menu", category: "Menu Design", industry: "Restaurant", client: "Sakura Sushi Bar",
    description: "Fold-out menu with illustrated rolls and allergen key.",
    tags: ["illustration", "print", "japanese"], ...image("sakura", 1600, 1200) },
  { title: "Launch Teaser: Harbor App", category: "Video", industry: "Fintech", client: "Harbor Finance", featured: true,
    description: "15-second product teaser for app store and social ads.",
    tags: ["motion", "teaser", "social"], ...video("ForBiggerBlazes.mp4", "harborvideo") },
  { title: "Brand Story: Kopi Kita", category: "Video", industry: "Food & Beverage", client: "Kopi Kita Roasters",
    description: "Short brand film shot at the roastery for Instagram Reels.",
    tags: ["reels", "brand-film"], ...video("ForBiggerJoyrides.mp4", "kopivideo") },
  { title: "Explainer: Lumen Insights", category: "Video", industry: "SaaS", client: "Lumen Analytics",
    description: "60-second animated explainer for the product homepage.",
    tags: ["explainer", "animation", "b2b"], ...video("ForBiggerEscapes.mp4", "lumenvideo") },
  { title: "Eid Campaign Social Kit", category: "Marketing", industry: "Retail", client: "Northwind Grocers",
    description: "30 social posts, story templates and banners for an Eid sale. 2.3x engagement vs. last year.",
    tags: ["social", "campaign", "templates"], ...image("eidcampaign", 1200, 1500) },
  { title: "Greenline Billboard Series", category: "Marketing", industry: "Energy", client: "Greenline Solar",
    description: "Three-billboard outdoor campaign across Dhaka and Chattogram.",
    tags: ["ooh", "billboard", "print"], ...image("billboard", 1800, 900) },
  { title: "SaaS Webinar Funnel", category: "Marketing", industry: "SaaS", client: "Lumen Analytics",
    description: "Email sequence, registration page and ad creatives for a webinar launch.",
    tags: ["email", "funnel", "ads"], ...link("https://example.com/webinar-funnel", "webinar") },
  { title: "Aurora Launch Lookbook", category: "Marketing", industry: "Beauty", client: "Aurora Labs",
    description: "Print and digital lookbook for the spring product launch.",
    tags: ["lookbook", "print", "photography"], ...image("lookbook", 1600, 1200) },
];

for (const [index, it] of items.entries()) {
  await sql`
    INSERT INTO items (title, category, industry, client, description, media_type, file_url, link_url,
                       thumb_url, tags, featured, created_at)
    VALUES (${it.title}, ${it.category}, ${it.industry}, ${it.client}, ${it.description}, ${it.media_type},
            ${it.file_url ?? null}, ${it.link_url ?? null}, ${it.thumb_url ?? null}, ${it.tags},
            ${it.featured ?? false}, now() - make_interval(days => ${index * 3}::int))
  `;
}
console.log(`Seeded ${items.length} portfolio items.`);

const collections = [
  { slug: "demo", title: "Branding & web highlights", client: "Prospect: Café Mondo", views: 7, viewedHoursAgo: 2,
    note: "Hi! Here are a few identity and website projects similar to what we discussed on our call.",
    items: ["Northwind Rebrand", "Kopi Kita Identity", "Studio Atlas Website", "Greenline Solar Landing", "Spice Route Menu"] },
  { slug: "fintech", title: "Fintech work for Harbor", client: "Harbor Finance", views: 3, viewedHoursAgo: 26,
    note: "Everything we shipped for Harbor Finance, from the dashboard to launch video.",
    items: ["Harbor Finance Dashboard", "Launch Teaser: Harbor App"] },
  { slug: "restaurants", title: "Restaurant & menu portfolio", client: "Prospect: Dine Group", views: 0, viewedHoursAgo: null,
    note: null, items: ["Spice Route Menu", "Brew Lab Chalkboard Menu", "Sakura Sushi Bar Menu", "Kopi Kita Identity"] },
];
for (const [i, c] of collections.entries()) {
  const [row] = await sql`
    INSERT INTO collections (slug, title, client_name, note, views, last_viewed_at, created_at)
    VALUES (${c.slug}, ${c.title}, ${c.client}, ${c.note}, ${c.views},
            ${c.viewedHoursAgo == null ? null : new Date(Date.now() - c.viewedHoursAgo * 3600e3).toISOString()},
            now() - make_interval(days => ${i * 2 + 1}::int))
    RETURNING id
  `;
  await sql`
    INSERT INTO collection_items (collection_id, item_id, position)
    SELECT ${row.id}, i.id, t.ord - 1
    FROM unnest(${c.items}::text[]) WITH ORDINALITY AS t(title, ord)
    JOIN items i ON i.title = t.title
  `;
}
console.log(`Seeded ${collections.length} share links: /s/demo, /s/fintech, /s/restaurants`);
console.log("Database ready.");

function loadEnvLocal(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

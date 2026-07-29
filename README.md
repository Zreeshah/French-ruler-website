# French Ruler Website

Astro static site for <https://regle-enligne.onl>, a French online ruler and measurement guide.

The site is configured as SSG (`output: 'static'`) and builds every page to HTML in `dist/`.

## Project Structure

```text
/
├── public/
│   ├── robots.txt
│   └── 66a8eaa41055fd74aecd440735d9f84c.txt
├── scripts/
│   └── submit-indexnow.mjs
├── src/
│   ├── content/blog/
│   ├── layouts/
│   └── pages/
└── astro.config.mjs
```

## SEO

- `robots.txt` allows crawlers and points to `https://regle-enligne.onl/sitemap-index.xml`.
- `@astrojs/sitemap` generates the sitemap during `npm run build`.
- The IndexNow key file is served from `/<key>.txt` after deployment.
- `scripts/submit-indexnow.mjs` reads generated HTML files from `dist/`, skips pages marked `noindex`, and submits every indexable URL to `https://api.indexnow.org/indexnow`.

Run IndexNow only after the latest build is deployed and the key file is reachable at:

```text
https://regle-enligne.onl/66a8eaa41055fd74aecd440735d9f84c.txt
```

## Commands

All commands are run from the project root:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run indexnow:dry-run`| Print the IndexNow payload from `dist/`          |
| `npm run indexnow:submit` | Submit all generated HTML URLs to IndexNow       |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |

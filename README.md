# US State Finder (2026)

A local, no-backend app for comparing U.S. states and the 50 largest cities — choropleth map, year slider, and a detail panel with year-over-year trends.

## Run locally

```bash
npm install
npm run dev
```

Open the printed localhost URL. The map, ranking list, and detail sheet are all client-side.

```bash
npm run build
npm run preview
```

## Data

Bundled JSON lives in `src/data/`. Rebuild it with:

```bash
npm run data          # offline, uses committed fallbacks
npm run data:live     # download official tables and overlay them
```

`npm run data:live` pulls what is publicly reachable without API keys:

| Stat | Source |
| --- | --- |
| Population | Census Vintage 2025 (via Wikipedia tables; Census FTP is Cloudflare-blocked from many datacenters) |
| Home value | [Zillow ZHVI](https://www.zillow.com/research/data/) |
| Cost of living / rents | [BEA Regional Price Parities](https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area) |
| Unemployment | [BLS LAUS](https://download.bls.gov/pub/time.series/la/) |
| Crime | [FBI Crime Data Explorer](https://cde.ucr.cjis.gov/) (DEMO_KEY; often rate-limited) |
| GDP / industries | [BEA SAGDP](https://www.bea.gov/data/gdp/gdp-state) |
| Age / demographics | ACS 1-year (Census). Direct ACS API now requires a key, so the committed file uses ACS-vintage shares |

2026 figures that are year-to-date are flagged **YTD** in the UI. Fire emoji marks a year-over-year change in the top 10% of peers, in the favorable direction for that stat.

## Stack

Vite, React 19, TypeScript, Tailwind v4, shadcn/ui, d3-geo / d3-zoom, Recharts.

# AWBL Data Pipeline (`dentearl/awbl-data`)

Automated schedule, standings, and results pipeline for the **Asia Winter Baseball League** (AWBL / 亞洲冬季棒球聯盟), hosted in Taiwan under the auspices of the CPBL.

## Purpose
This repository serves static, daily-updated JSON datasets of AWBL regular season and postseason tournament games (including tie/draw games, scores, and standings) via `raw.githubusercontent.com`.

The live baseball division visualizer dynamically fetches from:
```
https://raw.githubusercontent.com/dentearl/awbl-data/main/data/awbl/{season}.json
https://raw.githubusercontent.com/dentearl/awbl-data/main/data/awbl/postseason.json
https://raw.githubusercontent.com/dentearl/awbl-data/main/data/awbl/metadata.json
```
Available seasons: `2024`, `2026`.

## Architecture & Security
- **Zero Dependencies**: Scraper script is 100% self-contained using Node.js built-ins (`node:https`, `node:fs`, `node:path`, `node:url`).
- **Zero Secrets / Zero Tokens**: Uses standard unauthenticated HTTP GET/POST against public endpoints and ephemeral default `GITHUB_TOKEN` (`contents: write`) in GitHub Actions.
- **Automated Tournament Sweeps**: Runs 3 daily sweeps during the tournament (November 14 – December 6):
  - `09:00 UTC` (`17:00 TST`) – captures afternoon games
  - `14:45 UTC` (`22:45 TST`) – captures evening games
  - `16:30 UTC` (`00:30 TST`) – safety sweep for extra-inning games or weather delays

## Manual Run
```bash
# Scrape active 2026 tournament season
node scripts/scrapeAWBL.js --season 2026

# Scrape historical 2024 tournament season
node scripts/scrapeAWBL.js --season 2024
```

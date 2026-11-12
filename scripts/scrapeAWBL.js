/**
 * Asia Winter Baseball League (AWBL / 亞洲冬季棒球聯盟) Schedule & Results Scraper
 *
 * Fetches official game schedules, box scores, and tournament standings from
 * the official CPBL Winter League portal (https://awb.cpbl.com.tw), normalizes game outcomes
 * (including tie/draw games and postseason rounds), and outputs production-grade JSON
 * for the baseball division race visualization.
 *
 * ARCHITECTURAL CONSTRAINT FOR AI AGENTS & DEVELOPERS:
 * This scraper script is intentionally 100% self-contained with ZERO internal repository imports.
 * It must ONLY import Node.js built-ins (node:fs, node:path, node:url, node:https).
 * DO NOT import from ../src/ or couple this script to frontend constants.
 * It is designed to be deployed and executed independently in a standalone scraper repository (awbl-data-repo).
 * Parity between AWBL_TEAM_MAPPING and src/constants/awblTeams.js is enforced by tests/scraperConsistency.test.js.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const AWBL_SCHEDULE_PAGE = 'https://awb.cpbl.com.tw/schedule';
export const AWBL_API_ENDPOINT = 'https://awb.cpbl.com.tw/schedule/getgamedatas';

export const AWBL_TEAM_MAPPING = {
  // 2026 Active Teams
  '8001': { id: 8001, abbrev: 'TWO', name: 'Taiwan Ocean', nativeName: '台灣海洋', division: 'AWBL' },
  'TWO': { id: 8001, abbrev: 'TWO', name: 'Taiwan Ocean', nativeName: '台灣海洋', division: 'AWBL' },
  'ZZZ389': { id: 8001, abbrev: 'TWO', name: 'Taiwan Ocean', nativeName: '台灣海洋', division: 'AWBL' },
  '台灣海洋': { id: 8001, abbrev: 'TWO', name: 'Taiwan Ocean', nativeName: '台灣海洋', division: 'AWBL' },

  '8002': { id: 8002, abbrev: 'TWM', name: 'Taiwan Mountain', nativeName: '台灣山林', division: 'AWBL' },
  'TWM': { id: 8002, abbrev: 'TWM', name: 'Taiwan Mountain', nativeName: '台灣山林', division: 'AWBL' },
  'ZZZ379': { id: 8002, abbrev: 'TWM', name: 'Taiwan Mountain', nativeName: '台灣山林', division: 'AWBL' },
  '台灣山林': { id: 8002, abbrev: 'TWM', name: 'Taiwan Mountain', nativeName: '台灣山林', division: 'AWBL' },

  '8003': { id: 8003, abbrev: 'NPB', name: 'NPB Combined', nativeName: '日職聯隊', division: 'AWBL' },
  'NPB': { id: 8003, abbrev: 'NPB', name: 'NPB Combined', nativeName: '日職聯隊', division: 'AWBL' },
  'ZZZ040': { id: 8003, abbrev: 'NPB', name: 'NPB Combined', nativeName: '日職聯隊', division: 'AWBL' },
  '日職聯隊': { id: 8003, abbrev: 'NPB', name: 'NPB Combined', nativeName: '日職聯隊', division: 'AWBL' },

  '8004': { id: 8004, abbrev: 'JABA', name: 'Japan Amateur Baseball Association', nativeName: '日本社會人', division: 'AWBL' },
  'JABA': { id: 8004, abbrev: 'JABA', name: 'Japan Amateur Baseball Association', nativeName: '日本社會人', division: 'AWBL' },
  'ZZZ083': { id: 8004, abbrev: 'JABA', name: 'Japan Amateur Baseball Association', nativeName: '日本社會人', division: 'AWBL' },
  '日本社會人': { id: 8004, abbrev: 'JABA', name: 'Japan Amateur Baseball Association', nativeName: '日本社會人', division: 'AWBL' },
  '日本社會人隊': { id: 8004, abbrev: 'JABA', name: 'Japan Amateur Baseball Association', nativeName: '日本社會人', division: 'AWBL' },

  '8005': { id: 8005, abbrev: 'KBO', name: 'KBO Combined', nativeName: '韓職聯隊', division: 'AWBL' },
  'KBO': { id: 8005, abbrev: 'KBO', name: 'KBO Combined', nativeName: '韓職聯隊', division: 'AWBL' },
  'ZZZ041': { id: 8005, abbrev: 'KBO', name: 'KBO Combined', nativeName: '韓職聯隊', division: 'AWBL' },
  '韓職聯隊': { id: 8005, abbrev: 'KBO', name: 'KBO Combined', nativeName: '韓職聯隊', division: 'AWBL' },

  '8006': { id: 8006, abbrev: 'CTUSF', name: 'CTUSF University All-Stars', nativeName: '大專體總大學明星隊', division: 'AWBL' },
  'CTUSF': { id: 8006, abbrev: 'CTUSF', name: 'CTUSF University All-Stars', nativeName: '大專體總大學明星隊', division: 'AWBL' },
  'ZZZ409': { id: 8006, abbrev: 'CTUSF', name: 'CTUSF University All-Stars', nativeName: '大專體總大學明星隊', division: 'AWBL' },
  '大專體總大學明星隊': { id: 8006, abbrev: 'CTUSF', name: 'CTUSF University All-Stars', nativeName: '大專體總大學明星隊', division: 'AWBL' },

  // Historical
  '8007': { id: 8007, abbrev: 'NPBW', name: 'NPB White', nativeName: '日職白隊', division: 'AWBL' },
  'NPBW': { id: 8007, abbrev: 'NPBW', name: 'NPB White', nativeName: '日職白隊', division: 'AWBL' },
  'ZZZ249': { id: 8007, abbrev: 'NPBW', name: 'NPB White', nativeName: '日職白隊', division: 'AWBL' },
  '日職白隊': { id: 8007, abbrev: 'NPBW', name: 'NPB White', nativeName: '日職白隊', division: 'AWBL' },

  '8008': { id: 8008, abbrev: 'NPBR', name: 'NPB Red', nativeName: '日職紅隊', division: 'AWBL' },
  'NPBR': { id: 8008, abbrev: 'NPBR', name: 'NPB Red', nativeName: '日職紅隊', division: 'AWBL' },
  'ZZZ259': { id: 8008, abbrev: 'NPBR', name: 'NPB Red', nativeName: '日職紅隊', division: 'AWBL' },
  '日職紅隊': { id: 8008, abbrev: 'NPBR', name: 'NPB Red', nativeName: '日職紅隊', division: 'AWBL' },

  '8009': { id: 8009, abbrev: 'TSG', name: 'TSG Hawks', nativeName: '台鋼雄鷹', division: 'AWBL' },
  'TSG': { id: 8009, abbrev: 'TSG', name: 'TSG Hawks', nativeName: '台鋼雄鷹', division: 'AWBL' },
  'AKP011': { id: 8009, abbrev: 'TSG', name: 'TSG Hawks', nativeName: '台鋼雄鷹', division: 'AWBL' },
  '台鋼雄鷹': { id: 8009, abbrev: 'TSG', name: 'TSG Hawks', nativeName: '台鋼雄鷹', division: 'AWBL' },

  '8010': { id: 8010, abbrev: 'CT', name: 'Chinese Taipei Training Team', nativeName: '中華培訓隊', division: 'AWBL' },
  'CT': { id: 8010, abbrev: 'CT', name: 'Chinese Taipei Training Team', nativeName: '中華培訓隊', division: 'AWBL' },
  'ZZZ199': { id: 8010, abbrev: 'CT', name: 'Chinese Taipei Training Team', nativeName: '中華培訓隊', division: 'AWBL' },
  'ZZZ048': { id: 8010, abbrev: 'CT', name: 'Chinese Taipei Training Team', nativeName: '中華培訓隊', division: 'AWBL' },
  '中華隊': { id: 8010, abbrev: 'CT', name: 'Chinese Taipei Training Team', nativeName: '中華培訓隊', division: 'AWBL' },
  '中華培訓隊': { id: 8010, abbrev: 'CT', name: 'Chinese Taipei Training Team', nativeName: '中華培訓隊', division: 'AWBL' }
};

export const AWBL_VENUES = {
  '洲際': { id: 8901, name: 'Taichung Intercontinental Baseball Stadium', nativeName: '台中洲際棒球場', city: 'Taichung, Taiwan' },
  '斗六': { id: 8902, name: 'Douliu Baseball Stadium', nativeName: '斗六棒球場', city: 'Douliu, Yunlin, Taiwan' },
  '台南': { id: 8903, name: 'Tainan Asia-Pacific International Baseball Stadium', nativeName: '台南亞太國際棒球訓練中心', city: 'Tainan, Taiwan' },
  '嘉市': { id: 8904, name: 'Chiayi City Baseball Stadium', nativeName: '嘉義市立棒球場', city: 'Chiayi, Taiwan' },
  '嘉義市': { id: 8904, name: 'Chiayi City Baseball Stadium', nativeName: '嘉義市立棒球場', city: 'Chiayi, Taiwan' }
};

/**
 * Resolves raw team identifier (TeamNo or Chinese name) to canonical AWBL team object
 */
export function resolveAwblTeam(rawIdentifier) {
  if (!rawIdentifier) return null;
  const str = String(rawIdentifier).trim();
  if (AWBL_TEAM_MAPPING[str]) {
    return AWBL_TEAM_MAPPING[str];
  }
  const upper = str.toUpperCase();
  if (AWBL_TEAM_MAPPING[upper]) {
    return AWBL_TEAM_MAPPING[upper];
  }
  for (const team of Object.values(AWBL_TEAM_MAPPING)) {
    if (team.name.toUpperCase().includes(upper) || (team.nativeName && team.nativeName.includes(str))) {
      return team;
    }
  }
  return null;
}

/**
 * Low-level HTTPS helper supporting custom cookies, headers, and relaxed TLS for Taiwanese certificates
 */
function httpsRequest(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...options.headers
      },
      rejectUnauthorized: false
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

/**
 * Fetches the official schedule JSON from awb.cpbl.com.tw
 */
export async function fetchAwblScheduleData(season = 2026) {
  const yr = String(season);
  try {
    // 1. Visit schedule page to obtain session cookie and RequestVerificationToken
    const pageRes = await httpsRequest(AWBL_SCHEDULE_PAGE);
    if (pageRes.status !== 200) {
      throw new Error(`Failed to load schedule page: HTTP ${pageRes.status}`);
    }

    const setCookie = pageRes.headers['set-cookie'];
    const cookie = Array.isArray(setCookie) ? setCookie.map(c => c.split(';')[0]).join('; ') : (setCookie ? setCookie.split(';')[0] : '');

    // Extract CSRF token
    const tokenMatches = [...pageRes.data.matchAll(/RequestVerificationToken:\s*['"]([^'"]+)['"]/g)];
    const token = tokenMatches.length > 0 ? tokenMatches[tokenMatches.length - 1][1] : null;

    if (!token) {
      throw new Error('Unable to extract RequestVerificationToken from schedule page HTML');
    }

    // 2. Query getgamedatas
    const postBody = `calendar=${yr}%2F01%2F01&location=&kindCode=P`;
    const apiRes = await httpsRequest(AWBL_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'RequestVerificationToken': token,
        'Cookie': cookie,
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': AWBL_SCHEDULE_PAGE
      }
    }, postBody);

    if (apiRes.status === 200) {
      const json = JSON.parse(apiRes.data);
      if (json && json.Success && Array.isArray(json.GameDatas)) {
        return json.GameDatas;
      }
    }
  } catch (err) {
    console.warn(`[scrapeAWBL] Live fetch error for season ${season}: ${err.message}`);
  }
  return [];
}

/**
 * Normalizes raw CPBL AWBL game records into the standardized division race schema
 */
export function normalizeAwblGames(rawGames, season = 2026) {
  if (!Array.isArray(rawGames)) return { regularSeason: [], postseason: [] };

  const regularSeason = [];
  const postseasonGames = [];

  // Sort games by date and game number
  const sorted = [...rawGames].sort((a, b) => {
    const da = new Date(a.GameDate || a.GameDateTimeS).getTime();
    const db = new Date(b.GameDate || b.GameDateTimeS).getTime();
    if (da !== db) return da - db;
    return (a.GameSno || 0) - (b.GameSno || 0);
  });

  const totalGames = sorted.length;

  sorted.forEach((g) => {
    const awayTeam = resolveAwblTeam(g.VisitingTeamCode || g.VisitingTeamName);
    const homeTeam = resolveAwblTeam(g.HomeTeamCode || g.HomeTeamName);

    if (!awayTeam || !homeTeam) {
      return;
    }

    const gameDateRaw = g.GameDateTimeS || g.GameDate || `${season}-11-15T12:00:00`;
    const officialDate = (g.GameDate || gameDateRaw).slice(0, 10);
    const gamePk = `${officialDate.replace(/-/g, '')}${String(g.GameSno || 1).padStart(5, '0')}`;

    const venueInfo = AWBL_VENUES[g.FieldAbbe] || {
      id: 8900,
      name: g.FieldAbbe ? `${g.FieldAbbe} Stadium` : 'Taiwan Ballpark',
      city: 'Taiwan'
    };

    const isFinal = Boolean(g.GameResult && g.GameResult.trim() !== '') || Boolean(g.GameDateTimeE && (g.WinningPitcherName || g.VisitingScore !== g.HomeScore));
    const isPostponed = g.IsGameStop === '1';

    const awayScore = typeof g.VisitingScore === 'number' ? g.VisitingScore : parseInt(g.VisitingScore, 10) || 0;
    const homeScore = typeof g.HomeScore === 'number' ? g.HomeScore : parseInt(g.HomeScore, 10) || 0;

    let isTie = false;
    let awayWinner = false;
    let homeWinner = false;

    if (isFinal) {
      if (awayScore === homeScore) {
        isTie = true;
      } else if (awayScore > homeScore) {
        awayWinner = true;
      } else {
        homeWinner = true;
      }
    }

    // Determine round/playoff status:
    // In AWBL, the last 4 games of the tournament (e.g. Sno 41-44 in a 44-game tournament)
    // are Semifinal 1, Semifinal 2, 3rd Place Game, and Championship Game.
    const isPlayoffGame = totalGames >= 20 && (g.GameSno > totalGames - 4);
    let seriesDesc = 'Regular Season';
    let seriesType = 'regular';

    if (isPlayoffGame) {
      const playoffIdx = g.GameSno - (totalGames - 4); // 1, 2, 3, 4
      if (playoffIdx === 1) {
        seriesDesc = 'Semifinal 1';
        seriesType = 'semifinal_1';
      } else if (playoffIdx === 2) {
        seriesDesc = 'Semifinal 2';
        seriesType = 'semifinal_2';
      } else if (playoffIdx === 3) {
        seriesDesc = '3rd Place Game';
        seriesType = 'third_place';
      } else if (playoffIdx === 4) {
        seriesDesc = 'AWBL Championship';
        seriesType = 'championship';
      }
    }

    const normalizedGame = {
      gamePk,
      season: parseInt(g.Year || season, 10),
      league: 'AWBL',
      gameType: isPlayoffGame ? (seriesType === 'championship' ? 'W' : 'L') : 'R',
      seriesDescription: seriesDesc,
      gameDate: gameDateRaw.includes('+') ? gameDateRaw : `${gameDateRaw.slice(0, 19)}+08:00`,
      officialDate,
      venue: venueInfo,
      status: {
        detailedState: isFinal ? 'Final' : (isPostponed ? 'Postponed' : 'Scheduled'),
        abstractGameState: isFinal ? 'F' : 'P'
      },
      teams: {
        away: {
          team: {
            id: awayTeam.id,
            name: awayTeam.name,
            abbrev: awayTeam.abbrev,
            nativeName: awayTeam.nativeName,
            league: 'AWBL',
            division: 'AWBL'
          },
          score: isFinal ? awayScore : undefined,
          isWinner: awayWinner
        },
        home: {
          team: {
            id: homeTeam.id,
            name: homeTeam.name,
            abbrev: homeTeam.abbrev,
            nativeName: homeTeam.nativeName,
            league: 'AWBL',
            division: 'AWBL'
          },
          score: isFinal ? homeScore : undefined,
          isWinner: homeWinner
        }
      },
      isTie
    };

    if (isPlayoffGame) {
      postseasonGames.push({ ...normalizedGame, playoffType: seriesType });
    } else {
      regularSeason.push(normalizedGame);
    }
  });

  return { regularSeason, postseason: postseasonGames };
}

/**
 * Builds structured postseason series metadata from normalized playoff games
 */
export function buildAwblPostseasonSeries(postseasonGames, season = 2026) {
  if (!postseasonGames || postseasonGames.length === 0) {
    return null;
  }

  const sf1 = postseasonGames.find(g => g.playoffType === 'semifinal_1');
  const sf2 = postseasonGames.find(g => g.playoffType === 'semifinal_2');
  const third = postseasonGames.find(g => g.playoffType === 'third_place');
  const champ = postseasonGames.find(g => g.playoffType === 'championship');

  const buildSeries = (id, name, game) => {
    if (!game) {
      return { id, name, format: 'Single Game', isStarted: false, isComplete: false };
    }
    const isDone = game.status?.detailedState === 'Final';
    const away = game.teams.away;
    const home = game.teams.home;
    const winnerId = isDone ? (away.isWinner ? away.team.id : (home.isWinner ? home.team.id : null)) : null;

    return {
      id,
      name,
      format: 'Single Game',
      isStarted: Boolean(game.status?.detailedState),
      isComplete: isDone,
      winnerId,
      championId: id === 'awbl-champ' ? winnerId : undefined,
      teamTop: {
        id: away.team.id,
        name: away.team.name,
        abbrev: away.team.abbrev,
        score: away.score,
        wins: away.isWinner ? 1 : 0,
        isWinner: Boolean(away.isWinner)
      },
      teamBottom: {
        id: home.team.id,
        name: home.team.name,
        abbrev: home.team.abbrev,
        score: home.score,
        wins: home.isWinner ? 1 : 0,
        isWinner: Boolean(home.isWinner)
      }
    };
  };

  const championship = buildSeries('awbl-champ', 'AWBL Championship', champ);
  const thirdPlace = buildSeries('awbl-third', '3rd Place Game', third);
  const semifinal1 = buildSeries('awbl-semi1', 'Semifinal 1', sf1);
  const semifinal2 = buildSeries('awbl-semi2', 'Semifinal 2', sf2);

  return {
    year: parseInt(season, 10),
    isComplete: Boolean(championship?.isComplete),
    isStarted: Boolean(semifinal1?.isStarted || semifinal2?.isStarted),
    championship,
    thirdPlace,
    semifinal1,
    semifinal2
  };
}

/**
 * Main execution handler: scrapes or generates AWBL dataset
 */
export async function scrapeAwbl(options = {}) {
  const season = options.season || 2026;
  const isSync = Boolean(options.sync);

  console.log(`[scrapeAWBL] Scraping AWBL data for season ${season}...`);
  let rawGames = await fetchAwblScheduleData(season);

  // If live fetch returned nothing and season is 2024, check /tmp/awb_2024_games.json or fallback
  if ((!rawGames || rawGames.length === 0) && season === 2024) {
    const tmpPath = '/tmp/awb_2024_games.json';
    if (fs.existsSync(tmpPath)) {
      try {
        const cached = JSON.parse(fs.readFileSync(tmpPath, 'utf8'));
        if (cached && cached.Success && Array.isArray(cached.GameDatas)) {
          console.log(`[scrapeAWBL] Using cached raw 2024 games (${cached.GameDatas.length} games).`);
          rawGames = cached.GameDatas;
        }
      } catch (_e) {}
    }
  }

  const { regularSeason, postseason } = normalizeAwblGames(rawGames, season);
  console.log(`[scrapeAWBL] Parsed ${regularSeason.length} regular season games and ${postseason.length} postseason games.`);

  const structuredPostseason = buildAwblPostseasonSeries(postseason, season);

  // Directories
  const dataDir = path.resolve(rootDir, 'data', 'awbl');
  const publicDir = path.resolve(rootDir, 'public', 'data', 'awbl');
  const srcDataDir = path.resolve(rootDir, 'src', 'data', 'awbl');

  fs.mkdirSync(dataDir, { recursive: true });
  if (isSync) {
    fs.mkdirSync(publicDir, { recursive: true });
    fs.mkdirSync(srcDataDir, { recursive: true });
  }

  // 1. Write data/awbl/{season}.json
  const seasonJsonPath = path.join(dataDir, `${season}.json`);
  fs.writeFileSync(seasonJsonPath, JSON.stringify(regularSeason, null, 2), 'utf8');
  console.log(`[scrapeAWBL] Wrote ${seasonJsonPath}`);

  // 2. Write metadata.json
  const metadata = {
    league: 'awbl',
    season,
    totalGames: regularSeason.length,
    postseasonGames: postseason.length,
    updatedAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(dataDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf8');

  // 3. Write postseason.json
  if (structuredPostseason) {
    let allPostseason = {};
    const postJsonPath = path.join(dataDir, 'postseason.json');
    if (fs.existsSync(postJsonPath)) {
      try {
        allPostseason = JSON.parse(fs.readFileSync(postJsonPath, 'utf8'));
      } catch (_e) {}
    }
    allPostseason[season] = structuredPostseason;
    fs.writeFileSync(postJsonPath, JSON.stringify(allPostseason, null, 2), 'utf8');
  }

  // Sync to public/ and src/
  if (isSync) {
    fs.copyFileSync(seasonJsonPath, path.join(publicDir, `${season}.json`));
    fs.writeFileSync(path.join(publicDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf8');
    if (fs.existsSync(path.join(dataDir, 'postseason.json'))) {
      fs.copyFileSync(path.join(dataDir, 'postseason.json'), path.join(publicDir, 'postseason.json'));
    }

    // Generate src/data/awbl/{season}.js offline ESM wrapper
    const esmContent = `// Auto-generated offline ESM bundle for AWBL ${season}\n` +
      `export const AWBL_GAMES_${season} = ${JSON.stringify(regularSeason, null, 2)};\n` +
      `if (typeof window !== 'undefined') {\n` +
      `  window.AWBL_DATA = window.AWBL_DATA || {};\n` +
      `  window.AWBL_DATA['${season}'] = AWBL_GAMES_${season};\n` +
      `}\n` +
      `if (typeof globalThis !== 'undefined') {\n` +
      `  globalThis.AWBL_DATA = globalThis.AWBL_DATA || {};\n` +
      `  globalThis.AWBL_DATA['${season}'] = AWBL_GAMES_${season};\n` +
      `}\n`;
    fs.writeFileSync(path.join(srcDataDir, `${season}.js`), esmContent, 'utf8');
    console.log(`[scrapeAWBL] Synced static and offline assets to public/ and src/data/awbl/`);
  }

  return { regularSeason, postseason, structuredPostseason };
}

// CLI entry point
if (process.argv[1] && process.argv[1].endsWith('scrapeAWBL.js')) {
  const args = process.argv.slice(2);
  let season = 2026;
  let isSync = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--season' && args[i + 1]) {
      season = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--sync') {
      isSync = true;
    }
  }

  scrapeAwbl({ season, sync: isSync })
    .then(() => {
      console.log('✅ AWBL scraping complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Scraper error:', err);
      process.exit(1);
    });
}

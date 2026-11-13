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
export const OFFICIAL_AWBL_SEASONS = [2026, 2025, 2024, 2023, 2019, 2018, 2017, 2016, 2015, 2013, 2012];

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
  '大學明星': { id: 8006, abbrev: 'CTUSF', name: 'CTUSF University All-Stars', nativeName: '大專體總大學明星隊', division: 'AWBL' },

  // Historical (2012–2024)
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
  '中華培訓隊': { id: 8010, abbrev: 'CT', name: 'Chinese Taipei Training Team', nativeName: '中華培訓隊', division: 'AWBL' },

  '8011': { id: 8011, abbrev: 'CPBL', name: 'CPBL Combined', nativeName: '中華職棒', division: 'AWBL' },
  'CPBL': { id: 8011, abbrev: 'CPBL', name: 'CPBL Combined', nativeName: '中華職棒', division: 'AWBL' },
  'ZZZ039': { id: 8011, abbrev: 'CPBL', name: 'CPBL Combined', nativeName: '中華職棒', division: 'AWBL' },
  '中華職棒': { id: 8011, abbrev: 'CPBL', name: 'CPBL Combined', nativeName: '中華職棒', division: 'AWBL' },

  '8012': { id: 8012, abbrev: 'WCD', name: 'Wei Chuan Dragons', nativeName: '味全龍', division: 'AWBL' },
  'WCD': { id: 8012, abbrev: 'WCD', name: 'Wei Chuan Dragons', nativeName: '味全龍', division: 'AWBL' },
  'AAA011': { id: 8012, abbrev: 'WCD', name: 'Wei Chuan Dragons', nativeName: '味全龍', division: 'AWBL' },
  '味全龍': { id: 8012, abbrev: 'WCD', name: 'Wei Chuan Dragons', nativeName: '味全龍', division: 'AWBL' },

  '8013': { id: 8013, abbrev: 'NPE', name: 'NPB East', nativeName: '日職東軍', division: 'AWBL' },
  'NPE': { id: 8013, abbrev: 'NPE', name: 'NPB East', nativeName: '日職東軍', division: 'AWBL' },
  'ZZZ080': { id: 8013, abbrev: 'NPE', name: 'NPB East', nativeName: '日職東軍', division: 'AWBL' },
  '日職東軍': { id: 8013, abbrev: 'NPE', name: 'NPB East', nativeName: '日職東軍', division: 'AWBL' },

  '8014': { id: 8014, abbrev: 'NPW', name: 'NPB West', nativeName: '日職西軍', division: 'AWBL' },
  'NPW': { id: 8014, abbrev: 'NPW', name: 'NPB West', nativeName: '日職西軍', division: 'AWBL' },
  'ZZZ081': { id: 8014, abbrev: 'NPW', name: 'NPB West', nativeName: '日職西軍', division: 'AWBL' },
  '日職西軍': { id: 8014, abbrev: 'NPW', name: 'NPB West', nativeName: '日職西軍', division: 'AWBL' },

  '8015': { id: 8015, abbrev: 'WBSC', name: 'WBSC Team Europe-America', nativeName: '歐美聯隊', division: 'AWBL' },
  'WBSC': { id: 8015, abbrev: 'WBSC', name: 'WBSC Team Europe-America', nativeName: '歐美聯隊', division: 'AWBL' },
  'ZZZ084': { id: 8015, abbrev: 'WBSC', name: 'WBSC Team Europe-America', nativeName: '歐美聯隊', division: 'AWBL' },
  '歐美聯隊': { id: 8015, abbrev: 'WBSC', name: 'WBSC Team Europe-America', nativeName: '歐美聯隊', division: 'AWBL' },

  '8016': { id: 8016, abbrev: 'EUR', name: 'Team Europe', nativeName: '歐洲聯隊', division: 'AWBL' },
  'EUR': { id: 8016, abbrev: 'EUR', name: 'Team Europe', nativeName: '歐洲聯隊', division: 'AWBL' },
  'ZZZ047': { id: 8016, abbrev: 'EUR', name: 'Team Europe', nativeName: '歐洲聯隊', division: 'AWBL' },
  '歐洲聯隊': { id: 8016, abbrev: 'EUR', name: 'Team Europe', nativeName: '歐洲聯隊', division: 'AWBL' },

  '8017': { id: 8017, abbrev: 'DOM', name: 'Dominican Republic', nativeName: '多明尼加', division: 'AWBL' },
  'DOM': { id: 8017, abbrev: 'DOM', name: 'Dominican Republic', nativeName: '多明尼加', division: 'AWBL' },
  'ZZZ027': { id: 8017, abbrev: 'DOM', name: 'Dominican Republic', nativeName: '多明尼加', division: 'AWBL' },
  'DOMINICAN REPUBLIC': { id: 8017, abbrev: 'DOM', name: 'Dominican Republic', nativeName: '多明尼加', division: 'AWBL' },
  '多明尼加': { id: 8017, abbrev: 'DOM', name: 'Dominican Republic', nativeName: '多明尼加', division: 'AWBL' },

  '8018': { id: 8018, abbrev: 'CTR', name: 'Chinese Taipei Red', nativeName: '中華紅', division: 'AWBL' },
  'CTR': { id: 8018, abbrev: 'CTR', name: 'Chinese Taipei Red', nativeName: '中華紅', division: 'AWBL' },
  'ZZZ028': { id: 8018, abbrev: 'CTR', name: 'Chinese Taipei Red', nativeName: '中華紅', division: 'AWBL' },
  '中華紅': { id: 8018, abbrev: 'CTR', name: 'Chinese Taipei Red', nativeName: '中華紅', division: 'AWBL' },

  '8019': { id: 8019, abbrev: 'CTW', name: 'Chinese Taipei White', nativeName: '中華白', division: 'AWBL' },
  'CTW': { id: 8019, abbrev: 'CTW', name: 'Chinese Taipei White', nativeName: '中華白', division: 'AWBL' },
  'ZZZ029': { id: 8019, abbrev: 'CTW', name: 'Chinese Taipei White', nativeName: '中華白', division: 'AWBL' },
  '中華白': { id: 8019, abbrev: 'CTW', name: 'Chinese Taipei White', nativeName: '中華白', division: 'AWBL' }
};

export const AWBL_VENUES = {
  '洲際': { id: 8901, name: 'Taichung Intercontinental Baseball Stadium', nativeName: '台中洲際棒球場', city: 'Taichung, Taiwan' },
  '斗六': { id: 8902, name: 'Douliu Baseball Stadium', nativeName: '斗六棒球場', city: 'Douliu, Yunlin, Taiwan' },
  '台南': { id: 8903, name: 'Tainan Municipal Baseball Stadium', nativeName: '台南市立棒球場', city: 'Tainan, Taiwan' },
  '亞太主': { id: 8905, name: 'Tainan Asia-Pacific International Baseball Stadium', nativeName: '亞太國際棒球訓練中心成棒主球場', city: 'Tainan, Taiwan' },
  '嘉市': { id: 8904, name: 'Chiayi City Baseball Stadium', nativeName: '嘉義市立棒球場', city: 'Chiayi, Taiwan' },
  '嘉義市': { id: 8904, name: 'Chiayi City Baseball Stadium', nativeName: '嘉義市立棒球場', city: 'Chiayi, Taiwan' },
  '澄清湖': { id: 8906, name: 'Chengcing Lake Baseball Stadium', nativeName: '澄清湖棒球場', city: 'Kaohsiung, Taiwan' },
  '桃園': { id: 8907, name: 'Taoyuan International Baseball Stadium', nativeName: '桃園國際棒球場', city: 'Taoyuan, Taiwan' },
  '樂天桃園': { id: 8907, name: 'Rakuten Taoyuan Baseball Stadium', nativeName: '樂天桃園棒球場', city: 'Taoyuan, Taiwan' },
  '台中': { id: 8908, name: 'Taichung Baseball Field', nativeName: '國立臺灣體育運動大學棒球場', city: 'Taichung, Taiwan' }
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
 * Classifies an AWBL game's round by season format and official GameSno:
 * - 2012–2013 (4 teams): Sno 1..42 = Regular Season (21g/team); Sno 43 = Championship Game
 * - 2015 & 2018 (5 teams, 2-game semifinals): Sno 1..40 = Regular Season (16g/team);
 *     Sno 41, 43 = Semifinal 1; Sno 42, 44 = Semifinal 2; Sno 45 = 3rd Place; Sno 46 = Championship
 * - 2016, 2017, 2019, 2023 (6 teams): Sno 1..51 = Regular Season (17g/team);
 *     Sno 52 = 5th Place; Sno 53 = Semifinal 1; Sno 54 = Semifinal 2; Sno 55 = 3rd Place; Sno 56 = Championship
 * - 2024–2025 (5 teams): Sno 1..40 = Regular Season;
 *     Sno 41 = Semifinal 1; Sno 42 = Semifinal 2; Sno 43 = 3rd Place; Sno 44 = Championship
 * - 2026+ (6 teams, 50-game regular season): Sno 1..50 = Regular Season;
 *     Sno 51 = Semifinal 1; Sno 52 = Semifinal 2; Sno 53 = 3rd Place; Sno 54 = Championship
 */
export function classifyAwblGameRound(sno, seasonYear, maxSno = 0) {
  const yr = parseInt(seasonYear, 10) || 2026;
  const n = parseInt(sno, 10) || 0;

  if (yr <= 2013) {
    if (n === 43) return { isPlayoff: true, seriesType: 'championship', seriesDesc: 'AWBL Championship' };
    return { isPlayoff: false, seriesType: 'regular', seriesDesc: 'Regular Season' };
  }

  if (yr === 2015 || yr === 2018) {
    if (n === 41 || n === 43) return { isPlayoff: true, seriesType: 'semifinal_1', seriesDesc: 'Semifinal 1' };
    if (n === 42 || n === 44) return { isPlayoff: true, seriesType: 'semifinal_2', seriesDesc: 'Semifinal 2' };
    if (n === 45) return { isPlayoff: true, seriesType: 'third_place', seriesDesc: '3rd Place Game' };
    if (n === 46) return { isPlayoff: true, seriesType: 'championship', seriesDesc: 'AWBL Championship' };
    return { isPlayoff: false, seriesType: 'regular', seriesDesc: 'Regular Season' };
  }

  if (yr === 2016 || yr === 2017 || yr === 2019 || yr === 2023) {
    if (n === 52) return { isPlayoff: true, seriesType: 'fifth_place', seriesDesc: '5th Place Game' };
    if (n === 53) return { isPlayoff: true, seriesType: 'semifinal_1', seriesDesc: 'Semifinal 1' };
    if (n === 54) return { isPlayoff: true, seriesType: 'semifinal_2', seriesDesc: 'Semifinal 2' };
    if (n === 55) return { isPlayoff: true, seriesType: 'third_place', seriesDesc: '3rd Place Game' };
    if (n === 56) return { isPlayoff: true, seriesType: 'championship', seriesDesc: 'AWBL Championship' };
    return { isPlayoff: false, seriesType: 'regular', seriesDesc: 'Regular Season' };
  }

  if (yr === 2024 || yr === 2025) {
    if (n === 41) return { isPlayoff: true, seriesType: 'semifinal_1', seriesDesc: 'Semifinal 1' };
    if (n === 42) return { isPlayoff: true, seriesType: 'semifinal_2', seriesDesc: 'Semifinal 2' };
    if (n === 43) return { isPlayoff: true, seriesType: 'third_place', seriesDesc: '3rd Place Game' };
    if (n === 44) return { isPlayoff: true, seriesType: 'championship', seriesDesc: 'AWBL Championship' };
    return { isPlayoff: false, seriesType: 'regular', seriesDesc: 'Regular Season' };
  }

  // 2026+ (50 regular-season games, followed by Sno 51..54 playoffs once scheduled)
  const regCap = maxSno > 54 ? (maxSno - 4) : 50;
  if (n > regCap) {
    const idx = n - regCap;
    if (idx === 1) return { isPlayoff: true, seriesType: 'semifinal_1', seriesDesc: 'Semifinal 1' };
    if (idx === 2) return { isPlayoff: true, seriesType: 'semifinal_2', seriesDesc: 'Semifinal 2' };
    if (idx === 3) return { isPlayoff: true, seriesType: 'third_place', seriesDesc: '3rd Place Game' };
    if (idx === 4) return { isPlayoff: true, seriesType: 'championship', seriesDesc: 'AWBL Championship' };
  }
  return { isPlayoff: false, seriesType: 'regular', seriesDesc: 'Regular Season' };
}

/**
 * Normalizes raw CPBL AWBL game records into the standardized division race schema
 */
export function normalizeAwblGames(rawGames, season = 2026) {
  if (!Array.isArray(rawGames)) return { regularSeason: [], postseason: [] };

  const regularSeason = [];
  const postseasonGames = [];
  const yr = parseInt(season, 10) || 2026;

  // Sort games chronologically by date and game number
  const sorted = [...rawGames].sort((a, b) => {
    const da = new Date(a.GameDate || a.GameDateTimeS).getTime();
    const db = new Date(b.GameDate || b.GameDateTimeS).getTime();
    if (da !== db) return da - db;
    return (a.GameSno || 0) - (b.GameSno || 0);
  });

  const maxSno = sorted.reduce((acc, g) => Math.max(acc, parseInt(g.GameSno, 10) || 0), 0);

  sorted.forEach((g) => {
    const awayTeam = resolveAwblTeam(g.VisitingTeamCode || g.VisitingTeamName);
    const homeTeam = resolveAwblTeam(g.HomeTeamCode || g.HomeTeamName);

    if (!awayTeam || !homeTeam) {
      return;
    }

    const gameDateRaw = g.GameDateTimeS || g.GameDate || `${yr}-11-15T12:00:00`;
    const officialDate = (g.GameDate || gameDateRaw).slice(0, 10);
    const gamePk = `${officialDate.replace(/-/g, '')}${String(g.GameSno || 1).padStart(5, '0')}`;

    const venueInfo = AWBL_VENUES[g.FieldAbbe] || {
      id: 8900,
      name: g.FieldAbbe ? `${g.FieldAbbe} Stadium` : 'Taiwan Ballpark',
      city: 'Taiwan'
    };

    // CPBL GameResult codes:
    // '0' = Completed (Final)
    // '1' = Postponed / Rescheduled rainout (unplayed original slot)
    // '4' = Cancelled rainout (not made up)
    // ''  = Scheduled upcoming game
    const resCode = g.GameResult != null ? String(g.GameResult).trim() : '';
    const isPostponed = g.IsGameStop === '1' || resCode === '1' || resCode === '4';
    const isFinal = !isPostponed && (
      resCode === '0' ||
      Boolean(resCode === '' && g.GameDateTimeE && (g.WinningPitcherName || g.VisitingScore !== g.HomeScore))
    );

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

    const { isPlayoff: isPlayoffGame, seriesType, seriesDesc } = classifyAwblGameRound(g.GameSno, yr, maxSno);

    const normalizedGame = {
      gamePk,
      season: parseInt(g.Year || yr, 10),
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
  const yr = parseInt(season, 10) || 2026;
  const isChampOnlyEra = yr <= 2013;

  if (!postseasonGames || postseasonGames.length === 0) {
    if (isChampOnlyEra) {
      return {
        year: yr,
        era: 'awbl_championship',
        isStarted: false,
        isComplete: false,
        championship: { id: 'awbl-champ', name: 'AWBL Championship', format: 'Single Game', isStarted: false, isComplete: false },
        thirdPlace: null,
        semifinal1: null,
        semifinal2: null
      };
    }
    return {
      year: yr,
      era: 'awbl_semifinals',
      isStarted: false,
      isComplete: false,
      championship: { id: 'awbl-champ', name: 'AWBL Championship', format: 'Single Game', isStarted: false, isComplete: false },
      thirdPlace: { id: 'awbl-third', name: '3rd Place Game', format: 'Single Game', isStarted: false, isComplete: false },
      semifinal1: { id: 'awbl-semi1', name: 'Semifinal 1', format: 'Single Game', isStarted: false, isComplete: false },
      semifinal2: { id: 'awbl-semi2', name: 'Semifinal 2', format: 'Single Game', isStarted: false, isComplete: false }
    };
  }

  const sf1Games = postseasonGames.filter(g => g.playoffType === 'semifinal_1');
  const sf2Games = postseasonGames.filter(g => g.playoffType === 'semifinal_2');
  const thirdGames = postseasonGames.filter(g => g.playoffType === 'third_place');
  const champGames = postseasonGames.filter(g => g.playoffType === 'championship');

  const champParticipantIds = new Set();
  champGames.forEach(cg => {
    if (cg.teams?.away?.team?.id) champParticipantIds.add(cg.teams.away.team.id);
    if (cg.teams?.home?.team?.id) champParticipantIds.add(cg.teams.home.team.id);
  });

  const buildSeries = (id, name, seriesGames) => {
    if (!seriesGames || seriesGames.length === 0) {
      return { id, name, format: 'Single Game', isStarted: false, isComplete: false, games: [] };
    }

    const first = seriesGames[0];
    // Place home team of Game 1 on top (higher seed in AWBL) when single-game, or preserve consistent pair
    const topTeamMeta = first.teams.home.team;
    const botTeamMeta = first.teams.away.team;

    let topWins = 0;
    let botWins = 0;
    let startedCount = 0;
    let finalCount = 0;

    const formattedGames = seriesGames.map((gm, idx) => {
      const gmFinal = gm.status?.detailedState === 'Final';
      const gmLive = gm.status?.detailedState === 'In Progress' || gm.status?.abstractGameState === 'L';
      if (gmFinal || gmLive) startedCount++;
      if (gmFinal) finalCount++;

      const a = gm.teams.away;
      const h = gm.teams.home;
      let gmWinnerId = null;
      if (gmFinal) {
        if (a.isWinner) gmWinnerId = a.team.id;
        else if (h.isWinner) gmWinnerId = h.team.id;
        if (gmWinnerId === topTeamMeta.id) topWins++;
        else if (gmWinnerId === botTeamMeta.id) botWins++;
      }

      return {
        game: idx + 1,
        date: gm.officialDate,
        away: a.team.name,
        home: h.team.name,
        awayScore: gmFinal ? a.score : undefined,
        homeScore: gmFinal ? h.score : undefined,
        winnerId: gmWinnerId,
        isTie: Boolean(gm.isTie),
        isFinal: gmFinal,
        venue: gm.venue?.name || ''
      };
    });

    const isStarted = startedCount > 0;
    const isComplete = finalCount === seriesGames.length && seriesGames.length > 0;
    let winnerId = null;
    if (isComplete) {
      if (topWins > botWins) {
        winnerId = topTeamMeta.id;
      } else if (botWins > topWins) {
        winnerId = botTeamMeta.id;
      } else if (id === 'awbl-semi1' || id === 'awbl-semi2') {
        // AWBL tiebreaker rule: tied semifinal series/game advances higher regular-season seed (verified via Championship participants)
        if (champParticipantIds.has(topTeamMeta.id) && !champParticipantIds.has(botTeamMeta.id)) {
          winnerId = topTeamMeta.id;
        } else if (champParticipantIds.has(botTeamMeta.id) && !champParticipantIds.has(topTeamMeta.id)) {
          winnerId = botTeamMeta.id;
        } else {
          winnerId = topTeamMeta.id;
        }
      }
    }

    // For single-game series that ended in a tiebreak advancement, reflect 1 series win on the advancing club for bracket track rendering
    const effectiveTopWins = (seriesGames.length === 1 && isComplete && topWins === 0 && botWins === 0 && winnerId === topTeamMeta.id) ? 1 : topWins;
    const effectiveBotWins = (seriesGames.length === 1 && isComplete && topWins === 0 && botWins === 0 && winnerId === botTeamMeta.id) ? 1 : botWins;

    const lastFinal = formattedGames[formattedGames.length - 1];
    const topLastScore = seriesGames.length === 1 && lastFinal?.isFinal
      ? (seriesGames[0].teams.home.team.id === topTeamMeta.id ? seriesGames[0].teams.home.score : seriesGames[0].teams.away.score)
      : undefined;
    const botLastScore = seriesGames.length === 1 && lastFinal?.isFinal
      ? (seriesGames[0].teams.away.team.id === botTeamMeta.id ? seriesGames[0].teams.away.score : seriesGames[0].teams.home.score)
      : undefined;

    const winsNeeded = seriesGames.length > 1 ? Math.max(1, topWins, botWins) : 1;

    return {
      id,
      name,
      format: seriesGames.length > 1 ? `${seriesGames.length}-Game Series` : 'Single Game',
      winsNeeded,
      isStarted,
      isComplete,
      winnerId,
      championId: id === 'awbl-champ' ? winnerId : undefined,
      teamTop: {
        id: topTeamMeta.id,
        name: topTeamMeta.name,
        abbrev: topTeamMeta.abbrev,
        ...(topLastScore !== undefined ? { score: topLastScore } : {}),
        wins: effectiveTopWins,
        isWinner: Boolean(winnerId && winnerId === topTeamMeta.id)
      },
      teamBottom: {
        id: botTeamMeta.id,
        name: botTeamMeta.name,
        abbrev: botTeamMeta.abbrev,
        ...(botLastScore !== undefined ? { score: botLastScore } : {}),
        wins: effectiveBotWins,
        isWinner: Boolean(winnerId && winnerId === botTeamMeta.id)
      },
      games: formattedGames
    };
  };

  const championship = buildSeries('awbl-champ', 'AWBL Championship', champGames);
  if (isChampOnlyEra) {
    return {
      year: yr,
      era: 'awbl_championship',
      isComplete: Boolean(championship?.isComplete),
      isStarted: Boolean(championship?.isStarted),
      championship,
      thirdPlace: null,
      semifinal1: null,
      semifinal2: null
    };
  }

  const thirdPlace = buildSeries('awbl-third', '3rd Place Game', thirdGames);
  const semifinal1 = buildSeries('awbl-semi1', 'Semifinal 1', sf1Games);
  const semifinal2 = buildSeries('awbl-semi2', 'Semifinal 2', sf2Games);

  return {
    year: yr,
    era: 'awbl_semifinals',
    isComplete: Boolean(championship?.isComplete),
    isStarted: Boolean(semifinal1?.isStarted || semifinal2?.isStarted || championship?.isStarted),
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

    // Generate src/data/awbl/{season}.js offline bundle
    const postSnippet = structuredPostseason ? JSON.stringify(structuredPostseason, null, 2) : 'null';
    const bundleContent = `/**\n * Embedded AWBL (Asia Winter Baseball League) Season Data for ${season}\n * Enables zero-server local execution (file:/// protocol) without CORS restrictions.\n */\n(function() {\n  const games = ${JSON.stringify(regularSeason, null, 2)};\n  const postseason = ${postSnippet};\n  if (typeof window !== "undefined") {\n    window.AWBL_STATIC_DATA = window.AWBL_STATIC_DATA || {};\n    window.AWBL_STATIC_DATA["${season}"] = games;\n    window.AWBL_DATA = window.AWBL_DATA || {};\n    window.AWBL_DATA["${season}"] = games;\n    if (postseason) {\n      window.AWBL_POSTSEASON_STATIC = window.AWBL_POSTSEASON_STATIC || {};\n      window.AWBL_POSTSEASON_STATIC["${season}"] = postseason;\n    }\n  }\n  if (typeof globalThis !== "undefined") {\n    globalThis.AWBL_STATIC_DATA = globalThis.AWBL_STATIC_DATA || {};\n    globalThis.AWBL_STATIC_DATA["${season}"] = games;\n    globalThis.AWBL_DATA = globalThis.AWBL_DATA || {};\n    globalThis.AWBL_DATA["${season}"] = games;\n    if (postseason) {\n      globalThis.AWBL_POSTSEASON_STATIC = globalThis.AWBL_POSTSEASON_STATIC || {};\n      globalThis.AWBL_POSTSEASON_STATIC["${season}"] = postseason;\n    }\n  }\n  if (typeof module !== "undefined" && module.exports) {\n    module.exports = games;\n  }\n})();\n`;
    fs.writeFileSync(path.join(srcDataDir, `${season}.js`), bundleContent, 'utf8');
    console.log(`[scrapeAWBL] Synced static and offline assets to public/ and src/data/awbl/`);
  }

  return { regularSeason, postseason, structuredPostseason };
}

// CLI entry point
if (process.argv[1] && process.argv[1].endsWith('scrapeAWBL.js')) {
  const args = process.argv.slice(2);
  let season = 2026;
  let isSync = false;
  let scrapeAll = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--season' && args[i + 1]) {
      season = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--sync') {
      isSync = true;
    } else if (args[i] === '--all') {
      scrapeAll = true;
    }
  }

  const run = async () => {
    if (scrapeAll) {
      // Scrape oldest to newest so metadata.json finishes with the latest active season (2026)
      for (const yr of [...OFFICIAL_AWBL_SEASONS].reverse()) {
        await scrapeAwbl({ season: yr, sync: isSync });
      }
    } else {
      await scrapeAwbl({ season, sync: isSync });
    }
  };

  run()
    .then(() => {
      console.log('✅ AWBL scraping complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Scraper error:', err);
      process.exit(1);
    });
}

import { type BotEvent, type BotAction } from '../types/monitor';

// Pool of real-user browser agents
const USER_AGENTS_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile',
  'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/120.0'
];

// Pool of bot libraries/scripts
const BOT_USER_AGENTS = ['python-requests/2.31.0', 'curl/8.4.0', 'Scrapy/2.11.0', 'Go-http-client/1.1', 'Wget/1.21.4'];

// Search crawler user agents
const VERIFIED_BOTS = ['Googlebot/2.1 (+http://www.google.com/bot.html)', 'Bingbot/2.0 (+http://www.bing.com/bingbot.htm)'];

// Target endpoints matching Elasticsearch routes and whitelist
const ENDPOINTS = ['/api/products', '/api/products/847', '/api/search', '/api/prices/847', '/api/login', '/health'];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Masks IP addresses to respect privacy constraints (sanitizing PII)
function maskIp(rawIp: string): string {
  const parts = rawIp.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  return rawIp;
}

// Generates simulated middleware request logs based on chosen profiles
export function generateRandomEvent(mode: string): BotEvent {
  const id = Math.random().toString(36).substring(2, 9);
  const now = new Date();
  const timestamp = now.toLocaleTimeString() + '.' + String(now.getMilliseconds()).padStart(3, '0');

  let ip = `${Math.floor(Math.random() * 150 + 50)}.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`;
  let method = 'GET';
  let endpoint = getRandomElement(ENDPOINTS);
  let action: BotAction = 'Allow';
  let score = Math.floor(Math.random() * 20);
  let reason = 'Passed all rules';
  let latencyMs = Math.floor(Math.random() * 4) + 1;
  let userAgent = getRandomElement(USER_AGENTS_POOL);

  // Apply scenario characteristics
  const scenario = mode === 'mix' ? getRandomElement(['legit', 'naive', 'scraper', 'rotating', 'distributed', 'credential']) : mode;

  switch (scenario) {
    case 'naive':
      ip = '203.0.113.88';
      method = 'GET';
      endpoint = '/api/products';
      userAgent = ''; // Empty User-Agent
      action = 'Block';
      score = 95;
      reason = 'Missing User-Agent';
      break;

    case 'scraper':
      ip = '198.51.100.12';
      method = 'GET';
      endpoint = getRandomElement(['/api/prices/432', '/api/products/847']);
      userAgent = getRandomElement(BOT_USER_AGENTS);
      action = 'Throttle';
      score = 75;
      reason = 'Suspicious User-Agent, Rate limit exceeded';
      break;

    case 'rotating':
      ip = '192.0.2.45';
      method = 'GET';
      endpoint = '/api/products';
      userAgent = getRandomElement(BOT_USER_AGENTS.concat(USER_AGENTS_POOL)); // Scraper rotating UAs
      action = 'Block';
      score = 90;
      reason = 'Global IP rate limit exceeded (NAT threshold)';
      break;

    case 'distributed':
      ip = `${Math.floor(Math.random() * 220 + 20)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      method = 'GET';
      endpoint = '/api/search';
      latencyMs = Math.floor(Math.random() * 400) + 100; // Search has artificial delay (100-500ms)
      userAgent = getRandomElement(USER_AGENTS_POOL);
      action = 'Shadow';
      score = 45;
      reason = 'Search endpoint spike (Shadow tracking)';
      break;

    case 'credential':
      ip = '198.51.100.99';
      method = 'POST';
      endpoint = '/api/login';
      userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0';
      action = 'Tarpit';
      score = 100;
      reason = 'Brute force credential stuffing';
      latencyMs = 5000; // Tarpitted connections delayed for 5s
      break;

    case 'legit':
    default:
      const isPartner = Math.random() > 0.7;
      const isVerifiedBot = Math.random() > 0.85;

      if (isVerifiedBot) {
        userAgent = getRandomElement(VERIFIED_BOTS);
        endpoint = '/api/products';
        action = 'Allow';
        score = 0;
        reason = 'Verified Googlebot/Bingbot via DNS reverse lookup';
      } else if (isPartner) {
        endpoint = '/api/products';
        action = 'Allow';
        score = 0;
        reason = 'Bypassed - Trusted API Key';
      } else {
        if (endpoint === '/health') {
          action = 'Allow';
          score = 0;
          reason = 'Bypassed whitelisted path';
        } else {
          action = 'Allow';
          score = Math.floor(Math.random() * 25);
          reason = 'Passed all rules';
        }
      }
      break;
  }

  return {
    id,
    timestamp,
    ip: maskIp(ip),
    method,
    endpoint,
    action,
    score,
    reason,
    latencyMs,
    userAgent,
  };
}

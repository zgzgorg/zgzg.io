// Netlify Function: POST /api/gala-subscribe，逻辑见 ../lib/subscribe.mjs。
import {handle} from '../lib/subscribe.mjs';

export default (request) => handle(request, {
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  BREVO_GALA_LIST_ID: process.env.BREVO_GALA_LIST_ID,
});

export const config = {
  path: '/api/gala-subscribe',
  // 每个 IP 每分钟最多 5 次，防刷。
  rateLimit: {windowLimit: 5, windowSize: 60, aggregateBy: ['ip', 'domain']},
};

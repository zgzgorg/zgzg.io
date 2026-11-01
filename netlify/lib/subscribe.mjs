// 2027 春晚开票通知订阅：校验表单，把联系人加入 Brevo 列表。
// 开票时在 Brevo 后台对该列表群发邮件或短信。
const BREVO = 'https://api.brevo.com/v3/contacts';
const EVENT = '2027-gala';
const MAX_BODY = 2048;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+1[2-9]\d{2}[2-9]\d{6}$/;
const ORIGIN_RE = /^https:\/\/((www\.)?zgzg\.io|[\w-]+--zgzg-io\.netlify\.app)$/;

const invalid = (reason) => ({ok: false, reason});

export function validate(body) {
  if (!body || typeof body !== 'object') return invalid('body');
  if (body.event !== EVENT) return invalid('event');
  const {email = null, phone = null, sms_consent: consent} = body;
  if (email !== null && typeof email !== 'string') return invalid('email');
  if (phone !== null && typeof phone !== 'string') return invalid('phone');
  const address = email ? email.trim().toLowerCase() : null;
  if (address && (address.length > 254 || !EMAIL_RE.test(address))) {
    return invalid('email');
  }
  if (phone && !PHONE_RE.test(phone)) return invalid('phone');
  if (phone && consent !== true) return invalid('consent');
  if (!address && !phone) return invalid('contact');
  return {ok: true, email: address, phone: phone || null};
}

async function brevo(url, method, payload, env, fetchFn) {
  const res = await fetchFn(url, {
    method,
    headers: {'api-key': env.BREVO_API_KEY, 'content-type': 'application/json',
      'accept': 'application/json'},
    body: JSON.stringify(payload),
  });
  const text = res.status === 204 ? '' : await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {raw: text.slice(0, 200)};
  }
  return {status: res.status, ok: res.ok, data};
}

function fail(step, res) {
  return new Error(`Brevo ${step} failed: ${res.status} ` +
    `${res.data.code || ''} ${res.data.message || ''}`.trim());
}

export async function subscribe({email, phone}, env, fetchFn = fetch) {
  const listIds = [Number(env.BREVO_GALA_LIST_ID)];
  const created = await brevo(BREVO, 'POST', {
    ...(email && {email}),
    ...(phone && {attributes: {SMS: phone}}),
    listIds, updateEnabled: true,
  }, env, fetchFn);
  if (created.ok) return;
  // 手机号已属于另一个联系人（重复订阅或换了邮箱）：把那个联系人加入列表，
  // 邮箱单独建档，保证两种联系方式都在列表里。
  if (!(created.status === 400 && created.data.code === 'duplicate_parameter' &&
      phone)) {
    throw fail('create', created);
  }
  const byPhone = await brevo(`${BREVO}/${encodeURIComponent(phone)}` +
    '?identifierType=phone_id', 'PUT', {listIds}, env, fetchFn);
  if (!byPhone.ok) throw fail('update phone', byPhone);
  if (!email) return;
  const byEmail = await brevo(BREVO, 'POST', {email, listIds,
    updateEnabled: true}, env, fetchFn);
  if (!byEmail.ok) throw fail('create email', byEmail);
}

const reply = (status, error) => new Response(
    error ? JSON.stringify({ok: false, error}) : null,
    {status, headers: {'content-type': 'application/json',
      'cache-control': 'no-store'}});

export async function handle(request, env, fetchFn = fetch) {
  if (request.method !== 'POST') return reply(405, 'method');
  const origin = request.headers.get('origin');
  if (origin && !ORIGIN_RE.test(origin)) return reply(403, 'origin');
  if (!env.BREVO_API_KEY || !Number(env.BREVO_GALA_LIST_ID)) {
    console.error('gala-subscribe: BREVO_API_KEY or BREVO_GALA_LIST_ID unset');
    return reply(503, 'unavailable');
  }
  const text = await request.text();
  if (text.length > MAX_BODY) return reply(413, 'too_large');
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return reply(400, 'json');
  }
  const input = validate(body);
  if (!input.ok) return reply(400, input.reason);
  try {
    await subscribe(input, env, fetchFn);
  } catch (error) {
    console.error('gala-subscribe:', error.message);
    return reply(502, 'upstream');
  }
  return reply(204);
}

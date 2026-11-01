// 2027 春晚开票通知订阅：校验表单，把联系人加入 Brevo 列表。
// 开票时在 Brevo 后台对该列表群发邮件或短信。
const BREVO = 'https://api.brevo.com/v3/contacts';
const EVENT = '2027-gala';
const MAX_BODY = 2048;
const TIMEOUT_MS = 4000;
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
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = res.status === 204 ? '' : await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  return {status: res.status, ok: res.ok, code: data.code || ''};
}

// 只记录状态码和错误码：Brevo 的 message 可能带出邮箱或手机号。
function fail(step, res) {
  return new Error(`Brevo ${step} failed: ${res.status} ${res.code}`.trim());
}

const isDuplicate = (res) =>
  res.status === 400 && res.code === 'duplicate_parameter';

// 已有联系人：只加入列表，不改它的任何字段（防止别人覆盖你的手机号或邮箱）。
async function addExisting(ids, env, fetchFn, listIds) {
  for (const [id, type] of ids) {
    const res = await brevo(`${BREVO}/${encodeURIComponent(id)}` +
      `?identifierType=${type}`, 'PUT', {listIds}, env, fetchFn);
    if (res.ok) return;
    if (res.status !== 404) throw fail(`update ${type}`, res);
  }
  throw new Error(`Brevo update ${ids[0][1]} failed: 404`);
}

// 新联系人直接建档；已存在则只把它加入列表。
async function upsert(fields, existing, env, fetchFn, listIds) {
  const res = await brevo(BREVO, 'POST', {...fields, listIds,
    updateEnabled: false}, env, fetchFn);
  if (res.ok) return true;
  if (!isDuplicate(res)) throw fail('create', res);
  await addExisting(existing, env, fetchFn, listIds);
  return false;
}

export async function subscribe({email, phone}, env, fetchFn = fetch) {
  const listIds = [Number(env.BREVO_GALA_LIST_ID)];
  const phoneIds = phone ?
    [[phone, 'phone_id'], [phone.slice(1), 'phone_id']] : [];
  if (email && phone) {
    // 先试一次建一个含邮箱和手机号的联系人；任一已存在则分开处理。
    const both = await brevo(BREVO, 'POST', {email, attributes: {SMS: phone},
      listIds, updateEnabled: false}, env, fetchFn);
    if (both.ok) return;
    if (!isDuplicate(both)) throw fail('create', both);
  }
  if (email) {
    await upsert({email}, [[email, 'email_id']], env, fetchFn, listIds);
  }
  if (phone) {
    await upsert({attributes: {SMS: phone}}, phoneIds, env, fetchFn, listIds);
  }
}

const reply = (status, error) => new Response(
    error ? JSON.stringify({ok: false, error}) : null,
    {status, headers: {'content-type': 'application/json',
      'cache-control': 'no-store'}});

export async function handle(request, env, fetchFn = fetch) {
  if (request.method !== 'POST') return reply(405, 'method');
  const origin = request.headers.get('origin');
  if (origin && !ORIGIN_RE.test(origin)) return reply(403, 'origin');
  const listId = Number(env.BREVO_GALA_LIST_ID);
  if (!env.BREVO_API_KEY || !Number.isInteger(listId) || listId <= 0) {
    console.error('gala-subscribe: BREVO_API_KEY or BREVO_GALA_LIST_ID unset');
    return reply(503, 'unavailable');
  }
  if (Number(request.headers.get('content-length')) > MAX_BODY) {
    return reply(413, 'too_large');
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY) {
    return reply(413, 'too_large');
  }
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return reply(400, 'json');
  }
  // 蜜罐字段：真人看不到也不会填，机器人填了就假装成功、什么都不存。
  if (body && body.website) return reply(204);
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

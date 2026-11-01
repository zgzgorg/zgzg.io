import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validate, subscribe, handle} from '../lib/subscribe.mjs';

const ENV = {BREVO_API_KEY: 'xkeysib-test', BREVO_GALA_LIST_ID: '7'};

function fakeFetch(responses) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({url, init, body: init.body ? JSON.parse(init.body) : null});
    const next = responses.shift() || {status: 201, body: {}};
    return new Response(next.body === undefined ? null :
      JSON.stringify(next.body), {status: next.status});
  };
  fn.calls = calls;
  return fn;
}

function post(body, headers = {}) {
  return new Request('https://zgzg.io/api/gala-subscribe', {
    method: 'POST',
    headers: {'content-type': 'application/json',
      'origin': 'https://zgzg.io', ...headers},
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

test('validate accepts email only', () => {
  const r = validate({event: '2027-gala', email: ' A@B.co ', phone: null,
    sms_consent: false});
  assert.deepEqual(r, {ok: true, email: 'a@b.co', phone: null});
});

test('validate accepts phone with consent', () => {
  const r = validate({event: '2027-gala', email: null, phone: '+14085551234',
    sms_consent: true});
  assert.deepEqual(r, {ok: true, email: null, phone: '+14085551234'});
});

test('validate rejects bad input', () => {
  const bad = [
    null,
    {event: 'other', email: 'a@b.co'},
    {event: '2027-gala'},
    {event: '2027-gala', email: 'not-an-email'},
    {event: '2027-gala', email: 'a@b.co'.padStart(300, 'x')},
    {event: '2027-gala', phone: '+14085551234', sms_consent: false},
    {event: '2027-gala', phone: '+11085551234', sms_consent: true},
    {event: '2027-gala', phone: '4085551234', sms_consent: true},
    {event: '2027-gala', email: 42},
  ];
  for (const body of bad) assert.equal(validate(body).ok, false);
});

test('subscribe creates Brevo contact on the gala list', async () => {
  const f = fakeFetch([{status: 201, body: {id: 1}}]);
  await subscribe({email: 'a@b.co', phone: '+14085551234'}, ENV, f);
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].url, 'https://api.brevo.com/v3/contacts');
  assert.equal(f.calls[0].init.headers['api-key'], 'xkeysib-test');
  assert.deepEqual(f.calls[0].body, {email: 'a@b.co',
    attributes: {SMS: '+14085551234'}, listIds: [7], updateEnabled: true});
});

test('subscribe is idempotent when phone already belongs to a contact',
    async () => {
      const f = fakeFetch([
        {status: 400, body: {code: 'duplicate_parameter'}},
        {status: 204},
        {status: 204},
      ]);
      await subscribe({email: 'a@b.co', phone: '+14085551234'}, ENV, f);
      assert.equal(f.calls[1].url,
          'https://api.brevo.com/v3/contacts/%2B14085551234' +
          '?identifierType=phone_id');
      assert.equal(f.calls[1].init.method, 'PUT');
      assert.deepEqual(f.calls[1].body, {listIds: [7]});
      assert.deepEqual(f.calls[2].body, {email: 'a@b.co', listIds: [7],
        updateEnabled: true});
    });

test('subscribe throws on Brevo failure', async () => {
  const f = fakeFetch([{status: 401, body: {code: 'unauthorized'}}]);
  await assert.rejects(subscribe({email: 'a@b.co', phone: null}, ENV, f));
});

test('handle returns 204 on success', async () => {
  const f = fakeFetch([{status: 201, body: {id: 1}}]);
  const res = await handle(post({event: '2027-gala', email: 'a@b.co',
    phone: null, sms_consent: false}), ENV, f);
  assert.equal(res.status, 204);
});

test('handle rejects wrong method, origin, body, and missing config',
    async () => {
      const f = fakeFetch([]);
      const good = {event: '2027-gala', email: 'a@b.co'};
      const get = new Request('https://zgzg.io/api/gala-subscribe');
      assert.equal((await handle(get, ENV, f)).status, 405);
      assert.equal((await handle(post(good, {origin: 'https://evil.example'}),
          ENV, f)).status, 403);
      assert.equal((await handle(post('{not json'), ENV, f)).status, 400);
      assert.equal((await handle(post('x'.repeat(5000)), ENV, f)).status, 413);
      assert.equal((await handle(post({event: '2027-gala'}), ENV, f)).status,
          400);
      assert.equal((await handle(post(good), {}, f)).status, 503);
      assert.equal(f.calls.length, 0);
    });

test('handle allows Netlify deploy previews', async () => {
  const good = {event: '2027-gala', email: 'a@b.co'};
  const preview = 'https://deploy-preview-301--zgzg-io.netlify.app';
  assert.equal((await handle(post(good, {origin: preview}), ENV,
      fakeFetch([]))).status, 204);
});

test('handle returns 502 when Brevo fails', async () => {
  const f = fakeFetch([{status: 500, body: {}}]);
  const res = await handle(post({event: '2027-gala', email: 'a@b.co'}),
      ENV, f);
  assert.equal(res.status, 502);
});

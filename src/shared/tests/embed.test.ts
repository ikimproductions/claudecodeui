import assert from 'node:assert/strict';

import { test } from 'vitest';

import { embedSearch, embedSessionRedirect, isEmbedded, embedOrigin, embedTheme } from '@/shared/embed';

test('embedTheme: the parent theme from the frame URL, only dark or light, only in embed mode', () => {
  assert.equal(embedTheme('?embed=1&theme=dark'), 'dark');
  assert.equal(embedTheme('?embed=1&theme=light'), 'light');
  assert.equal(embedTheme('?embed=1&theme=blue'), '');
  assert.equal(embedTheme('?embed=1'), '');
  assert.equal(embedTheme('?theme=dark'), '');
});

test('embed=1 in the query marks the frame as embedded', () => {
  assert.equal(isEmbedded('?project=%2Fp&embed=1'), true);
  assert.equal(isEmbedded('?project=%2Fp'), false);
  assert.equal(isEmbedded(''), false);
});

test('embedSearch keeps project + embed across navigation and drops session; empty outside embed', () => {
  assert.equal(embedSearch('?project=%2Fp&embed=1&session=abc'), '?project=%2Fp&embed=1');
  assert.equal(embedSearch('?project=%2Fp&session=abc'), '');
});

test('?session= on the root route redirects to /session/<id> with the embed query kept', () => {
  assert.equal(embedSessionRedirect('/', '?project=%2Fp&embed=1&session=abc'), '/session/abc?project=%2Fp&embed=1');
  assert.equal(embedSessionRedirect('/session/abc', '?project=%2Fp&embed=1&session=abc'), null);
  assert.equal(embedSessionRedirect('/', '?project=%2Fp&embed=1'), null);
  assert.equal(embedSessionRedirect('/', '?session=abc'), null, 'the deep link is an embed feature');
});

test('embedOrigin: the parent origin from the frame URL, only in embed mode and only a bare origin', () => {
  assert.equal(embedOrigin('?project=x&embed=1&origin=https%3A%2F%2Fmac.tail.ts.net%3A8739'), 'https://mac.tail.ts.net:8739');
  assert.equal(embedOrigin('?project=x&origin=https%3A%2F%2Fmac.tail.ts.net'), '');
  assert.equal(embedOrigin('?embed=1'), '');
  assert.equal(embedOrigin('?embed=1&origin=javascript%3Aalert(1)'), '');
  assert.equal(embedOrigin('?embed=1&origin=http%3A%2F%2Fa%2Fpath'), '');
});

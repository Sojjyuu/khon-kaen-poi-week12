import { expect, it } from '@jest/globals';
import { resolveApiUrl } from '../../src/services/apiConfig';
it('uses an explicit API URL before the detected LAN address', () => {
  expect(resolveApiUrl(' https://api.example.test/ ', '10.30.136.5:8081', false)).toBe('https://api.example.test');
});
it('finds the API on the Expo LAN host without an env file', () => {
  expect(resolveApiUrl(undefined, '10.30.136.5:8081', true)).toBe('http://10.30.136.5:4100');
  expect(resolveApiUrl('', '192.168.137.1:8081', true)).toBe('http://192.168.137.1:4100');
});
it('does not guess an API behind a tunnel, in release builds or with malformed configuration', () => {
  expect(resolveApiUrl(undefined, 'abc.exp.direct:80', true)).toBe('');
  expect(resolveApiUrl(undefined, '10.0.0.1:8081', false)).toBe('');
  expect(resolveApiUrl('invalid', '10.0.0.1:8081', true)).toBe('');
  expect(resolveApiUrl(undefined, null, true)).toBe('');
});

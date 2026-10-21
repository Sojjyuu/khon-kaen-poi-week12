import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { expect, it, jest } from '@jest/globals';
import { router } from 'expo-router';
import JourneyScreen from '../../app/journey';
import { requestJson } from '../../src/services/campusApi';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() }, useLocalSearchParams: () => ({}) }));
jest.mock('../../src/features/auth/session', () => ({ useSession: () => ({ session: { status: 'authenticated', token: 'test-token', user: { id: 'alice' } } }) }));
jest.mock('../../src/services/campusApi', () => ({ requestJson: jest.fn() }));
jest.mock('../../src/services/favorites', () => ({ getFavoritePoiIds: async () => ['kku'] }));
jest.mock('../../src/services/accountPhoto', () => ({ chooseAccountPhoto: jest.fn() }));

it('validates a trip, preserves the draft after API failure, and saves with the signed-in account', async () => {
  const screen = await render(<JourneyScreen />);
  await waitFor(() => expect(screen.getByLabelText('ชื่อทริป')).toBeTruthy());
  await fireEvent.press(screen.getByRole('button', { name: 'บันทึกทริป' }));
  expect(requestJson).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('ชื่อทริป'), 'วันเที่ยวขอนแก่น');
  await fireEvent.changeText(screen.getByLabelText('วันเดินทาง'), '2026-09-28');
  await fireEvent.changeText(screen.getByLabelText('โน้ตการเดินทาง'), 'นัดเพื่อนที่มหาวิทยาลัย');
  jest.mocked(requestJson).mockRejectedValueOnce(new Error('offline'));
  await fireEvent.press(screen.getByRole('button', { name: 'บันทึกทริป' }));
  await waitFor(() => expect(screen.getByText('offline')).toBeTruthy());
  expect(screen.getByLabelText('ชื่อทริป').props.value).toBe('วันเที่ยวขอนแก่น');
  expect(router.replace).not.toHaveBeenCalled();
  jest.mocked(requestJson).mockImplementation(async (_path, options) => JSON.parse(String(options?.body)));
  await fireEvent.press(screen.getByRole('button', { name: 'บันทึกทริป' }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/journeys'));
  const [path, options, token] = jest.mocked(requestJson).mock.calls.at(-1)!;
  expect(path).toMatch(/^\/journeys\/trip-/);
  expect(token).toBe('test-token');
  expect(JSON.parse(String(options?.body))).toMatchObject({ title: 'วันเที่ยวขอนแก่น', date: '2026-09-28', note: 'นัดเพื่อนที่มหาวิทยาลัย', poiIds: ['kku'] });
});

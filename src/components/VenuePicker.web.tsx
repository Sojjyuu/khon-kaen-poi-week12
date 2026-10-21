import { Text, View } from 'react-native';
import type { Coordinates } from '../types/coordinates';

type Props = { initial: Coordinates; selected: Coordinates; onSelect?: (coordinates: Coordinates) => void };
export function VenuePicker({ selected }: Props) {
  return <View style={{ minHeight: 100, justifyContent: 'center' }}>
    <Text>พิกัดสถานที่ {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)} (เลือกหมุดบน iOS/Android)</Text>
  </View>;
}

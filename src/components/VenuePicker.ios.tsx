import MapView, { Marker, type MapPressEvent } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import type { Coordinates } from '../types/coordinates';
import { isCoordinates } from '../types/coordinates';

type Props = { initial: Coordinates; selected: Coordinates; onSelect?: (coordinates: Coordinates) => void };

export function VenuePicker({ initial, selected, onSelect }: Props) {
  const select = (event: MapPressEvent) => {
    if (isCoordinates(event.nativeEvent.coordinate)) onSelect?.(event.nativeEvent.coordinate);
  };
  return <MapView style={styles.map}
    accessibilityLabel="แผนที่สถานที่กิจกรรม"
    initialRegion={{ ...initial, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
    onPress={onSelect ? select : undefined}>
    <Marker coordinate={selected} title="หมุดสถานที่กิจกรรม" />
  </MapView>;
}

const styles = StyleSheet.create({ map: { height: 240, width: '100%', borderRadius: 14 } });

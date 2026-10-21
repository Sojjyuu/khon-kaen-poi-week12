import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { Coordinates } from '../types/coordinates';
import { isCoordinates } from '../types/coordinates';

type Props = { initial: Coordinates; selected: Coordinates; onSelect?: (coordinates: Coordinates) => void };

function mapHtml(initial: Coordinates, editable: boolean) {
  const point = JSON.stringify(initial);
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>html,body,#map{height:100%;margin:0;background:#e8edf2}</style></head><body>
    <div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>const first=${point};const map=L.map('map').setView([first.latitude,first.longitude],15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
    const marker=L.marker([first.latitude,first.longitude]).addTo(map);
    ${editable ? `map.on('click',function(event){const p=event.latlng;marker.setLatLng(p);window.ReactNativeWebView.postMessage(JSON.stringify({latitude:p.lat,longitude:p.lng}));});` : ''}
    </script></body></html>`;
}

export function VenuePicker({ initial, onSelect }: Props) {
  const html = useMemo(
    () => mapHtml({ latitude: initial.latitude, longitude: initial.longitude }, !!onSelect),
    [initial.latitude, initial.longitude, onSelect],
  );
  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const coordinate: unknown = JSON.parse(event.nativeEvent.data);
      if (isCoordinates(coordinate)) onSelect?.(coordinate);
    } catch { /* Ignore unexpected WebView messages. */ }
  };
  return <WebView accessibilityLabel="แผนที่สถานที่กิจกรรม" key={`${initial.latitude},${initial.longitude}`}
    source={{ html, baseUrl: 'https://unpkg.com' }} originWhitelist={['*']} javaScriptEnabled
    onMessage={onSelect ? handleMessage : undefined} style={styles.map} />;
}

const styles = StyleSheet.create({ map: { height: 240, width: '100%', borderRadius: 14 } });

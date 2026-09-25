import { SafeAreaView } from 'react-native-safe-area-context';
import { PoiExplorerScreen } from '../../src/screens/PoiExplorerScreen';
import { colors } from '../../src/theme/colors';
export default function Home() {
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['left', 'right']}>
    <PoiExplorerScreen />
  </SafeAreaView>;
}

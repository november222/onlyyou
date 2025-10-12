import { Stack } from 'expo-router/stack';
import { useTranslation } from 'react-i18next';

export default function HistoryLayout() {
  const { t } = useTranslation();

  return (
    <Stack screenOptions={{ headerShown: false, header: () => null }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: t('history:listTitle'),
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
          title: t('history:detailTitle'),
        }}
      />
    </Stack>
  );
}

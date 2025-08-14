import { Stack } from 'expo-router/stack';

export default function HistoryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, header: () => null }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          title: 'Lịch Sử Kết Nối'
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          headerShown: false,
          title: 'Chi Tiết Phiên'
        }} 
      />
    </Stack>
  );
}
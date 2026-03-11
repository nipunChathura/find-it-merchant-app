import { Stack } from 'expo-router';

export default function SubMerchantsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
      <Stack.Screen name="index" options={{ title: 'Sub Merchants' }} />
      <Stack.Screen name="add" options={{ title: 'Add Sub Merchant' }} />
      <Stack.Screen name="edit" options={{ title: 'Edit Sub Merchant' }} />
      <Stack.Screen name="[id]" options={{ title: 'Sub Merchant Details' }} />
    </Stack>
  );
}

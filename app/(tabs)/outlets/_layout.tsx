import { Stack } from 'expo-router';

const screenOptions = { headerShown: false } as const;
const indexScreenOptions = { title: 'Outlets' } as const;

export default function OutletsLayout() {
  return (
    <Stack screenOptions={screenOptions} initialRouteName="index">
      <Stack.Screen name="index" options={indexScreenOptions} />
      <Stack.Screen name="add" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="items/add" />
      <Stack.Screen name="items/details" />
      <Stack.Screen name="items/edit" />
      <Stack.Screen name="schedule/add" />
      <Stack.Screen name="schedule/edit" />
      <Stack.Screen name="discounts/details" />
      <Stack.Screen name="discounts/add" />
      <Stack.Screen name="discounts/edit" />
    </Stack>
  );
}

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Alert } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useRole } from '@/hooks/useRole';

export default function TabLayout() {
  const router = useRouter();
  const role = useRole();
  const isSubMerchant = role === 'SUBMERCHANT';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        tabBarInactiveTintColor: Colors.light.icon,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="dashboard" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="outlets"
        options={{
          title: 'Outlets',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="store" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="payment" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sub-merchants"
        options={{
          title: 'Sub Merchants',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="people" size={24} color={isSubMerchant ? Colors.light.icon : color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            if (isSubMerchant) {
              e.preventDefault();
              Alert.alert('Not allowed', 'Not allowed this tab.');
            } else {
              router.replace('/(tabs)/sub-merchants');
            }
          },
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          title: 'Notifications',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="notifications" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

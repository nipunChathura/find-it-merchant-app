import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Alert, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { AuthImage } from '@/components/ui/AuthImage';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { DashboardDataProvider } from '@/hooks/useDashboardData';
import { useRole } from '@/hooks/useRole';

function ProfileTabBarIcon({ color }: { color: string }) {
  const { user, token } = useAuth();
  const fileName = user?.profileImage?.trim();
  if (fileName && token) {
    return (
      <View style={{ width: 24, height: 24, borderRadius: 12, overflow: 'hidden' }}>
        <AuthImage
          type="profile"
          fileName={fileName}
          token={token}
          style={{ width: 24, height: 24 }}
          resizeMode="cover"
          placeholder={<MaterialIcons name="person" size={22} color={color} />}
        />
      </View>
    );
  }
  return <MaterialIcons name="person" size={24} color={color} />;
}

export default function TabLayout() {
  const router = useRouter();
  const role = useRole();
  const isSubMerchant = role === 'SUBMERCHANT';

  return (
    <DashboardDataProvider>
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
          tabBarIcon: ({ color }) => <ProfileTabBarIcon color={color} />,
        }}
      />
    </Tabs>
    </DashboardDataProvider>
  );
}

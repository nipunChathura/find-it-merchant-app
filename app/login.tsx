import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

const SAVED_USERNAME_KEY = '@findit_saved_username';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const colors = Colors.light;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SAVED_USERNAME_KEY).then((saved) => {
      if (saved?.trim()) setUsername(saved.trim());
    });
  }, []);

  const handleLogin = async () => {
    setError('');
    if (!username.trim()) {
      setError('Enter username');
      return;
    }
    if (!password) {
      setError('Enter password');
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
      await AsyncStorage.setItem(SAVED_USERNAME_KEY, username.trim());
      router.replace('/(tabs)');
    } catch (e: unknown) {
      let msg = 'Login failed';
      if (e && typeof e === 'object' && 'response' in e) {
        const res = (e as { response?: { data?: { responseMessage?: string } } }).response;
        if (res?.data?.responseMessage) msg = res.data.responseMessage;
      } else if (e instanceof Error) msg = e.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ThemedView style={styles.containerInner}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.logoWrapper}>
            <Image
              source={require('@/assets/images/logo.jpg')}
              style={styles.logo}
              contentFit="cover"
            />
          </ThemedView>
          <ThemedText type="title" style={styles.title}>
            Find It Merchant
          </ThemedText>
          <ThemedText style={styles.subtitle}>Sign in to continue</ThemedText>

          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
            placeholder="Username"
            placeholderTextColor={colors.icon}
            value={username}
            onChangeText={(t) => { setUsername(t); setError(''); }}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput, { color: colors.text, borderColor: colors.icon }]}
              placeholder="Password"
              placeholderTextColor={colors.icon}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={12}
            >
              <MaterialIcons
                name={showPassword ? 'visibility-off' : 'visibility'}
                size={22}
                color={colors.icon}
              />
            </Pressable>
          </View>
          <View style={styles.linksRow}>
            <Pressable
              style={styles.forgotLinkWrap}
              onPress={() => router.push('/forgot-password')}
              disabled={loading}
            >
              <ThemedText type="link" style={[styles.forgotLink, { color: colors.tint }]}>
                Forgot password?
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => router.push('/register')}
              disabled={loading}
            >
              <ThemedText type="link" style={[styles.forgotLink, { color: colors.tint }]}>
                Register
              </ThemedText>
            </Pressable>
          </View>

          {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: colors.tint },
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerInner: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 48,
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
  },
  logoWrapper: {
    width: 100,
    height: 100,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 28,
    opacity: 0.8,
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 14,
  },
  passwordWrap: {
    width: '100%',
    position: 'relative',
    marginBottom: 14,
  },
  passwordInput: {
    marginBottom: 0,
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotLinkWrap: {},
  forgotLink: {
    fontSize: 14,
  },
  error: {
    color: '#dc2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});

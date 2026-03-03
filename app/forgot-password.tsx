import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setMessage('Please enter your username');
      return;
    }
    setMessage('');
    setLoading(true);
    try {
      // TODO: Replace with your forgot-password API call when available
      // await forgotPassword({ username: trimmed });
      await new Promise((r) => setTimeout(r, 800));
      setMessage('If an account exists for this username, you will receive instructions to reset your password.');
    } catch {
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ThemedText type="title" style={styles.title}>
          Forgot password?
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Enter your username and we’ll help you reset your password.
        </ThemedText>

        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
          placeholder="Username"
          placeholderTextColor={colors.icon}
          value={username}
          onChangeText={(t) => { setUsername(t); setMessage(''); }}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        {message ? (
          <ThemedText style={[styles.message, message.startsWith('If') ? styles.messageSuccess : styles.messageError]}>
            {message}
          </ThemedText>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.tint },
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Sending…' : 'Send reset link'}</Text>
        </Pressable>

        <Pressable
          style={styles.backLink}
          onPress={() => router.back()}
          disabled={loading}
        >
          <ThemedText type="link" style={{ color: colors.tint }}>Back to sign in</ThemedText>
        </Pressable>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  keyboardView: {
    width: '100%',
    maxWidth: 340,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 24,
    opacity: 0.8,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  message: {
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 14,
  },
  messageSuccess: {
    color: '#16a34a',
  },
  messageError: {
    color: '#dc2626',
  },
  button: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
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
  backLink: {
    marginTop: 20,
    alignSelf: 'center',
  },
});

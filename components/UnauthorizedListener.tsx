import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { setOn401Callback } from '@/utils/apiClient';
export function UnauthorizedListener() {
    const { signOut } = useAuth();
    const router = useRouter();
    useEffect(() => {
        setOn401Callback(async () => {
            await signOut();
            router.replace('/login');
        });
        return () => setOn401Callback(null);
    }, [signOut, router]);
    return null;
}

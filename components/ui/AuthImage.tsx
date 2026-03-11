import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { type ImageStyle, View } from 'react-native';

import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';

export type AuthImageType = 'receipt' | 'profile' | 'discount' | 'item';

interface AuthImageProps {
  type: AuthImageType;
  fileName: string | null | undefined;
  token: string | null;
  style?: ImageStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  placeholder?: React.ReactNode;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(binary);
  }
  return '';
}

/**
 * Loads and displays an image from GET /api/images/show?type=&fileName=
 * with Authorization: Bearer token.
 * For items: use type="item" and fileName = itemImage from the items API response
 * (e.g. "item/86cd4d75-5e0b-4821-84a3-0b6a7c3a3d31.jpg"). Same value is used on
 * item list and item details. Calls the API via fetch() so headers are sent on all platforms.
 */
export function AuthImage({
  type,
  fileName,
  token,
  style,
  resizeMode = 'cover',
  placeholder = null,
}: AuthImageProps) {
  const [dataUri, setDataUri] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!fileName || typeof fileName !== 'string' || !fileName.trim()) {
      setDataUri(null);
      setError(true);
      return;
    }
    if (!token) {
      setDataUri(null);
      setError(true);
      return;
    }

    let cancelled = false;
    setError(false);
    setDataUri(null);

    const fileNameForApi =
      type === 'item' && fileName.startsWith('item/')
        ? fileName.slice(5)
        : type === 'profile' && fileName.startsWith('profile/')
          ? fileName.slice(8)
          : type === 'receipt' && fileName.startsWith('receipt/')
            ? fileName.slice(8)
            : type === 'discount' && fileName.startsWith('discount/')
              ? fileName.slice(9)
              : fileName;
    const encoded = encodeURIComponent(fileNameForApi);
    const uri = `${API_BASE_URL}${API_ENDPOINTS.imageShow}?type=${type}&fileName=${encoded}`;

    if (__DEV__) {
      console.log('[Image Show API] GET', uri);
    }

    fetch(uri, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (cancelled) return null;
        if (__DEV__) {
          console.log('[Image Show API] Response', res.status, type, fileName);
        }
        if (!res.ok) return null;
        const contentType = res.headers.get('content-type') ?? '';
        const mime = contentType.includes('png') ? 'image/png' : 'image/jpeg';
        return res.arrayBuffer().then((buf) => ({ buf, mime }));
      })
      .then((result) => {
        if (cancelled || !result) return;
        const { buf, mime } = result;
        const base64 = arrayBufferToBase64(buf);
        if (base64 && !cancelled) {
          if (__DEV__) console.log('[Image Show API] Success', type, fileName);
          setDataUri(`data:${mime};base64,${base64}`);
        }
      })
      .catch((err) => {
        if (__DEV__) console.warn('[Image Show API] Error', type, fileName, err);
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [type, fileName, token]);

  if (error || !fileName || !token) {
    return placeholder ? <View style={style}>{placeholder}</View> : null;
  }

  if (!dataUri) {
    return placeholder ? <View style={style}>{placeholder}</View> : null;
  }

  const contentFit =
    resizeMode === 'contain' ? 'contain' : resizeMode === 'stretch' ? 'fill' : 'cover';

  return (
    <Image
      source={{ uri: dataUri }}
      style={style}
      contentFit={contentFit}
    />
  );
}

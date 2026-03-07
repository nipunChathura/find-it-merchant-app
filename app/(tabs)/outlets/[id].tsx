import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenContainer, SectionHeader } from '@/components/dashboard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/auth-context';
import { useRole } from '@/hooks/useRole';
import {
    approveOutletApi,
    detailsOutletToOutlet,
    fetchAssignedOutlets,
    fetchOutletById,
    fetchOutletDetails,
    setOutletStatusApi,
    type OutletDetailsResponse,
} from '@/services/outletService';
import type { OutletRecord } from '@/src/context/OutletContext';
import { useOutletContext } from '@/src/context/OutletContext';
import { colors } from '@/theme/colors';
import { borderRadius, cardRadius, layout, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';
import type { Outlet } from '@/types';

/** Default map region (Sri Lanka) when outlet has no coordinates */
const DEFAULT_LAT = 7.8731;
const DEFAULT_LNG = 80.7718;
const DEFAULT_DELTA = 0.05;

type TabId = 'info' | 'schedule' | 'items' | 'payments' | 'discount';

function recordToOutlet(r: OutletRecord): Outlet {
  return {
    id: r.id,
    name: r.name,
    status: r.status,
    totalItems: 0,
    paymentStatus: 'PENDING',
    location: r.location,
    contactNumber: r.contactNumber,
    description: r.description,
  };
}

/** Invalid id values that should redirect to the outlet list (e.g. from wrong tab route) */
const INVALID_OUTLET_IDS = ['outlets', 'index', ''];

export default function OutletDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const role = useRole();
  const { user } = useAuth();
  const {
    getOutletById,
    getItemsByOutletId,
    getSchedulesByOutletId,
    getPaymentsByOutletId,
  } = useOutletContext();

  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [outletDetails, setOutletDetails] = useState<OutletDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('info');

  const insets = useSafeAreaInsets();
  const contextOutlet = id ? getOutletById(id) : undefined;
  const items = id ? getItemsByOutletId(id) : [];
  const schedules = id ? getSchedulesByOutletId(id) : [];
  const payments = id ? getPaymentsByOutletId(id) : [];

  useEffect(() => {
    if (id != null && INVALID_OUTLET_IDS.includes(String(id).toLowerCase())) {
      router.replace('/(tabs)/outlets/index');
    }
  }, [id, router]);

  const loadOutlet = useCallback(async () => {
    if (!id || INVALID_OUTLET_IDS.includes(String(id).toLowerCase())) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setOutletDetails(null);
    try {
      // Prefer GET /api/merchant-app/outlets/:id/details for full outlet, merchant and sub-merchant data
      const details = await fetchOutletDetails(id);
      if (details?.outlet) {
        setOutletDetails(details);
        setOutlet(detailsOutletToOutlet(details.outlet));
        setLoading(false);
        return;
      }
      // Fallback: assigned outlet list then context then single-outlet API
      const merchantId = user?.merchantId;
      const subMerchantId = user?.subMerchantId;
      if (role === 'MERCHANT' && merchantId != null) {
        const list = await fetchAssignedOutlets({ merchantId });
        const found = list.find((o) => o.id === id);
        if (found) {
          setOutlet(found);
          setLoading(false);
          return;
        }
      } else if (role === 'SUBMERCHANT' && subMerchantId != null) {
        const list = await fetchAssignedOutlets({ subMerchantId });
        const found = list.find((o) => o.id === id);
        if (found) {
          setOutlet(found);
          setLoading(false);
          return;
        }
      }
      const fromContext = contextOutlet;
      if (fromContext) {
        setOutlet(recordToOutlet(fromContext));
        setLoading(false);
        return;
      }
      const fromApi = await fetchOutletById(id);
      setOutlet(fromApi);
    } catch {
      setOutlet(null);
      setOutletDetails(null);
    } finally {
      setLoading(false);
    }
  }, [id, role, user?.merchantId, user?.subMerchantId, contextOutlet]);

  useEffect(() => {
    loadOutlet();
  }, [loadOutlet]);

  const handleDeleteOutlet = () => {
    if (!id || role !== 'MERCHANT') return;
    Alert.alert(
      'Confirm delete',
      'Do you want to delete this outlet? This will set the outlet status to deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              await setOutletStatusApi(id, 'DELETED');
              router.replace('/(tabs)/outlets/index');
            } catch {
              Alert.alert('Error', 'Failed to delete outlet.');
            }
          },
        },
      ]
    );
  };

  const handleChangeStatus = (newStatus: 'ACTIVE' | 'INACTIVE') => {
    if (!id || role !== 'MERCHANT') return;
    const label = newStatus === 'ACTIVE' ? 'Active' : 'Inactive';
    Alert.alert(
      'Change status',
      `Set outlet status to ${label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await setOutletStatusApi(id, newStatus);
              await loadOutlet();
              Alert.alert('Success', `Status updated to ${label}.`);
            } catch {
              Alert.alert('Error', 'Failed to update status.');
            }
          },
        },
      ]
    );
  };

  const handleApproveOutlet = () => {
    if (!id || role !== 'MERCHANT') return;
    Alert.alert(
      'Approve outlet',
      'Do you want to approve this outlet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await approveOutletApi(id);
              await loadOutlet();
              Alert.alert('Success', 'Outlet approved.');
            } catch {
              Alert.alert('Error', 'Failed to approve outlet.');
            }
          },
        },
      ]
    );
  };

  const handleRejectOutlet = () => {
    if (!id || role !== 'MERCHANT') return;
    Alert.alert(
      'Reject outlet',
      'Do you want to reject this outlet? This will set the status to rejected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              await setOutletStatusApi(id, 'REJECT');
              await loadOutlet();
              Alert.alert('Success', 'Outlet rejected.');
            } catch {
              Alert.alert('Error', 'Failed to reject outlet.');
            }
          },
        },
      ]
    );
  };

  const openInMaps = () => {
    const o = outlet;
    if (!o) return;
    const lat = o.latitude ?? DEFAULT_LAT;
    const lng = o.longitude ?? DEFAULT_LNG;
    const label = encodeURIComponent(o.name || 'Outlet');
    const url =
      Platform.OS === 'ios'
        ? `maps:?q=${label}@${lat},${lng}`
        : `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
    Linking.openURL(url).catch(() => {});
  };

  if (!id) {
    return (
      <ScreenContainer>
        <Text style={styles.placeholderText}>Invalid outlet.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Go back</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingSpinner />
      </ScreenContainer>
    );
  }

  if (!outlet) {
    return (
      <ScreenContainer>
        <Text style={styles.placeholderText}>Outlet not found.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Go back</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  const bottomTabs: { id: TabId; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
    { id: 'schedule', label: 'Schedule', icon: 'schedule' },
    { id: 'items', label: 'Items', icon: 'inventory' },
    { id: 'payments', label: 'Payments', icon: 'payment' },
    { id: 'discount', label: 'Discount', icon: 'local-offer' },
  ];

  const merchantInfo = user?.role === 'MERCHANT' ? user?.mainMerchantInfo : user?.subMerchantInfo;
  const statusLabel =
    outlet.status === 'OPEN'
      ? 'Open'
      : outlet.status === 'ACTIVE'
        ? 'Active'
        : outlet.status === 'INACTIVE'
          ? 'Inactive'
          : outlet.status === 'PENDING'
            ? 'Pending'
            : 'Closed';
  const statusColor =
    outlet.status === 'OPEN' || outlet.status === 'ACTIVE'
      ? colors.success
      : outlet.status === 'PENDING'
        ? colors.warning
        : colors.error;
  const hasRealCoordinates =
    typeof outlet.latitude === 'number' && typeof outlet.longitude === 'number';

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, spacing.sm) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'info' && (
          <View style={styles.infoBlock}>
            <View style={styles.heroCard}>
              <Text style={styles.heroTitle} numberOfLines={2}>{outlet.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
                <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
              {outlet.currentStatus ? (
                <Text style={styles.heroSub}>{outlet.currentStatus}</Text>
              ) : null}
              {role === 'MERCHANT' ? (
                <View style={styles.statusChangeRow}>
                  <Text style={styles.statusChangeLabel}>Change status:</Text>
                  <Pressable
                    style={[styles.statusChangeBtn, outlet.status === 'ACTIVE' && styles.statusChangeBtnActive]}
                    onPress={() => handleChangeStatus('ACTIVE')}
                  >
                    <Text style={[styles.statusChangeBtnText, outlet.status === 'ACTIVE' && styles.statusChangeBtnTextActive]}>ACTIVE</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.statusChangeBtn, (outlet.status === 'INACTIVE' || outlet.status === 'CLOSED') && styles.statusChangeBtnInactive]}
                    onPress={() => handleChangeStatus('INACTIVE')}
                  >
                    <Text style={[styles.statusChangeBtnText, (outlet.status === 'INACTIVE' || outlet.status === 'CLOSED') && styles.statusChangeBtnTextInactive]}>INACTIVE</Text>
                  </Pressable>
                </View>
              ) : null}
              {role === 'MERCHANT' && outlet.status === 'PENDING' ? (
                <View style={styles.pendingActionsRow}>
                  <Pressable style={styles.approveBtn} onPress={handleApproveOutlet}>
                    <MaterialIcons name="check-circle" size={18} color={colors.white} />
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </Pressable>
                  <Pressable style={styles.rejectBtn} onPress={handleRejectOutlet}>
                    <MaterialIcons name="cancel" size={18} color={colors.white} />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>

            <View style={styles.card}>
              <View style={styles.cardAccent} />
              <View style={styles.cardBody}>
                <View style={styles.sectionRow}>
                  <MaterialIcons name="location-on" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Location</Text>
                </View>
                {hasRealCoordinates ? null : (
                  <Text style={styles.mapNote}>
                    Exact coordinates not set. Showing approximate region; use address below or Open in Maps.
                  </Text>
                )}
                <OutletMapView
                  latitude={outlet.latitude ?? DEFAULT_LAT}
                  longitude={outlet.longitude ?? DEFAULT_LNG}
                  title={outlet.name}
                />
                {(outlet.location || outletDetails?.outlet?.addressLine1) ? (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="place" size={18} color={colors.textSecondary} />
                    <Text style={styles.infoText}>
                      {outletDetails?.outlet
                        ? [outletDetails.outlet.addressLine1, outletDetails.outlet.cityName, outletDetails.outlet.districtName, outletDetails.outlet.provinceName].filter(Boolean).join(', ') || outlet.location
                        : outlet.location}
                    </Text>
                  </View>
                ) : null}
                {outletDetails?.outlet?.postalCode ? (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="mail-outline" size={18} color={colors.textSecondary} />
                    <Text style={styles.infoText}>Postal code: {outletDetails.outlet.postalCode}</Text>
                  </View>
                ) : null}
                <Pressable style={styles.mapLink} onPress={openInMaps}>
                  <MaterialIcons name="open-in-new" size={18} color={colors.primary} />
                  <Text style={styles.mapLinkText}>Open in Maps</Text>
                </Pressable>
              </View>
            </View>

            {(outlet.contactNumber || outletDetails?.outlet?.emailAddress || outlet.description) ? (
              <View style={styles.card}>
                <View style={styles.cardAccent} />
                <View style={styles.cardBody}>
                  <View style={styles.sectionRow}>
                    <MaterialIcons name="contact-phone" size={20} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Contact</Text>
                  </View>
                  {(outlet.contactNumber || outletDetails?.outlet?.contactNumber) ? (
                    <View style={styles.infoRow}>
                      <MaterialIcons name="phone" size={18} color={colors.textSecondary} />
                      <Text style={styles.infoText}>{outletDetails?.outlet?.contactNumber ?? outlet.contactNumber}</Text>
                    </View>
                  ) : null}
                  {(outletDetails?.outlet?.emailAddress) ? (
                    <View style={styles.infoRow}>
                      <MaterialIcons name="email" size={18} color={colors.textSecondary} />
                      <Text style={styles.infoText}>{outletDetails.outlet.emailAddress}</Text>
                    </View>
                  ) : null}
                  {outlet.description ? (
                    <Text style={styles.description}>{outlet.description}</Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            {outletDetails?.outlet && (outletDetails.outlet.outletType || outletDetails.outlet.businessCategory || outletDetails.outlet.businessRegistrationNumber || outletDetails.outlet.taxIdentificationNumber) ? (
              <View style={styles.card}>
                <View style={styles.cardAccent} />
                <View style={styles.cardBody}>
                  <View style={styles.sectionRow}>
                    <MaterialIcons name="store" size={20} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Business</Text>
                  </View>
                  {outletDetails.outlet.outletType ? <InfoRow label="Outlet type" value={outletDetails.outlet.outletType} /> : null}
                  {outletDetails.outlet.businessCategory ? <InfoRow label="Business category" value={outletDetails.outlet.businessCategory} /> : null}
                  {outletDetails.outlet.businessRegistrationNumber ? <InfoRow label="Registration no." value={outletDetails.outlet.businessRegistrationNumber} /> : null}
                  {outletDetails.outlet.taxIdentificationNumber ? <InfoRow label="Tax ID" value={outletDetails.outlet.taxIdentificationNumber} /> : null}
                </View>
              </View>
            ) : null}

            {outletDetails?.outlet && (outletDetails.outlet.bankName || outletDetails.outlet.bankBranch || outletDetails.outlet.accountNumber || outletDetails.outlet.accountHolderName) ? (
              <View style={styles.card}>
                <View style={styles.cardAccent} />
                <View style={styles.cardBody}>
                  <View style={styles.sectionRow}>
                    <MaterialIcons name="account-balance" size={20} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Bank</Text>
                  </View>
                  {outletDetails.outlet.bankName ? <InfoRow label="Bank" value={outletDetails.outlet.bankName} /> : null}
                  {outletDetails.outlet.bankBranch ? <InfoRow label="Branch" value={outletDetails.outlet.bankBranch} /> : null}
                  {outletDetails.outlet.accountNumber ? <InfoRow label="Account no." value={outletDetails.outlet.accountNumber} /> : null}
                  {outletDetails.outlet.accountHolderName ? <InfoRow label="Account holder" value={outletDetails.outlet.accountHolderName} /> : null}
                </View>
              </View>
            ) : null}

            {outletDetails?.outlet && (outletDetails.outlet.rating != null || outletDetails.outlet.subscriptionValidUntil) ? (
              <View style={styles.card}>
                <View style={styles.cardAccent} />
                <View style={styles.cardBody}>
                  <View style={styles.sectionRow}>
                    <MaterialIcons name="star" size={20} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Rating & subscription</Text>
                  </View>
                  {outletDetails.outlet.rating != null ? <InfoRow label="Rating" value={String(outletDetails.outlet.rating)} /> : null}
                  {outletDetails.outlet.subscriptionValidUntil ? <InfoRow label="Subscription valid until" value={outletDetails.outlet.subscriptionValidUntil.split('T')[0]} /> : null}
                </View>
              </View>
            ) : null}

            {(outlet.assignedToSubMerchant || outletDetails?.assignedSubMerchant) && (outlet.subMerchantName || outlet.subMerchantInfo || outletDetails?.subMerchantDetails) ? (
              <View style={styles.card}>
                <View style={styles.cardAccent} />
                <View style={styles.cardBody}>
                  <View style={styles.sectionRow}>
                    <MaterialIcons name="person" size={20} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Assigned sub merchant</Text>
                  </View>
                  {(outletDetails?.subMerchantDetails?.merchantName ?? outlet.subMerchantName ?? outlet.subMerchantInfo?.merchantName) ? (
                    <Text style={styles.detailName}>
                      {outletDetails?.subMerchantDetails?.merchantName ?? outlet.subMerchantName ?? outlet.subMerchantInfo?.merchantName}
                    </Text>
                  ) : null}
                  {outletDetails?.subMerchantDetails?.parentMerchantName ? (
                    <InfoRow label="Parent merchant" value={outletDetails.subMerchantDetails.parentMerchantName} />
                  ) : null}
                  {outletDetails?.subMerchantDetails?.subMerchantStatus ? (
                    <InfoRow label="Status" value={outletDetails.subMerchantDetails.subMerchantStatus} />
                  ) : null}
                  {(outletDetails?.subMerchantDetails?.merchantEmail ?? outlet.subMerchantInfo?.merchantEmail) ? (
                    <View style={styles.infoRow}>
                      <MaterialIcons name="email" size={18} color={colors.textSecondary} />
                      <Text style={styles.infoText}>{outletDetails?.subMerchantDetails?.merchantEmail ?? outlet.subMerchantInfo?.merchantEmail}</Text>
                    </View>
                  ) : null}
                  {(outletDetails?.subMerchantDetails?.merchantPhoneNumber ?? outlet.subMerchantInfo?.merchantPhoneNumber) ? (
                    <View style={styles.infoRow}>
                      <MaterialIcons name="phone" size={18} color={colors.textSecondary} />
                      <Text style={styles.infoText}>{outletDetails?.subMerchantDetails?.merchantPhoneNumber ?? outlet.subMerchantInfo?.merchantPhoneNumber}</Text>
                    </View>
                  ) : null}
                  {(outletDetails?.subMerchantDetails?.merchantAddress ?? outlet.subMerchantInfo?.merchantAddress) ? (
                    <View style={styles.infoRow}>
                      <MaterialIcons name="place" size={18} color={colors.textSecondary} />
                      <Text style={styles.infoText}>{outletDetails?.subMerchantDetails?.merchantAddress ?? outlet.subMerchantInfo?.merchantAddress}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            {(outletDetails?.merchantDetails || merchantInfo) ? (
              <View style={styles.card}>
                <View style={styles.cardAccent} />
                <View style={styles.cardBody}>
                  <View style={styles.sectionRow}>
                    <MaterialIcons name="business" size={20} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Merchant details</Text>
                  </View>
                  {(outletDetails?.merchantDetails?.merchantName ?? merchantInfo?.merchantName) ? (
                    <Text style={styles.detailName}>{outletDetails?.merchantDetails?.merchantName ?? merchantInfo?.merchantName}</Text>
                  ) : null}
                  {(outletDetails?.merchantDetails?.merchantStatus ?? outletDetails?.merchantDetails?.merchantType) ? (
                    <InfoRow label="Status / type" value={[outletDetails?.merchantDetails?.merchantStatus, outletDetails?.merchantDetails?.merchantType].filter(Boolean).join(' · ')} />
                  ) : null}
                  {(outletDetails?.merchantDetails?.merchantNic) ? (
                    <InfoRow label="NIC" value={outletDetails.merchantDetails.merchantNic} />
                  ) : null}
                  {(outletDetails?.merchantDetails?.merchantEmail ?? merchantInfo?.merchantEmail) ? (
                    <View style={styles.infoRow}>
                      <MaterialIcons name="email" size={18} color={colors.textSecondary} />
                      <Text style={styles.infoText}>{outletDetails?.merchantDetails?.merchantEmail ?? merchantInfo?.merchantEmail}</Text>
                    </View>
                  ) : null}
                  {(outletDetails?.merchantDetails?.merchantPhoneNumber ?? merchantInfo?.merchantPhoneNumber) ? (
                    <View style={styles.infoRow}>
                      <MaterialIcons name="phone" size={18} color={colors.textSecondary} />
                      <Text style={styles.infoText}>{outletDetails?.merchantDetails?.merchantPhoneNumber ?? merchantInfo?.merchantPhoneNumber}</Text>
                    </View>
                  ) : null}
                  {(outletDetails?.merchantDetails?.merchantAddress ?? merchantInfo?.merchantAddress) ? (
                    <View style={styles.infoRow}>
                      <MaterialIcons name="place" size={18} color={colors.textSecondary} />
                      <Text style={styles.infoText}>{outletDetails?.merchantDetails?.merchantAddress ?? merchantInfo?.merchantAddress}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            <View style={styles.actions}>
              <Pressable
                style={styles.editBtn}
                onPress={() => router.push({ pathname: '/(tabs)/outlets/edit', params: { id } })}
              >
                <MaterialIcons name="edit" size={18} color={colors.white} />
                <Text style={styles.editBtnText}>Edit Outlet</Text>
              </Pressable>
              {role === 'MERCHANT' && (
                <Pressable style={styles.deleteBtn} onPress={handleDeleteOutlet}>
                  <MaterialIcons name="delete-outline" size={18} color={colors.error} />
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {activeTab === 'items' && (
          <View style={styles.tabSection}>
            <SectionHeader
              title="Items"
              actionLabel="Add Item"
              onAction={() =>
                router.push({ pathname: '/(tabs)/outlets/items/add', params: { outletId: id } })
              }
            />
            {items.length === 0 ? (
              <Text style={styles.empty}>No items. Add items for this outlet.</Text>
            ) : (
              items.map((item, idx) => (
                <Pressable
                  key={item?.id ?? `item-${idx}`}
                  style={styles.card}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/outlets/items/edit',
                      params: { id: item.id, outletId: id },
                    })
                  }
                >
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSub}>
                    LKR {item.price} · {item.category || 'Uncategorized'}
                  </Text>
                  <Text style={styles.cardStatus}>
                    {item.availability ? 'Available' : 'Unavailable'}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        )}

        {activeTab === 'schedule' && (
          <View style={styles.tabSection}>
            <SectionHeader
              title="Schedule"
              actionLabel="Add Schedule"
              onAction={() =>
                router.push({
                  pathname: '/(tabs)/outlets/schedule/add',
                  params: { outletId: id },
                })
              }
            />
            {schedules.length === 0 ? (
              <Text style={styles.empty}>No schedule. Add opening hours.</Text>
            ) : (
              schedules.map((s, idx) => (
                <Pressable
                  key={s?.id ?? `sched-${idx}`}
                  style={styles.card}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/outlets/schedule/edit',
                      params: { id: s.id, outletId: id },
                    })
                  }
                >
                  <Text style={styles.cardTitle}>{s.dayOfWeek}</Text>
                  <Text style={styles.cardSub}>
                    {s.openTime} – {s.closeTime}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        )}

        {activeTab === 'payments' && (
          <View style={styles.tabSection}>
            <SectionHeader
              title="Payment History"
              actionLabel="Add Payment"
              onAction={() =>
                router.push({
                  pathname: '/(tabs)/payments/submit',
                  params: { outletId: id, outletName: outlet.name },
                })
              }
            />
            {payments.length === 0 ? (
              <Text style={styles.empty}>No payments recorded.</Text>
            ) : (
              payments.map((p, idx) => (
                <View key={p?.id ?? `pay-${idx}`} style={styles.card}>
                  <Text style={styles.cardTitle}>{p.month}</Text>
                  <Text style={styles.cardSub}>LKR {p.paymentAmount}</Text>
                  <Text style={styles.cardDate}>
                    {new Date(p.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'discount' && (
          <View style={styles.tabSection}>
            <SectionHeader title="Discounts" />
            <Text style={styles.empty}>Discount management for this outlet. Coming soon.</Text>
          </View>
        )}

        <View style={styles.bottomBarSpacer} />
      </ScrollView>

      {/* Bottom bar: Schedule, Items, Payment, Discount */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        {bottomTabs.map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.bottomBarBtn, activeTab === tab.id && styles.bottomBarBtnActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <MaterialIcons
              name={tab.icon}
              size={22}
              color={activeTab === tab.id ? colors.white : colors.textSecondary}
            />
            <Text
              style={[
                styles.bottomBarLabel,
                activeTab === tab.id && styles.bottomBarLabelActive,
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* FAB to return to outlet info (map + details + edit) when on another tab */}
      {activeTab !== 'info' && (
        <Pressable style={styles.fabInfo} onPress={() => setActiveTab('info')}>
          <MaterialIcons name="info-outline" size={24} color={colors.white} />
        </Pressable>
      )}

    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string | undefined }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.infoRowBlock}>
      <Text style={styles.infoLabelInline}>{label}</Text>
      <Text style={styles.infoText}>{value}</Text>
    </View>
  );
}

/** Map view for outlet location. Uses react-native-maps if available. */
function OutletMapView({
  latitude,
  longitude,
  title,
}: {
  latitude: number;
  longitude: number;
  title: string;
}) {
  try {
    const MapView = require('react-native-maps').default;
    const Marker = require('react-native-maps').Marker;
    return (
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude,
            longitude,
            latitudeDelta: DEFAULT_DELTA,
            longitudeDelta: DEFAULT_DELTA,
          }}
          scrollEnabled={true}
          zoomEnabled={true}
        >
          <Marker coordinate={{ latitude, longitude }} title={title} />
        </MapView>
      </View>
    );
  } catch {
    return (
      <View style={styles.mapPlaceholder}>
        <MaterialIcons name="map" size={40} color={colors.textSecondary} />
        <Text style={styles.mapPlaceholderText}>
          Map (install react-native-maps for full map view)
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: layout.contentPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backBtnText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    color: colors.primary,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: cardRadius,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  heroTitle: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  heroSub: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statusChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusChangeLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  statusChangeBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.border,
  },
  statusChangeBtnActive: {
    backgroundColor: colors.success + '33',
  },
  statusChangeBtnInactive: {
    backgroundColor: colors.error + '22',
  },
  statusChangeBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  statusChangeBtnTextActive: {
    color: colors.success,
  },
  statusChangeBtnTextInactive: {
    color: colors.error,
  },
  pendingActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.success,
  },
  approveBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.white,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.error,
  },
  rejectBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.white,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: cardRadius,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardAccent: {
    width: 4,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  cardBody: {
    flex: 1,
    padding: spacing.lg,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  detailName: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  infoBlock: { marginBottom: spacing.xxl },
  sectionLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  mapNote: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  mapContainer: { height: 180, borderRadius: borderRadius.md, overflow: 'hidden', marginBottom: spacing.sm },
  map: { width: '100%', height: '100%' },
  mapPlaceholder: {
    height: 140,
    borderRadius: 12,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  mapPlaceholderText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoRowBlock: { marginBottom: spacing.sm },
  infoLabelInline: { fontSize: fontSizes.xs, color: colors.textSecondary, marginBottom: 2 },
  infoText: { fontSize: fontSizes.base, color: colors.textPrimary },
  mapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  mapLinkText: { fontSize: fontSizes.sm, color: colors.primary, fontWeight: '600' },
  description: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  editBtnText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.errorBg,
  },
  deleteBtnText: { color: colors.error, fontWeight: '600', fontSize: 14 },
  tabSection: { marginBottom: spacing.xxl },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  cardSub: { fontSize: fontSizes.sm, color: colors.textSecondary, marginTop: 2 },
  cardStatus: { fontSize: fontSizes.xs, color: colors.accent, marginTop: 2 },
  cardDate: { fontSize: fontSizes.xs, color: colors.textSecondary, marginTop: 2 },
  empty: { fontSize: fontSizes.sm, color: colors.textSecondary, marginTop: spacing.sm },
  placeholderText: { color: colors.textSecondary },
  link: { color: colors.primary, marginTop: spacing.sm },
  bottomBarSpacer: { height: 80 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.lg,
  },
  bottomBarBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 10,
  },
  bottomBarBtnActive: { backgroundColor: colors.primary },
  bottomBarLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bottomBarLabelActive: { color: colors.white },
  fabInfo: {
    position: 'absolute',
    bottom: 92,
    right: spacing.page,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppInput } from '@/components/ui/AppInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import type { DropdownOption } from '@/components/ui/SearchableDropdown';
import { SearchableDropdown } from '@/components/ui/SearchableDropdown';
import { useAuth } from '@/context/auth-context';
import { useRole } from '@/hooks/useRole';
import {
    fetchCities,
    fetchDistricts,
    fetchProvinces,
    geocodeCity,
    type LocationOption,
} from '@/services/locationService';
import { fetchAssignedOutlets, fetchOutletById, fetchOutletDetails, updateOutletApi } from '@/services/outletService';
import { useOutletContext } from '@/src/context/OutletContext';
import { colors } from '@/theme/colors';
import { cardRadius, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';
import type { Outlet } from '@/types';

function toFloat(s: string): number | undefined {
  const n = parseFloat(s.trim());
  return isNaN(n) ? undefined : n;
}

const OUTLET_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'PHYSICAL_STORE', label: 'Walk-in outlet' },
  { value: 'ONLINE_STORE', label: 'Delivery-only / website-based' },
  { value: 'FRANCHISE', label: 'Franchise outlet' },
  { value: 'KIOSK', label: 'Small booth / mall kiosk' },
  { value: 'MOBILE_OUTLET', label: 'Food truck / mobile service' },
  { value: 'WAREHOUSE', label: 'Storage / fulfillment center' },
  { value: 'PICKUP_POINT', label: 'Click & collect' },
  { value: 'VENDING_MACHINE', label: 'Automated vending' },
  { value: 'POP_UP_STORE', label: 'Temporary outlet' },
  { value: 'MARKET_STALL', label: 'Farmers market / weekend market' },
  { value: 'HOME_BUSINESS', label: 'Work from home' },
  { value: 'PARTNER_OUTLET', label: 'Partner-affiliated outlet' },
];

const BUSINESS_CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'GROCERY', label: 'Grocery' },
  { value: 'SUPERMARKET', label: 'Supermarket' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'CAFE', label: 'Cafe' },
  { value: 'PHARMACY', label: 'Pharmacy' },
  { value: 'RETAIL', label: 'Retail' },
  { value: 'OTHER', label: 'Other' },
];

export default function EditOutletScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const role = useRole();
  const { getOutletById, updateOutlet } = useOutletContext();
  const contextOutlet = id ? getOutletById(id) : undefined;

  const [fetching, setFetching] = useState(!!id);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [description, setDescription] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState('');
  const [taxIdentificationNumber, setTaxIdentificationNumber] = useState('');
  const [outletType, setOutletType] = useState('PHYSICAL_STORE');
  const [businessCategory, setBusinessCategory] = useState('RETAIL');
  const [provinces, setProvinces] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<DropdownOption | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<DropdownOption | null>(null);
  const [selectedCity, setSelectedCity] = useState<DropdownOption | null>(null);
  const [provincesLoading, setProvincesLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [initialProvinceId, setInitialProvinceId] = useState<number | null>(null);
  const [initialDistrictId, setInitialDistrictId] = useState<number | null>(null);
  const [initialCityId, setInitialCityId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fromContext, setFromContext] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const loadOutlet = useCallback(async () => {
    if (!id) return;
    setFetching(true);
    setNotFound(false);
    setFromContext(false);
    try {
      // Same as outlet details page: prefer details API first for full data (email, outletType, businessCategory, etc.)
      const details = await fetchOutletDetails(id);
      if (details?.outlet) {
        const o = details.outlet;
        setName(o.outletName ?? '');
        setLocation(o.addressLine1 ?? '');
        setContactNumber(o.contactNumber ?? '');
        setEmailAddress(o.emailAddress ?? '');
        setPostalCode(o.postalCode ?? '');
        setOutletType(o.outletType ?? 'PHYSICAL_STORE');
        setBusinessCategory(o.businessCategory ?? 'RETAIL');
        setBusinessRegistrationNumber(o.businessRegistrationNumber ?? '');
        setTaxIdentificationNumber(o.taxIdentificationNumber ?? '');
        setDescription('');
        if (o.provinceId != null) setInitialProvinceId(o.provinceId);
        if (o.districtId != null) setInitialDistrictId(o.districtId);
        if (o.cityId != null) setInitialCityId(o.cityId);
        if (o.latitude != null) setLatitude(String(o.latitude));
        if (o.longitude != null) setLongitude(String(o.longitude));
        setFetching(false);
        return;
      }
      // Fallback: assigned list, then context, then single-outlet API
      setInitialProvinceId(null);
      setInitialDistrictId(null);
      setInitialCityId(null);
      const merchantId = user?.merchantId;
      const subMerchantId = user?.subMerchantId;
      if (role === 'MERCHANT' && merchantId != null) {
        const list = await fetchAssignedOutlets({ merchantId });
        const found = list.find((o) => o.id === id);
        if (found) {
          setName(found.name ?? '');
          setLocation(found.location ?? '');
          setContactNumber(found.contactNumber ?? '');
          setDescription(found.description ?? '');
          setFetching(false);
          return;
        }
      } else if (role === 'SUBMERCHANT' && subMerchantId != null) {
        const list = await fetchAssignedOutlets({ subMerchantId });
        const found = list.find((o) => o.id === id);
        if (found) {
          setName(found.name ?? '');
          setLocation(found.location ?? '');
          setContactNumber(found.contactNumber ?? '');
          setDescription(found.description ?? '');
          setFetching(false);
          return;
        }
      }
      if (contextOutlet) {
        setFromContext(true);
        setName(contextOutlet.name ?? '');
        setLocation(contextOutlet.location ?? '');
        setContactNumber(contextOutlet.contactNumber ?? '');
        setDescription(contextOutlet.description ?? '');
        setFetching(false);
        return;
      }
      const fromApiOutlet: Outlet | null = await fetchOutletById(id);
      if (fromApiOutlet) {
        setName(fromApiOutlet.name ?? '');
        setLocation(fromApiOutlet.location ?? '');
        setContactNumber(fromApiOutlet.contactNumber ?? '');
        setDescription(fromApiOutlet.description ?? '');
      } else {
        setNotFound(true);
      }
    } finally {
      setFetching(false);
    }
  }, [id, role, user?.merchantId, user?.subMerchantId, contextOutlet]);

  useEffect(() => {
    loadOutlet();
  }, [loadOutlet]);

  const loadProvinces = useCallback(async () => {
    setProvincesLoading(true);
    try {
      const list = await fetchProvinces({ name: '', description: '' });
      setProvinces(list);
    } catch {
      setProvinces([]);
    } finally {
      setProvincesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProvinces();
  }, [loadProvinces]);

  useEffect(() => {
    if (provinces.length === 0 || initialProvinceId == null || selectedProvince != null) return;
    const match = provinces.find((p) => p.id === initialProvinceId);
    if (match) setSelectedProvince({ id: match.id, name: match.name });
  }, [provinces, initialProvinceId, selectedProvince]);

  const loadDistricts = useCallback(async () => {
    if (!selectedProvince) return;
    setDistrictsLoading(true);
    setDistricts([]);
    setSelectedDistrict(null);
    setSelectedCity(null);
    setCities([]);
    try {
      const list = await fetchDistricts(selectedProvince.id, { name: '' });
      setDistricts(list);
    } catch {
      setDistricts([]);
    } finally {
      setDistrictsLoading(false);
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedProvince) loadDistricts();
  }, [selectedProvince, loadDistricts]);

  useEffect(() => {
    if (districts.length === 0 || initialDistrictId == null || selectedDistrict != null) return;
    const match = districts.find((d) => d.id === initialDistrictId);
    if (match) setSelectedDistrict({ id: match.id, name: match.name });
  }, [districts, initialDistrictId, selectedDistrict]);

  const loadCities = useCallback(async () => {
    if (!selectedDistrict) return;
    setCitiesLoading(true);
    setCities([]);
    setSelectedCity(null);
    try {
      const list = await fetchCities(selectedDistrict.id, { name: '' });
      setCities(list);
    } catch {
      setCities([]);
    } finally {
      setCitiesLoading(false);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    if (selectedDistrict) loadCities();
  }, [selectedDistrict, loadCities]);

  useEffect(() => {
    if (cities.length === 0 || initialCityId == null || selectedCity != null) return;
    const match = cities.find((c) => c.id === initialCityId);
    if (match) setSelectedCity({ id: match.id, name: match.name });
  }, [cities, initialCityId, selectedCity]);

  useEffect(() => {
    if (!selectedCity?.name) {
      setMapCenter(null);
      return;
    }
    let cancelled = false;
    setGeocodeLoading(true);
    geocodeCity(
      selectedCity.name,
      selectedDistrict?.name ?? undefined,
      selectedProvince?.name ?? undefined
    )
      .then((coords) => {
        if (cancelled || !coords) return;
        setMapCenter(coords);
        if (!latitude && !longitude) {
          setLatitude(coords.latitude.toFixed(6));
          setLongitude(coords.longitude.toFixed(6));
        }
      })
      .finally(() => {
        if (!cancelled) setGeocodeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCity?.id, selectedCity?.name, selectedDistrict?.name, selectedProvince?.name]);

  const onProvinceSelect = useCallback((opt: DropdownOption) => {
    setSelectedProvince(opt);
    setSelectedDistrict(null);
    setSelectedCity(null);
    setDistricts([]);
    setCities([]);
    setInitialDistrictId(null);
    setInitialCityId(null);
    fetchDistricts(opt.id, { name: '' }).then(setDistricts).catch(() => setDistricts([]));
  }, []);

  const onDistrictSelect = useCallback((opt: DropdownOption) => {
    setSelectedDistrict(opt);
    setSelectedCity(null);
    setCities([]);
    setInitialCityId(null);
    fetchCities(opt.id, { name: '' }).then(setCities).catch(() => setCities([]));
  }, []);

  const handleSave = async () => {
    setError('');
    if (!name.trim()) {
      setError('Outlet name is required');
      return;
    }
    if (!id) return;
    setLoading(true);
    try {
      await updateOutletApi(id, {
        outletName: name.trim(),
        contactNumber: contactNumber.trim() || undefined,
        emailAddress: emailAddress.trim() || undefined,
        addressLine1: location.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
        provinceId: selectedProvince?.id,
        districtId: selectedDistrict?.id,
        cityId: selectedCity?.id,
        latitude: toFloat(latitude),
        longitude: toFloat(longitude),
        outletType: outletType.trim() || 'PHYSICAL_STORE',
        businessCategory: businessCategory.trim() || 'RETAIL',
      });
      if (fromContext && contextOutlet && updateOutlet) {
        await updateOutlet(id, {
          name: name.trim(),
          location: location.trim(),
          contactNumber: contactNumber.trim(),
          description: description.trim(),
          status: contextOutlet.status,
        });
      }
      router.back();
    } catch {
      setError('Failed to update outlet');
    } finally {
      setLoading(false);
    }
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );

  if (!id) {
    return (
      <View style={styles.screen}>
        <View style={styles.errorBlock}>
          <Text style={styles.errorText}>Invalid outlet.</Text>
          <PrimaryButton title="Back" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  if (fetching) {
    return (
      <View style={styles.screen}>
        <View style={styles.loadingBlock}>
          <LoadingSpinner />
        </View>
      </View>
    );
  }

  if (notFound && !contextOutlet) {
    return (
      <View style={styles.screen}>
        <View style={styles.errorBlock}>
          <Text style={styles.errorText}>Outlet not found.</Text>
          <PrimaryButton title="Back" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={12}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Edit Outlet</Text>
        <Text style={styles.headerSubtitle}>Update outlet details</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Section title="Basic information">
            <AppInput
              placeholder="Outlet name *"
              value={name}
              onChangeText={(t) => {
                setName(t);
                setError('');
              }}
              editable={!loading}
              style={styles.input}
            />
            <AppInput
              placeholder="Contact number"
              value={contactNumber}
              onChangeText={setContactNumber}
              keyboardType="phone-pad"
              editable={!loading}
              style={styles.input}
            />
            <AppInput
              placeholder="Email address"
              value={emailAddress}
              onChangeText={setEmailAddress}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              style={styles.input}
            />
            <AppInput
              placeholder="Description (optional)"
              value={description}
              onChangeText={setDescription}
              multiline
              editable={!loading}
              style={[styles.input, styles.inputMultiline]}
            />
          </Section>

          <Section title="Address">
            <AppInput
              placeholder="Address line 1"
              value={location}
              onChangeText={setLocation}
              editable={!loading}
              style={styles.input}
            />
            <AppInput
              placeholder="Postal code"
              value={postalCode}
              onChangeText={setPostalCode}
              editable={!loading}
              style={styles.input}
            />
            <Text style={styles.dropdownLabel}>Province</Text>
            <SearchableDropdown
              options={provinces}
              selected={selectedProvince}
              onSelect={onProvinceSelect}
              placeholder="Select province"
              searchPlaceholder="Search province"
              loading={provincesLoading}
              disabled={loading}
              onOpen={() => provinces.length === 0 && loadProvinces()}
            />
            <Text style={[styles.dropdownLabel, { marginTop: spacing.md }]}>District</Text>
            <SearchableDropdown
              options={districts}
              selected={selectedDistrict}
              onSelect={onDistrictSelect}
              placeholder="Select district"
              searchPlaceholder="Search district"
              loading={districtsLoading}
              disabled={loading || !selectedProvince}
              onOpen={() => selectedProvince && districts.length === 0 && loadDistricts()}
            />
            <Text style={[styles.dropdownLabel, { marginTop: spacing.md }]}>City</Text>
            <SearchableDropdown
              options={cities}
              selected={selectedCity}
              onSelect={setSelectedCity}
              placeholder="Select city"
              searchPlaceholder="Search city"
              loading={citiesLoading}
              disabled={loading || !selectedDistrict}
              onOpen={() => selectedDistrict && cities.length === 0 && loadCities()}
            />
          </Section>

          <Section title="Location (coordinates)">
            {selectedCity ? (
              <>
                <Text style={styles.mapHint}>
                  Pin the exact location on the map. Map is zoomed to {selectedCity.name}.
                </Text>
                <LocationMapPicker
                  mapCenter={mapCenter}
                  latitude={latitude}
                  longitude={longitude}
                  geocodeLoading={geocodeLoading}
                  onMarkerDragEnd={(lat, lng) => {
                    setLatitude(lat.toFixed(6));
                    setLongitude(lng.toFixed(6));
                  }}
                  disabled={loading}
                />
              </>
            ) : (
              <Text style={styles.mapHint}>
                Select Province, District and City above to show the map and pin your outlet location.
              </Text>
            )}
            <View style={styles.row}>
              <AppInput
                placeholder="Latitude"
                value={latitude}
                onChangeText={setLatitude}
                keyboardType="decimal-pad"
                editable={!loading}
                style={[styles.input, styles.inputHalf]}
              />
              <AppInput
                placeholder="Longitude"
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="decimal-pad"
                editable={!loading}
                style={[styles.input, styles.inputHalf]}
              />
            </View>
          </Section>

          <Section title="Business details">
            <AppInput
              placeholder="Business registration number"
              value={businessRegistrationNumber}
              onChangeText={setBusinessRegistrationNumber}
              editable={!loading}
              style={styles.input}
            />
            <AppInput
              placeholder="Tax identification number"
              value={taxIdentificationNumber}
              onChangeText={setTaxIdentificationNumber}
              editable={!loading}
              style={styles.input}
            />
            <Text style={styles.dropdownLabel}>Outlet type</Text>
            <SearchableDropdown
              options={OUTLET_TYPE_OPTIONS.map((o, i) => ({ id: i, name: o.label }))}
              selected={(() => {
                const idx = OUTLET_TYPE_OPTIONS.findIndex((o) => o.value === outletType);
                return idx >= 0 ? { id: idx, name: OUTLET_TYPE_OPTIONS[idx].label } : null;
              })()}
              onSelect={(opt) => setOutletType(OUTLET_TYPE_OPTIONS[opt.id].value)}
              placeholder="Select outlet type"
              searchPlaceholder="Search outlet type"
              disabled={loading}
            />
            <Text style={[styles.dropdownLabel, { marginTop: spacing.md }]}>Business category</Text>
            <SearchableDropdown
              options={BUSINESS_CATEGORY_OPTIONS.map((o, i) => ({ id: i, name: o.label }))}
              selected={(() => {
                const idx = BUSINESS_CATEGORY_OPTIONS.findIndex((o) => o.value === businessCategory);
                return idx >= 0 ? { id: idx, name: BUSINESS_CATEGORY_OPTIONS[idx].label } : null;
              })()}
              onSelect={(opt) => setBusinessCategory(BUSINESS_CATEGORY_OPTIONS[opt.id].value)}
              placeholder="Select business category"
              searchPlaceholder="Search business category"
              disabled={loading}
            />
          </Section>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.submitWrap}>
            <PrimaryButton
              title={loading ? 'Saving…' : 'Save Changes'}
              onPress={handleSave}
              loading={loading}
              disabled={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {loading ? (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner />
        </View>
      ) : null}
    </View>
  );
}

const SRI_LANKA_LAT = 7.8731;
const SRI_LANKA_LNG = 80.7718;
const MAP_DELTA = 0.02;

function LocationMapPicker({
  mapCenter,
  latitude,
  longitude,
  geocodeLoading,
  onMarkerDragEnd,
  disabled,
}: {
  mapCenter: { latitude: number; longitude: number } | null;
  latitude: string;
  longitude: string;
  geocodeLoading: boolean;
  onMarkerDragEnd: (lat: number, lng: number) => void;
  disabled?: boolean;
}) {
  const latNum = toFloat(latitude);
  const lngNum = toFloat(longitude);
  const hasPin = latNum != null && lngNum != null;
  const center = hasPin
    ? { latitude: latNum, longitude: lngNum }
    : mapCenter ?? { latitude: SRI_LANKA_LAT, longitude: SRI_LANKA_LNG };

  try {
    const MapView = require('react-native-maps').default;
    const Marker = require('react-native-maps').Marker;
    return (
      <View style={styles.mapWrap}>
        {geocodeLoading ? (
          <Text style={styles.mapLoadingText}>Loading map location…</Text>
        ) : null}
        <MapView
          key={`${center.latitude.toFixed(4)}-${center.longitude.toFixed(4)}`}
          style={styles.map}
          initialRegion={{
            latitude: center.latitude,
            longitude: center.longitude,
            latitudeDelta: MAP_DELTA,
            longitudeDelta: MAP_DELTA,
          }}
          scrollEnabled={!disabled}
          zoomEnabled={!disabled}
          onPress={(e) => {
            if (disabled) return;
            const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
            onMarkerDragEnd(lat, lng);
          }}
        >
          <Marker
            coordinate={{
              latitude: hasPin ? latNum! : center.latitude,
              longitude: hasPin ? lngNum! : center.longitude,
            }}
            draggable={!disabled}
            onDragEnd={(e) => {
              const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
              onMarkerDragEnd(lat, lng);
            }}
            title="Outlet location"
          />
        </MapView>
      </View>
    );
  } catch {
    return (
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>Map unavailable (react-native-maps required)</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: cardRadius,
    borderBottomRightRadius: cardRadius,
  },
  backRow: {
    marginBottom: spacing.xs,
  },
  backText: {
    fontSize: fontSizes.sm,
    color: colors.white,
    opacity: 0.9,
  },
  headerTitle: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.white,
    opacity: 0.85,
    marginTop: spacing.xxs,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: cardRadius,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    marginBottom: spacing.md,
  },
  inputMultiline: {
    minHeight: 80,
    marginBottom: 0,
  },
  dropdownLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  mapHint: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  mapWrap: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapLoadingText: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    fontSize: fontSizes.sm,
    color: colors.primary,
    zIndex: 1,
  },
  mapPlaceholder: {
    height: 120,
    borderRadius: 12,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  mapPlaceholderText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputHalf: {
    flex: 1,
    marginBottom: spacing.md,
  },
  error: {
    color: colors.error,
    fontSize: fontSizes.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  submitWrap: {
    marginTop: spacing.sm,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBlock: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBlock: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
});

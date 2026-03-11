import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppInput } from '@/components/ui/AppInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SearchableDropdown, type DropdownOption } from '@/components/ui/SearchableDropdown';
import { useAuth } from '@/context/auth-context';
import {
    fetchCities,
    fetchDistricts,
    fetchProvinces,
    geocodeCity,
    type LocationOption,
} from '@/services/locationService';
import { createOutlet, type CreateOutletPayload } from '@/services/outletService';
import { fetchSubMerchants, type SubMerchantListItem } from '@/services/subMerchantService';
import { colors } from '@/theme/colors';
import { cardRadius, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';

function toNum(s: string): number | undefined {
  const n = parseInt(s.trim(), 10);
  return isNaN(n) ? undefined : n;
}

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
  { value: 'HOSPITAL', label: 'Hospital' },
  { value: 'ELECTRONICS', label: 'Electronics' },
  { value: 'FASHION', label: 'Fashion' },
  { value: 'HARDWARE', label: 'Hardware' },
  { value: 'BOOKSHOP', label: 'Bookshop' },
  { value: 'SALON', label: 'Salon' },
  { value: 'BAKERY', label: 'Bakery' },
  { value: 'PET_SHOP', label: 'Pet shop' },
  { value: 'FUEL_STATION', label: 'Fuel station' },
  { value: 'AGRICULTURE', label: 'Agriculture' },
  { value: 'WHOLESALE', label: 'Wholesale' },
  { value: 'CO_WORKING_SPACE', label: 'Shared workspaces' },
  { value: 'FITNESS_CENTER', label: 'Gym, yoga, pilates' },
  { value: 'ENTERTAINMENT', label: 'Cinema, arcade, gaming' },
  { value: 'TRAVEL_AGENCY', label: 'Tours, travel services' },
  { value: 'BANKING', label: 'Bank branches, ATMs' },
  { value: 'INSURANCE', label: 'Insurance offices' },
  { value: 'BEAUTY', label: 'Spa, massage parlors' },
  { value: 'TECH_SERVICES', label: 'IT repair, software services' },
  { value: 'OTHER', label: 'Other' },
];

export default function AddOutletScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const merchantId = user?.merchantId ?? 0;

  const [subMerchantList, setSubMerchantList] = useState<SubMerchantListItem[]>([]);
  const [subMerchantsLoading, setSubMerchantsLoading] = useState(true);

  const [outletName, setOutletName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [provinces, setProvinces] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<DropdownOption | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<DropdownOption | null>(null);
  const [selectedCity, setSelectedCity] = useState<DropdownOption | null>(null);
  const [provincesLoading, setProvincesLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState('');
  const [taxIdentificationNumber, setTaxIdentificationNumber] = useState('');
  const [outletType, setOutletType] = useState('PHYSICAL_STORE');
  const [businessCategory, setBusinessCategory] = useState('RESTAURANT');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [assignSubMerchant, setAssignSubMerchant] = useState(false);
  const [selectedSubMerchant, setSelectedSubMerchant] = useState<DropdownOption | null>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const subMerchantOptions: DropdownOption[] = subMerchantList.map((sm) => ({
    id: sm.subMerchantId,
    name: sm.merchantName ?? `Sub merchant ${sm.subMerchantId}`,
  }));

  const handleCreate = async () => {
    setError('');
    if (!outletName.trim()) {
      setError('Outlet name is required');
      return;
    }
    if (!merchantId) {
      setError('Merchant not found. Please sign in again.');
      return;
    }
    setLoading(true);
    try {
      const payload: CreateOutletPayload = {
        merchantId,
        subMerchantId: assignSubMerchant && selectedSubMerchant ? selectedSubMerchant.id : null,
        outletName: outletName.trim(),
        contactNumber: contactNumber.trim() || undefined,
        emailAddress: emailAddress.trim() || undefined,
        addressLine1: addressLine1.trim() || undefined,
        addressLine2: addressLine2.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
        provinceId: selectedProvince?.id ?? 1,
        districtId: selectedDistrict?.id ?? 1,
        cityId: selectedCity?.id ?? 1,
        businessRegistrationNumber: businessRegistrationNumber.trim() || undefined,
        taxIdentificationNumber: taxIdentificationNumber.trim() || undefined,
        outletType: outletType.trim() || 'PHYSICAL_STORE',
        businessCategory: businessCategory.trim() || 'RESTAURANT',
        latitude: toFloat(latitude),
        longitude: toFloat(longitude),
        bankName: bankName.trim() || undefined,
        bankBranch: bankBranch.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
        accountHolderName: accountHolderName.trim() || undefined,
        remarks: remarks.trim() || undefined,
      };
      await createOutlet(payload);
      router.back();
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { responseMessage?: string } } }).response?.data?.responseMessage
          : null;
      setError(msg || 'Failed to create outlet');
    } finally {
      setLoading(false);
    }
  };

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

  // Load provinces as soon as Add Outlet page loads so dropdown is ready
  useEffect(() => {
    loadProvinces();
  }, [loadProvinces]);

  // Load sub-merchants from GET /api/merchant-app/sub-merchants for "Assign sub merchant" dropdown
  useEffect(() => {
    if (!merchantId) {
      setSubMerchantsLoading(false);
      setSubMerchantList([]);
      return;
    }
    setSubMerchantsLoading(true);
    fetchSubMerchants()
      .then(setSubMerchantList)
      .catch(() => setSubMerchantList([]))
      .finally(() => setSubMerchantsLoading(false));
  }, [merchantId]);

  // When city is selected, geocode to zoom map to that location and set initial pin
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
        setLatitude(coords.latitude.toFixed(6));
        setLongitude(coords.longitude.toFixed(6));
      })
      .finally(() => {
        if (!cancelled) setGeocodeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCity?.id, selectedCity?.name, selectedDistrict?.name, selectedProvince?.name]);

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

  const onProvinceSelect = useCallback((opt: DropdownOption) => {
    setSelectedProvince(opt);
    setSelectedDistrict(null);
    setSelectedCity(null);
    setDistricts([]);
    setCities([]);
    fetchDistricts(opt.id, { name: '' }).then(setDistricts).catch(() => setDistricts([]));
  }, []);

  const onDistrictSelect = useCallback((opt: DropdownOption) => {
    setSelectedDistrict(opt);
    setSelectedCity(null);
    setCities([]);
    fetchCities(opt.id, { name: '' }).then(setCities).catch(() => setCities([]));
  }, []);

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={12}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Add Outlet</Text>
        <Text style={styles.headerSubtitle}>Create a new outlet</Text>
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
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Assign sub merchant</Text>
              <Switch
                value={assignSubMerchant}
                onValueChange={(v) => {
                  setAssignSubMerchant(v);
                  if (!v) setSelectedSubMerchant(null);
                }}
                disabled={loading}
              />
            </View>
            {assignSubMerchant && (
              <>
                <Text style={styles.dropdownLabel}>Sub merchant</Text>
                <SearchableDropdown
                  options={subMerchantOptions}
                  selected={selectedSubMerchant}
                  onSelect={setSelectedSubMerchant}
                  placeholder={subMerchantsLoading ? 'Loading…' : 'Select sub merchant'}
                  searchPlaceholder="Search sub merchant"
                  disabled={loading}
                  loading={subMerchantsLoading}
                />
              </>
            )}
            <AppInput
              placeholder="Outlet name *"
              value={outletName}
              onChangeText={(t) => {
                setOutletName(t);
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
          </Section>

          <Section title="Address">
            <AppInput
              placeholder="Address line 1"
              value={addressLine1}
              onChangeText={setAddressLine1}
              editable={!loading}
              style={styles.input}
            />
            <AppInput
              placeholder="Address line 2"
              value={addressLine2}
              onChangeText={setAddressLine2}
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
            <Text style={styles.dropdownLabel}>District</Text>
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
            <Text style={styles.dropdownLabel}>City</Text>
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
              selected={
                (() => {
                  const idx = OUTLET_TYPE_OPTIONS.findIndex((o) => o.value === outletType);
                  return idx >= 0
                    ? { id: idx, name: OUTLET_TYPE_OPTIONS[idx].label }
                    : null;
                })()
              }
              onSelect={(opt) => setOutletType(OUTLET_TYPE_OPTIONS[opt.id].value)}
              placeholder="Select outlet type"
              searchPlaceholder="Search outlet type"
              disabled={loading}
            />
            <Text style={styles.dropdownLabel}>Business category</Text>
            <SearchableDropdown
              options={BUSINESS_CATEGORY_OPTIONS.map((o, i) => ({ id: i, name: o.label }))}
              selected={
                (() => {
                  const idx = BUSINESS_CATEGORY_OPTIONS.findIndex((o) => o.value === businessCategory);
                  return idx >= 0
                    ? { id: idx, name: BUSINESS_CATEGORY_OPTIONS[idx].label }
                    : null;
                })()
              }
              onSelect={(opt) => setBusinessCategory(BUSINESS_CATEGORY_OPTIONS[opt.id].value)}
              placeholder="Select business category"
              searchPlaceholder="Search business category"
              disabled={loading}
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

          <Section title="Bank details">
            <AppInput
              placeholder="Bank name"
              value={bankName}
              onChangeText={setBankName}
              editable={!loading}
              style={styles.input}
            />
            <AppInput
              placeholder="Bank branch"
              value={bankBranch}
              onChangeText={setBankBranch}
              editable={!loading}
              style={styles.input}
            />
            <AppInput
              placeholder="Account number"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="number-pad"
              editable={!loading}
              style={styles.input}
            />
            <AppInput
              placeholder="Account holder name"
              value={accountHolderName}
              onChangeText={setAccountHolderName}
              editable={!loading}
              style={styles.input}
            />
          </Section>

          <Section title="Remarks">
            <AppInput
              placeholder="Optional notes"
              value={remarks}
              onChangeText={setRemarks}
              multiline
              editable={!loading}
              style={[styles.input, styles.inputMultiline]}
            />
          </Section>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.submitWrap}>
            <PrimaryButton
              title={loading ? 'Creating…' : 'Create Outlet'}
              onPress={handleCreate}
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
  dropdownLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  toggleLabel: {
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    flex: 1,
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
  inputMultiline: {
    minHeight: 80,
    marginBottom: 0,
  },
  inputHalf: {
    flex: 1,
    marginBottom: spacing.md,
  },
  inputThird: {
    flex: 1,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
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
});

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { Calendar } from "react-native-calendars";
import { BlurView } from "expo-blur";

const MAPBOX_TOKEN =
  "pk.eyJ1IjoidHllcm9uZSIsImEiOiJjbWh2aG9uYzEwYWJxMmtvazVrYnI1YzdsIn0.AUsVmUu5yaEIG8MGUBRAOQ";

export default function MeetSearchScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState("");
  const [expandedWhere, setExpandedWhere] = useState(false);

  const [coords, setCoords] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    loadUserLocation();
  }, []);

  useEffect(() => {
    if (!coords) return;

    const trimmed = query.trim();

    if (!expandedWhere || trimmed.length < 2) {
      loadNearby();
      return;
    }

    searchPlaces(trimmed);
  }, [coords, expandedWhere, query]);

  async function loadUserLocation() {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setItems([]);
        return;
      }

      const current = await Location.getCurrentPositionAsync({});
      setCoords({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
    } catch (e) {
      console.log("location error", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadNearby() {
    if (!coords) return;

    try {
      setLoading(true);

      const revUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.longitude},${coords.latitude}.json?types=place,region,country&limit=5&access_token=${MAPBOX_TOKEN}`;

      const revRes = await fetch(revUrl);
      const revData = await revRes.json();
      const revFeatures = Array.isArray(revData.features)
        ? revData.features
        : [];

      const nearestCity = revFeatures.find((f) =>
        f.place_type?.includes("place")
      );

      let regionText = null;
      let countryText = null;

      if (nearestCity && Array.isArray(nearestCity.context)) {
        const regionContext = nearestCity.context.find((c) =>
          c.id.startsWith("region")
        );
        const countryContext = nearestCity.context.find((c) =>
          c.id.startsWith("country")
        );
        regionText = regionContext ? regionContext.text : null;
        countryText = countryContext ? countryContext.text : null;
      }

      const combined = [];
      const seen = new Set();

      const pushUnique = (feature) => {
        if (!feature || seen.has(feature.id)) return;
        if (!feature.place_type?.includes("place")) return;
        seen.add(feature.id);
        combined.push(feature);
      };

      revFeatures.forEach(pushUnique);

      async function fetchForward(q) {
        const encoded = encodeURIComponent(q);
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?types=place&proximity=${coords.longitude},${coords.latitude}&limit=10&access_token=${MAPBOX_TOKEN}`;
        const res = await fetch(url);
        const data = await res.json();
        const features = Array.isArray(data.features) ? data.features : [];
        features.forEach(pushUnique);
      }

      if (regionText) {
        await fetchForward(regionText);
      }
      if (countryText) {
        await fetchForward(countryText);
      }

      const limited = combined.slice(0, 10);

      const mapped = limited.map((f) => ({
        id: f.id,
        title: f.text,
        subtitle: f.place_name.replace(`${f.text}, `, ""),
        center: f.center,
      }));

      setItems(mapped);
    } catch (e) {
      console.log("nearby error", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function searchPlaces(text) {
    if (!coords) return;

    try {
      setLoading(true);

      const encoded = encodeURIComponent(text);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?autocomplete=true&proximity=${coords.longitude},${coords.latitude}&types=place,locality,neighborhood,region,country&limit=10&access_token=${MAPBOX_TOKEN}`;

      const res = await fetch(url);
      const data = await res.json();

      const features = Array.isArray(data.features) ? data.features : [];

      const mapped = features.map((f) => ({
        id: f.id,
        title: f.text,
        subtitle: f.place_name.replace(`${f.text}, `, ""),
        center: f.center,
      }));

      setItems(mapped);
    } catch (e) {
      console.log("search error", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function closeSheet() {
    navigation.goBack();
  }

  function handleChevronPress() {
    if (expandedWhere || showCalendar) {
      setExpandedWhere(false);
      setShowCalendar(false);
      return;
    }
    closeSheet();
  }

  function handleWherePress() {
    setExpandedWhere(true);
  }

  function handleClearAll() {
    setQuery("");
    setSelectedLocation(null);
    setExpandedWhere(false);
    setStartDate(null);
    setEndDate(null);
  }

  function handleSelectLocation(item) {
    if (item.isNearbyStatic) {
      const value = {
        id: "nearby",
        title: "Nearby",
        subtitle: "Find what is around you",
        center: coords ? [coords.longitude, coords.latitude] : null,
      };
      setSelectedLocation(value);
      setQuery(value.title);
    } else {
      setSelectedLocation(item);
      setQuery(item.title);
    }

    if (expandedWhere) {
      setExpandedWhere(false);
    }
  }

  function handleSearch() {
    const payload = {
      locationTitle: selectedLocation?.title || query || "Anywhere",
      locationSubtitle: selectedLocation?.subtitle || "",
      center: selectedLocation?.center
        ? {
            latitude: selectedLocation.center[1],
            longitude: selectedLocation.center[0],
          }
        : null,
      startDate,
      endDate,
    };

    navigation.replace("MeetResults", payload);
  }

  function handleOpenCalendar() {
    setShowCalendar(true);
  }

  function handleCalendarBack() {
    setShowCalendar(false);
  }

  function onDayPress(day) {
    const dateStr = day.dateString;

    if (!startDate || (startDate && endDate)) {
      setStartDate(dateStr);
      setEndDate(null);
      return;
    }

    if (startDate && !endDate) {
      if (dateStr < startDate) {
        setStartDate(dateStr);
        setEndDate(null);
      } else if (dateStr === startDate) {
        setEndDate(null);
      } else {
        setEndDate(dateStr);
      }
    }
  }

  const markedDates = useMemo(() => {
    if (!startDate && !endDate) return {};

    const marked = {};

    if (startDate) {
      marked[startDate] = {
        startingDay: true,
        endingDay: !endDate,
        color: "#111827",
        textColor: "#ffffff",
      };
    }

    if (startDate && endDate) {
      marked[endDate] = {
        endingDay: true,
        color: "#111827",
        textColor: "#ffffff",
      };

      let current = new Date(startDate);
      const end = new Date(endDate);

      while (true) {
        current.setDate(current.getDate() + 1);
        const iso = current.toISOString().slice(0, 10);
        if (iso >= endDate) break;
        marked[iso] = {
          color: "#e5e7eb",
          textColor: "#111827",
        };
      }
    }

    return marked;
  }, [startDate, endDate]);

  function clearDates() {
    setStartDate(null);
    setEndDate(null);
  }

  function formatDateRangeLabel() {
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const sStr = s.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const eStr = e.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      return `${sStr} – ${eStr}`;
    }
    return "Any week";
  }

  const listItems = [
    {
      id: "nearby-static",
      title: "Nearby",
      subtitle: "Find what is around you",
      isNearbyStatic: true,
    },
    ...items,
  ];

  function renderSheetContent() {
    if (showCalendar) {
      return (
        <View style={styles.sheetCard}>
          <View style={styles.sheetHeaderRow}>
            <TouchableOpacity
              onPress={handleCalendarBack}
              style={styles.sheetBackButton}
            >
              <Ionicons name="arrow-back" size={20} color="#000" />
            </TouchableOpacity>
            <Text style={styles.sheetTitle}>Select dates</Text>
            <View style={{ width: 24 }} />
          </View>

          <Calendar
            markingType="period"
            markedDates={markedDates}
            onDayPress={onDayPress}
            minDate={new Date().toISOString().slice(0, 10)}
          />

          <View style={styles.calendarBottomRow}>
            <TouchableOpacity onPress={clearDates}>
              <Text style={styles.clearAllText}>Clear dates</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleCalendarBack}
              activeOpacity={0.9}
            >
              <Text style={styles.searchButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (expandedWhere) {
      return (
        <View style={styles.sheetCard}>
          <View style={styles.expandedSearchRow}>
            <TouchableOpacity
              onPress={() => setExpandedWhere(false)}
              style={styles.sheetBackButton}
            >
              <Ionicons name="arrow-back" size={20} color="#000" />
            </TouchableOpacity>

            <TextInput
              style={styles.expandedSearchInput}
              placeholder="Search destinations"
              placeholderTextColor="#9ca3af"
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
          </View>

          <Text style={styles.suggestionsTitleExpanded}>
            Suggested destinations
          </Text>

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator />
            </View>
          )}

          <ScrollView
            style={styles.suggestionsScrollExpanded}
            contentContainerStyle={styles.suggestionsContent}
            showsVerticalScrollIndicator={false}
          >
            {listItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionRow}
                activeOpacity={0.8}
                onPress={() => handleSelectLocation(item)}
              >
                <View style={styles.suggestionIconWrap}>
                  <View style={styles.suggestionIconInner}>
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color="#22c55e"
                    />
                  </View>
                </View>

                <View style={styles.suggestionTextWrap}>
                  <Text style={styles.suggestionTitle}>{item.title}</Text>
                  <Text style={styles.suggestionSubtitle}>{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={styles.mainCard}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={handleChevronPress}
            style={styles.chevronButton}
          >
            <Ionicons name="chevron-down" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Where?</Text>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleWherePress}
          style={styles.whereCard}
        >
          <View style={styles.whereSearchRow}>
            <Ionicons name="search" size={18} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search destinations"
              placeholderTextColor="#9ca3af"
              value={query}
              onChangeText={setQuery}
              editable={false}
              pointerEvents="none"
            />
          </View>

          <View style={styles.suggestionsSection}>
            <Text style={styles.suggestionsTitle}>Suggested destinations</Text>

            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator />
              </View>
            )}

            {listItems.slice(0, 5).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionRow}
                activeOpacity={0.8}
                onPress={() => handleSelectLocation(item)}
              >
                <View style={styles.suggestionIconWrap}>
                  <View style={styles.suggestionIconInner}>
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color="#22c55e"
                    />
                  </View>
                </View>

                <View style={styles.suggestionTextWrap}>
                  <Text style={styles.suggestionTitle}>{item.title}</Text>
                  <Text style={styles.suggestionSubtitle}>{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sectionCard}
          activeOpacity={0.9}
          onPress={handleOpenCalendar}
        >
          <View style={styles.sectionCardContent}>
            <View>
              <Text style={styles.sectionLabel}>When</Text>
              <Text style={styles.sectionSubtitle}>
                {formatDateRangeLabel()}
              </Text>
            </View>
            <Ionicons name="calendar-outline" size={20} color="#6b7280" />
          </View>
        </TouchableOpacity>

        <View style={styles.bottomRow}>
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearAllText}>Clear all</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            activeOpacity={0.9}
          >
            <Ionicons name="search" size={18} color="#fff" />
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFill} />
      <View
        style={[
          styles.overlayRoot,
          { paddingTop: insets.top + 8 }, // pushes card below island
        ]}
      >
        {renderSheetContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  overlayRoot: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  mainCard: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  headerRow: {
    alignItems: "flex-start",
    marginBottom: 8,
  },
  chevronButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 12,
    color: "#111827",
  },
  whereCard: {
    borderRadius: 28,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  whereSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  suggestionsSection: {
    marginTop: 14,
  },
  suggestionsTitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
  },
  loadingRow: {
    paddingVertical: 6,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  suggestionIconWrap: {
    marginRight: 12,
  },
  suggestionIconInner: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#ecfdf3",
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionTextWrap: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  suggestionSubtitle: {
    fontSize: 13,
    color: "#6b7280",
  },
  sectionCard: {
    borderRadius: 18,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    marginTop: 16,
    marginBottom: 16,
  },
  sectionCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  bottomRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clearAllText: {
    fontSize: 14,
    textDecorationLine: "underline",
    color: "#111827",
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#e11d48",
  },
  searchButtonText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
  sheetCard: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sheetBackButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  expandedSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginBottom: 10,
  },
  expandedSearchInput: {
    flex: 1,
    marginLeft: 4,
    fontSize: 14,
  },
  suggestionsTitleExpanded: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
  },
  suggestionsScrollExpanded: {
    flex: 1,
  },
  suggestionsContent: {
    paddingBottom: 8,
  },
  calendarBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
});

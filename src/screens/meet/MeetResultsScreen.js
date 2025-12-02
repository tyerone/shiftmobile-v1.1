// MeetResultsScreen.js
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Dimensions,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function formatDateRangeLabel(startDate, endDate) {
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
    return `${sStr} · ${eStr}`;
  }
  return "Any week";
}

function createMockMeets(center) {
  const baseLat = center?.latitude ?? 49.2827;
  const baseLng = center?.longitude ?? -123.1207;
  const offsets = [
    { dx: 0.01, dy: 0.0 },
    { dx: -0.008, dy: 0.004 },
    { dx: 0.006, dy: -0.005 },
    { dx: -0.012, dy: -0.006 },
    { dx: 0.002, dy: 0.007 },
    { dx: -0.004, dy: -0.002 },
  ];
  const descriptions = [
    "Chill evening meet",
    "Photoshoot + cruise",
    "Casual parking lot hangout",
    "JDM only meet",
    "All cars welcome!",
    "Morning coffee run",
  ];
  const images = [
    "https://bangshift.com/wp-content/uploads/2017/01/kelly-python1.jpg",
    "https://s3.us-west-2.amazonaws.com/static.roadstr.io/web/article-sunsetgt/main2.jpg",
    "https://i.ytimg.com/vi/I2c_lhDAARI/maxresdefault.jpg",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRykCetvnGNXMSgi9iXhC-Yvdw-8mhjao4TA&s",
    "https://cdn.myportfolio.com/eb190473-8c70-4eff-9134-fcdf80d8a2ca/bc930ee7-51e9-4686-b601-8bda99bd7c84_rw_1920.jpg?h=48c4cfa32b271016deb2ca6e3d63530b",
    "https://cdn.myportfolio.com/eb190473-8c70-4eff-9134-fcdf80d8a2ca/56393b2c-0ec0-400d-8090-8535e2f33118_rw_1920.jpg?h=24966c3022d82310a294ffcc62b79db6",
  ];

  return offsets.map((o, index) => {
    const randomHour = 18 + Math.floor(Math.random() * 4); // between 18–21 (6–9pm)
    const randomMinute = Math.random() > 0.5 ? "00" : "30";
    return {
      id: `meet-${index}`,
      title: `Meet ${index + 1}`,
      subtitle: descriptions[index % descriptions.length],
      time: `${randomHour}:${randomMinute}`,
      date: `Today at ${randomHour}:${randomMinute}`,
      description: descriptions[index % descriptions.length],
      organizer: "Shift Inc.",
      organizerPhoto: `https://i.pravatar.cc/300?img=${12 + (index % 10)}`,
      image: images[index % images.length],
      latitude: baseLat + o.dy,
      longitude: baseLng + o.dx,
    };
  });
}

export default function MeetResultsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [selectedMeet, setSelectedMeet] = useState(null);

  const { locationTitle, locationSubtitle, center, startDate, endDate } =
    route.params || {};

  const region = useMemo(
    () => ({
      latitude: center?.latitude ?? 49.2827,
      longitude: center?.longitude ?? -123.1207,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    }),
    [center]
  );

  const meets = useMemo(() => createMockMeets(center), [center]);
  const dateLabel = formatDateRangeLabel(startDate, endDate);
  const headerTitle = locationTitle || locationSubtitle || "Meets in this area";

  function handleBack() {
    navigation.goBack();
  }

  function handleFilterPress() {
    // placeholder for filters
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <MapView style={styles.map} initialRegion={region}>
          {meets.map((meet) => (
            <Marker
              key={meet.id}
              coordinate={{
                latitude: meet.latitude,
                longitude: meet.longitude,
              }}
              onPress={() => setSelectedMeet(meet)}
            >
              <View style={styles.pricePill}>
                <View style={styles.priceDot} />
                <Text style={styles.priceText}>{meet.title}</Text>
              </View>
            </Marker>
          ))}
        </MapView>

        {/* background bar behind the pill */}
        <View style={styles.headerBackground} />

        {/* top pill header */}
        <View style={styles.topBarWrapper}>
          <View style={styles.topBarRow}>
            <TouchableOpacity style={styles.topBackButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={20} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.topPill}
              activeOpacity={0.9}
              onPress={() => navigation.navigate("MeetSearch")}
            >
              <Text style={styles.topTitle}>
                {headerTitle.startsWith("Meets")
                  ? headerTitle
                  : `Meets in ${headerTitle}`}
              </Text>
              <Text style={styles.topSubtitle}>{dateLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.topBackButton}
              onPress={handleFilterPress}
            >
              <Ionicons name="options-outline" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* bottom sheet preview */}
        <View style={styles.bottomSheet}>
          <View style={styles.bottomHandle} />
          <Text style={styles.bottomTitle}>Meets nearby</Text>
          <Text style={styles.bottomSubtitle}>
            {meets.length} meets around this area
          </Text>
        </View>
      </View>

      {/* Meet Details Popup */}
      <Modal
        visible={!!selectedMeet}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMeet(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Close X */}
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setSelectedMeet(null)}
            >
              <Ionicons name="close" size={22} color="#111827" />
            </Pressable>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Car Photo */}
              {selectedMeet?.image ? (
                <Image
                  source={{ uri: selectedMeet.image }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[styles.modalImage, { backgroundColor: "#f3f4f6" }]}
                />
              )}

              {/* Content */}
              <View style={styles.modalContent}>
                {/* Organizer bubble */}
                <View style={styles.organizerRow}>
                  <Image
                    source={{ uri: selectedMeet?.organizerPhoto }}
                    style={styles.organizerAvatar}
                  />
                  <Text style={styles.organizerName}>
                    {selectedMeet?.organizer}
                  </Text>
                </View>

                {/* Title */}
                <Text style={styles.meetTitle}>{selectedMeet?.title}</Text>

                {/* Date */}
                <Text style={styles.meetDate}>{selectedMeet?.date}</Text>

                {/* Description */}
                <Text style={styles.meetDescription}>
                  {selectedMeet?.description}
                </Text>

                {/* Add to Calendar button (non-functional) */}
                <TouchableOpacity
                  onPress={() => {
                    /* placeholder - non-functional */
                  }}
                  style={styles.calendarButton}
                >
                  <Text style={styles.calendarButtonText}>Add to Calendar</Text>
                </TouchableOpacity>

                {/* small secondary Close button (redundant) */}
                <TouchableOpacity
                  onPress={() => setSelectedMeet(null)}
                  style={styles.smallClose}
                >
                  <Text style={styles.smallCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 96,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  topBarWrapper: {
    position: "absolute",
    top: 8,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  topBarRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "space-between",
  },
  topBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  topPill: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    paddingHorizontal: 18,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    alignItems: "center",
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  topSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  pricePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  priceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#111827",
    marginRight: 6,
  },
  priceText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 26,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  bottomHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
    marginBottom: 8,
  },
  bottomTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  bottomSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },

  /* Modal styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.32)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    height: Math.min(SCREEN_HEIGHT * 0.88, 920),
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  modalCloseButton: {
    position: "absolute",
    right: 14,
    top: 10,
    zIndex: 3,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  modalScroll: {
    paddingBottom: 40,
    backgroundColor: "#fff",
  },
  modalImage: {
    width: "100%",
    height: 260,
    backgroundColor: "#eee",
  },
  modalContent: {
    padding: 20,
    paddingTop: 14,
  },
  organizerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  organizerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  organizerName: {
    fontSize: 15,
    color: "#444",
  },
  meetTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
    color: "#0B1C3D",
  },
  meetDate: {
    fontSize: 16,
    color: "#666",
  },
  meetDescription: {
    marginTop: 10,
    fontSize: 15,
    color: "#555",
    lineHeight: 20,
  },
  calendarButton: {
    marginTop: 22,
    backgroundColor: "#0B1C3D",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  smallClose: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  smallCloseText: {
    color: "#0B1C3D",
    fontSize: 15,
  },
});

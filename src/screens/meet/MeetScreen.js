import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"

const MOCK_MEETS = [
  {
    id: "1",
    title: "Night meet at the docks",
    subtitle: "Vancouver · 25 mins away",
    meta: "34 going · JDM · Photos"
  },
  {
    id: "2",
    title: "Sunset canyon run",
    subtitle: "Coquitlam · 40 mins away",
    meta: "12 going · Euro · Cruise"
  },
  {
    id: "3",
    title: "Cars and coffee",
    subtitle: "Downtown · 10 mins away",
    meta: "58 going · Mixed · Morning"
  }
]

const FILTERS = ["Today", "This week", "Friends", "Trending"]

export default function MeetScreen() {
  const [activeFilter, setActiveFilter] = useState("Today")
  const navigation = useNavigation()

  function handleOpenSearch() {
    const parentNav = navigation.getParent()
    parentNav?.navigate("MeetSearch")
  }

  function renderCard({ item }) {
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.9}>
        <View style={styles.cardImagePlaceholder} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
          <View style={styles.cardMetaRow}>
            <Ionicons name="people" size={14} color="#6b7280" />
            <Text style={styles.cardMetaText} numberOfLines={1}>
              {item.meta}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        {/* top background and pill button */}
        <View style={styles.topBackground}>
          <TouchableOpacity
            style={styles.searchPill}
            activeOpacity={0.9}
            onPress={handleOpenSearch}
          >
            <Ionicons name="search" size={18} color="#000" />
            <Text style={styles.searchPillText}>Start your search</Text>
          </TouchableOpacity>
        </View>

        {/* filter chips */}
        <View style={styles.filtersRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScrollContent}
          >
            {FILTERS.map(label => {
              const active = label === activeFilter
              return (
                <TouchableOpacity
                  key={label}
                  style={[
                    styles.filterChip,
                    active && styles.filterChipActive
                  ]}
                  onPress={() => setActiveFilter(label)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      active && styles.filterChipTextActive
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {/* list of meet cards */}
        <FlatList
          data={MOCK_MEETS}
          keyExtractor={item => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f3f4f6"
  },
  container: {
    flex: 1
  },
  topBackground: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#f3f4f6"
  },
  searchPill: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2
  },
  searchPillText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500"
  },
  filtersRow: {
    paddingHorizontal: 8,
    paddingBottom: 4,
    backgroundColor: "#fff"
  },
  filtersScrollContent: {
    paddingHorizontal: 8
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 8,
    backgroundColor: "#fff"
  },
  filterChipActive: {
    backgroundColor: "#111827",
    borderColor: "#111827"
  },
  filterChipText: {
    fontSize: 13,
    color: "#4b5563"
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "600"
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    backgroundColor: "#fff"
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: "#e5e7eb"
  },
  cardImagePlaceholder: {
    width: "100%",
    height: 180,
    backgroundColor: "#e5e7eb"
  },
  cardContent: {
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 6
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  cardMetaText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#6b7280"
  }
})
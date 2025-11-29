import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Ionicons } from "@expo/vector-icons";

import SpotTabScreen from "./SpotTabScreen";
import YourFeedScreen from "./YourFeedScreen";

const TopTab = createMaterialTopTabNavigator();

function SpotTopBar({ state, navigation }) {
  const activeIndex = state.index;

  function handlePressTab(targetIndex) {
    const route = state.routes[targetIndex];
    if (!route) return;
    if (activeIndex === targetIndex) return;

    navigation.navigate(route.name);
  }

  function handlePlusPress() {
    const rootNav = navigation.getParent()?.getParent();
    rootNav?.navigate("CreateSpotCamera");
  }

  return (
    <View style={styles.tabBarContainer}>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handlePressTab(0)}
      >
        <Text
          style={[styles.tabLabel, activeIndex === 0 && styles.tabLabelActive]}
        >
          Spots
        </Text>
        {activeIndex === 0 && <View style={styles.indicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.plusButton}
        onPress={handlePlusPress}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={20} color="#ffffff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handlePressTab(1)}
      >
        <Text
          style={[styles.tabLabel, activeIndex === 1 && styles.tabLabelActive]}
        >
          Your Feed
        </Text>
        {activeIndex === 1 && <View style={styles.indicator} />}
      </TouchableOpacity>
    </View>
  );
}

export default function SpotScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <TopTab.Navigator tabBar={(props) => <SpotTopBar {...props} />}>
        <TopTab.Screen name="SpotsTab" component={SpotTabScreen} />
        <TopTab.Screen name="YourFeedTab" component={YourFeedScreen} />
      </TopTab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9ca3af",
  },
  tabLabelActive: {
    color: "#000000",
  },
  indicator: {
    marginTop: 4,
    height: 2,
    width: 32,
    borderRadius: 999,
    backgroundColor: "#000000",
  },
  plusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0B1C3D",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
});

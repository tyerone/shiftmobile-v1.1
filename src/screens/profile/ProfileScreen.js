// src/screens/profile/ProfileScreen.js
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../utils/firebaseConfig";
import { useAuth } from "../../utils/AuthContext";

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [activeTab, setActiveTab] = useState("spots");

  const [spotItems, setSpotItems] = useState([]);
  const [loadingSpots, setLoadingSpots] = useState(true);

  // fetch profile doc
  async function fetchProfile() {
    if (!user) {
      setProfile(null);
      setLoadingProfile(false);
      return;
    }

    try {
      setLoadingProfile(true);
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setProfile(snap.data());
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.log("fetch profile error", err);
    } finally {
      setLoadingProfile(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [user])
  );

  // live spots for this user
  useEffect(() => {
    if (!user) {
      setSpotItems([]);
      setLoadingSpots(false);
      return;
    }

    setLoadingSpots(true);

    const q = query(collection(db, "spots"), where("uid", "==", user.uid));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          imageUrl: docSnap.data().imageUrl,
        }));
        setSpotItems(list);
        setLoadingSpots(false);
      },
      (err) => {
        console.log("profile spots error", err);
        setLoadingSpots(false);
      }
    );

    return () => unsub();
  }, [user]);

  const derivedSpotsCount = spotItems.length;
  const spotsCount = derivedSpotsCount || profile?.spotsCount || 0;
  const buildsCount = profile?.buildsCount ?? 0;

  const spotsData = spotItems;
  const buildsData = Array.from({ length: buildsCount }, (_, i) => ({
    id: `build-${i}`,
  }));

  const data = activeTab === "spots" ? spotsData : buildsData;

  function renderGridItem({ item }) {
    if (activeTab === "spots") {
      return (
        <View style={styles.gridItem}>
          <Image source={{ uri: item.imageUrl }} style={styles.gridImage} />
        </View>
      );
    }

    return <View style={styles.gridItem} />;
  }

  function handleEditProfilePress() {
    navigation.navigate("EditProfile");
  }

  function handleOpenSettings() {
    const parent = navigation.getParent();
    parent?.navigate("Settings");
  }

  function handleGoToActiveTab() {
    const parent = navigation.getParent();
    const target = activeTab === "spots" ? "SpotStack" : "Build";
    parent?.navigate(target);
  }

  const displayName = profile?.name || "Name";
  const username = profile?.username || "username";
  const bio = profile?.bio || "";
  const email = profile?.email || user?.email || "";

  const isLoadingAny =
    loadingProfile || (activeTab === "spots" && loadingSpots);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.usernameTitle}>{username}</Text>
          <TouchableOpacity
            style={styles.topBarIcon}
            onPress={handleOpenSettings}
          >
            <Ionicons name="settings-outline" size={22} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerRow}>
          {profile?.profileImage ? (
            <Image
              source={{ uri: profile.profileImage }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatar} />
          )}

          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statNumber}>{spotsCount}</Text>
              <Text style={styles.statLabel}>Spots</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statNumber}>{buildsCount}</Text>
              <Text style={styles.statLabel}>Builds</Text>
            </View>
          </View>
        </View>

        <View style={styles.bioSection}>
          {loadingProfile ? (
            <ActivityIndicator />
          ) : (
            <>
              <Text style={styles.nameText}>{displayName}</Text>
              {bio ? <Text style={styles.bioText}>{bio}</Text> : null}
              {email ? <Text style={styles.emailText}>{email}</Text> : null}
            </>
          )}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleEditProfilePress}
          >
            <Text style={styles.buttonText}>Edit profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "spots" && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab("spots")}
          >
            <Ionicons
              name="eye"
              size={18}
              color={activeTab === "spots" ? "#000" : "#9ca3af"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "builds" && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab("builds")}
          >
            <Ionicons
              name="construct"
              size={18}
              color={activeTab === "builds" ? "#000" : "#9ca3af"}
            />
          </TouchableOpacity>
        </View>

        {isLoadingAny ? (
          <View style={styles.emptyWrap}>
            <ActivityIndicator />
          </View>
        ) : data.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>
              {activeTab === "spots"
                ? "You have no Spots yet."
                : "You have no Builds yet."}
            </Text>

            <TouchableOpacity onPress={handleGoToActiveTab}>
              <Text style={styles.emptyLink}>
                {activeTab === "spots" ? "Go to Spots" : "Go to Builds"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            numColumns={3}
            renderItem={renderGridItem}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  usernameTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
  },
  topBarIcon: {
    paddingLeft: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e5e7eb",
    marginRight: 24,
  },
  statsRow: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-around",
  },
  statBlock: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  bioSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  nameText: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  bioText: {
    fontSize: 14,
    color: "#374151",
  },
  emailText: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  button: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tabsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  tabItemActive: {
    borderBottomWidth: 1.5,
    borderColor: "#000",
  },
  gridContent: {
    paddingTop: 4,
    paddingBottom: 24,
    paddingHorizontal: 1,
  },
  gridRow: {
    // keep empty, flex layout handles spacing
  },
  gridItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 1,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  emptyWrap: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#6b7280",
    marginBottom: 8,
  },
  emptyLink: {
    fontSize: 15,
    color: "#2563eb",
    fontWeight: "600",
  },
});

// src/screens/spot/SpotTabScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import {
  collection,
  query,
  orderBy,
  where,
  limit,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../utils/firebaseConfig";
import { useAuth } from "../../utils/AuthContext";

function SpotRowSection({ title, loading, data }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {loading ? (
        <View style={styles.sectionLoading}>
          <ActivityIndicator />
        </View>
      ) : data.length === 0 ? (
        <Text style={styles.sectionEmpty}>No spots yet.</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SpotCard spot={item} />}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsRow}
        />
      )}
    </View>
  );
}

function SpotCard({ spot }) {
  const title =
    spot.brand && spot.modelGuess
      ? `${spot.brand} ${spot.modelGuess}`
      : spot.brand || "Car";

  return (
    <View style={styles.card}>
      {spot.imageUrl ? (
        <Image source={{ uri: spot.imageUrl }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
      )}

      <Text numberOfLines={1} style={styles.cardTitle}>
        {title}
      </Text>
    </View>
  );
}

export default function SpotTabScreen() {
  const { user } = useAuth();

  const [recentSpots, setRecentSpots] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const [savedSpots, setSavedSpots] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  const [yourSpots, setYourSpots] = useState([]);
  const [loadingYourSpots, setLoadingYourSpots] = useState(true);

  // Recent (global)
  useEffect(() => {
    const qRecent = query(
      collection(db, "spots"),
      orderBy("createdAt", "desc"),
      limit(12)
    );

    const unsub = onSnapshot(
      qRecent,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRecentSpots(list);
        setLoadingRecent(false);
      },
      (err) => {
        console.log("recent spots error", err);
        setLoadingRecent(false);
      }
    );

    return () => unsub();
  }, []);

  // Your spots
  useEffect(() => {
    if (!user) {
      setYourSpots([]);
      setLoadingYourSpots(false);
      return;
    }

    const qUser = query(
      collection(db, "spots"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(12)
    );

    const unsub = onSnapshot(
      qUser,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setYourSpots(list);
        setLoadingYourSpots(false);
      },
      (err) => {
        console.log("your spots error", err);
        setLoadingYourSpots(false);
      }
    );

    return () => unsub();
  }, [user]);

  // Saved spots
  useEffect(() => {
    async function loadSaved(ids) {
      if (!ids || ids.length === 0) {
        setSavedSpots([]);
        setLoadingSaved(false);
        return;
      }

      try {
        const snaps = await Promise.all(
          ids.map((id) => getDoc(doc(db, "spots", id)))
        );
        const list = snaps
          .filter((s) => s.exists())
          .map((s) => ({ id: s.id, ...s.data() }));
        setSavedSpots(list);
      } catch (err) {
        console.log("saved error", err);
      } finally {
        setLoadingSaved(false);
      }
    }

    if (!user) {
      setSavedSpots([]);
      setLoadingSaved(false);
      return;
    }

    setLoadingSaved(true);

    const userRef = doc(db, "users", user.uid);
    const unsub = onSnapshot(
      userRef,
      (snap) => {
        if (!snap.exists()) {
          setSavedSpots([]);
          setLoadingSaved(false);
          return;
        }
        const ids = snap.data().savedSpots || [];
        loadSaved(ids);
      },
      (err) => {
        console.log("saved user error", err);
        setLoadingSaved(false);
      }
    );

    return () => unsub();
  }, [user]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SpotRowSection
          title="Recent spots"
          loading={loadingRecent}
          data={recentSpots}
        />

        <SpotRowSection
          title="Saved spots"
          loading={loadingSaved}
          data={savedSpots}
        />

        <SpotRowSection
          title="Your spots"
          loading={loadingYourSpots}
          data={yourSpots}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 8, paddingBottom: 24 },

  section: { marginTop: 12 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 20,
    marginBottom: 8,
  },
  sectionLoading: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionEmpty: {
    marginHorizontal: 20,
    fontSize: 14,
    color: "#9ca3af",
  },

  cardsRow: {
    paddingHorizontal: 20,
  },

  card: {
    width: 140,
    marginRight: 12,
  },

  cardImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
});

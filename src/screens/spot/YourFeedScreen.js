// src/screens/spot/YourFeedScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  increment,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../../utils/firebaseConfig";
import { useAuth } from "../../utils/AuthContext";

export default function YourFeedScreen() {
  const { user } = useAuth();

  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState([]);

  // feed spots
  useEffect(() => {
    const q = query(collection(db, "spots"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setSpots(list);
        setLoading(false);
      },
      (err) => {
        console.log("feed spots error", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // saved spots for user
  useEffect(() => {
    if (!user) {
      setSavedIds([]);
      return;
    }

    const userRef = doc(db, "users", user.uid);

    const unsub = onSnapshot(
      userRef,
      (snap) => {
        if (!snap.exists()) {
          setSavedIds([]);
          return;
        }
        const data = snap.data();
        const saved = Array.isArray(data.savedSpots) ? data.savedSpots : [];
        setSavedIds(saved);
      },
      (err) => {
        console.log("user savedSpots error", err);
      }
    );

    return () => unsub();
  }, [user]);

  function handleMorePress(spot) {
    if (!user) return;

    const isOwner = spot.uid === user.uid;
    if (!isOwner) return;

    Alert.alert("Spot options", "Do you want to delete this spot", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => confirmDeleteSpot(spot),
      },
    ]);
  }

  async function confirmDeleteSpot(spot) {
    try {
      const imgRef = ref(storage, `spots/${spot.uid}/${spot.id}.jpg`);
      deleteObject(imgRef).catch((err) => {
        console.log("delete storage error", err);
      });

      const spotRef = doc(db, "spots", spot.id);
      await deleteDoc(spotRef);

      const userRef = doc(db, "users", spot.uid);
      await updateDoc(userRef, {
        spotsCount: increment(-1),
        spots: arrayRemove(spot.id),
      });
    } catch (err) {
      console.log("delete spot error", err);
      Alert.alert("Error", "Failed to delete spot");
    }
  }

  async function handleToggleSave(spot) {
    if (!user) {
      Alert.alert("Not logged in", "You must be logged in to save spots.");
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const isSaved = savedIds.includes(spot.id);

      if (isSaved) {
        await updateDoc(userRef, {
          savedSpots: arrayRemove(spot.id),
        });
      } else {
        await updateDoc(userRef, {
          savedSpots: arrayUnion(spot.id),
        });
      }
    } catch (err) {
      console.log("toggle save error", err);
      Alert.alert("Error", "Could not update saved state.");
    }
  }

  function renderSpot({ item }) {
    const isOwner = user && item.uid === user.uid;
    const isSaved = user && savedIds.includes(item.id);

    return (
      <View style={styles.card}>
        {/* header */}
        <View style={styles.cardHeader}>
          <View style={styles.avatar} />
          <View style={styles.headerTextWrap}>
            <Text style={styles.usernameText}>{item.username || "user"}</Text>
            <Text style={styles.subText}>
              {item.brand && item.modelGuess
                ? `${item.brand} · ${item.modelGuess}`
                : item.brand || ""}
            </Text>
          </View>

          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => {
              if (isOwner) {
                handleMorePress(item);
              }
            }}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color={isOwner ? "#111827" : "#d1d5db"}
            />
          </TouchableOpacity>
        </View>

        {/* image */}
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
        )}

        {/* tags + save inline */}
        <View style={styles.inlineRow}>
          <View style={styles.tagsInlineWrap}>
            {Array.isArray(item.tags) &&
              item.tags.length > 0 &&
              item.tags.slice(0, 4).map((tag) => (
                <View key={`${item.id}-${tag}`} style={styles.tagChip}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
          </View>

          <TouchableOpacity
            onPress={() => handleToggleSave(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={22}
              color="#111827"
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (spots.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>No spots in the feed yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={spots}
        keyExtractor={(item) => item.id}
        renderItem={renderSpot}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  listContent: {
    paddingBottom: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#6b7280",
  },
  card: {
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
    marginRight: 10,
  },
  headerTextWrap: {
    flex: 1,
  },
  usernameText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  subText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 1,
  },
  cardImage: {
    width: "100%",
    aspectRatio: 3 / 4,
    backgroundColor: "#000",
  },
  cardImagePlaceholder: {
    backgroundColor: "#e5e7eb",
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tagsInlineWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    flex: 1,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: "#374151",
  },
});

// src/screens/spot/NewSpotScreen.js
import "react-native-get-random-values"
import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRoute, useNavigation } from "@react-navigation/native"
import * as FileSystem from "expo-file-system/legacy"
import { v4 as uuidv4 } from "uuid"
import { useAuth } from "../../utils/AuthContext"
import { db, storage } from "../../utils/firebaseConfig"
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  increment,
  arrayUnion
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

const BACKEND_URL = "http://192.168.1.92:4000/analyze-spot"

export default function NewSpotScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const { user } = useAuth()
  const { photoUri } = route.params || {}

  const [tags, setTags] = useState([])
  const [analysisInfo, setAnalysisInfo] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (photoUri) {
      analyzeImage()
    }
  }, [photoUri])

  async function analyzeImage() {
    try {
      setAnalyzing(true)

      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: "base64"
      })

      if (!base64) {
        console.log("ANALYZE ERROR: empty base64 from FileSystem")
        return
      }

      console.log("SENDING TO BACKEND")
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 })
      })

      const json = await res.json()
      console.log("BACKEND RESPONSE:", json)

      if (json.error) {
        console.log("ANALYZE ERROR:", json.error)
        return
      }

      setTags(Array.isArray(json.tags) ? json.tags : [])
      setAnalysisInfo(json)
    } catch (err) {
      console.log("ANALYZE ERROR:", err)
    } finally {
      setAnalyzing(false)
    }
  }

  function handleCancel() {
    navigation.goBack()
  }

  async function handleShare() {
    if (!user) {
      Alert.alert("Not logged in", "You must be logged in to do that!")
      return
    }

    if (!photoUri) {
      Alert.alert("No photo", "Take a photo first.")
      return
    }

    // NEW: block share if analysis not done yet
    if (!analysisInfo) {
      Alert.alert(
        "Please wait",
        "Photo analysis is still running. Wait for tags to appear."
      )
      return
    }

    // NEW: block share if this is not a vehicle
    if (analysisInfo.isVehicle === false) {
      Alert.alert(
        "Not a car",
        "This photo does not appear to be a vehicle. Retake the photo and try again."
      )
      return
    }

    try {
      setUploading(true)

      let username = user.displayName || user.email?.split("@")[0] || "Unknown"
      try {
        const userRef = doc(db, "users", user.uid)
        const snap = await getDoc(userRef)
        if (snap.exists()) {
          const data = snap.data()
          if (data.username) {
            username = data.username
          }
        }
      } catch (err) {
        console.log("username fetch error", err)
      }

      const spotId = uuidv4()

      const response = await fetch(photoUri)
      const blob = await response.blob()

      const imageRef = ref(storage, `spots/${user.uid}/${spotId}.jpg`)
      await uploadBytes(imageRef, blob)
      const downloadUrl = await getDownloadURL(imageRef)

      const payload = {
        uid: user.uid,
        username,
        imageUrl: downloadUrl,
        tags,
        isVehicle: analysisInfo?.isVehicle ?? null,
        vehicleType: analysisInfo?.vehicleType ?? null,
        brand: analysisInfo?.brand ?? null,
        modelGuess: analysisInfo?.modelGuess ?? null,
        modLevel: analysisInfo?.modLevel ?? null,
        createdAt: serverTimestamp()
      }

      await setDoc(doc(db, "spots", spotId), payload)

      const userRef = doc(db, "users", user.uid)
      await setDoc(
        userRef,
        {
          spotsCount: increment(1),
          spots: arrayUnion(spotId)
        },
        { merge: true }
      )

      Alert.alert("Shared", "Your spot is live.")
      navigation.goBack()
    } catch (err) {
      console.log("UPLOAD ERROR:", err)
      Alert.alert("Error", "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.headerButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New spot</Text>
        <TouchableOpacity onPress={handleShare} disabled={uploading}>
          <Text style={styles.headerButton}>
            {uploading ? "Sharing..." : "Share"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.previewWrap}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.previewLarge} />
          ) : (
            <View style={styles.previewPlaceholder} />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Tags</Text>
          {analyzing ? (
            <View style={styles.tagsLoadingRow}>
              <ActivityIndicator size="small" />
              <Text style={styles.tagsLoadingText}>Analyzing photo...</Text>
            </View>
          ) : tags.length === 0 ? (
            <View style={styles.tagsRow}>
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>Insert Tags</Text>
              </View>
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>Insert Tags</Text>
              </View>
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>Insert Tags</Text>
              </View>
            </View>
          ) : (
            <View style={styles.tagsRow}>
              {tags.map(tag => (
                <View key={tag} style={styles.tagPill}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb"
  },
  headerButton: {
    fontSize: 15,
    color: "#2563eb",
    fontWeight: "600"
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600"
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 24
  },
  previewWrap: {
    width: "100%",
    backgroundColor: "#000"
  },
  previewLarge: {
    width: "100%",
    aspectRatio: 3 / 4
  },
  previewPlaceholder: {
    width: "100%",
    aspectRatio: 3 / 4,
    backgroundColor: "#e5e7eb"
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb"
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  tagPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    marginRight: 8,
    marginBottom: 6
  },
  tagText: {
    fontSize: 13,
    color: "#4b5563"
  },
  tagsLoadingRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  tagsLoadingText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#6b7280"
  }
})
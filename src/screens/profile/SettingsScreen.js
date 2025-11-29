import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "../../utils/AuthContext"
import { db, storage } from "../../utils/firebaseConfig"
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc
} from "firebase/firestore"
import { ref, deleteObject } from "firebase/storage"

export default function SettingsScreen() {
  const navigation = useNavigation()
  const { user, logout } = useAuth()

  const [resetting, setResetting] = useState(false)

  async function handleLogout() {
    try {
      await logout()
      navigation.reset({
        index: 0,
        routes: [{ name: "RootTabs" }]
      })
    } catch (err) {
      console.log("logout error", err)
      Alert.alert("Error", "Log out failed")
    }
  }

  function confirmResetSpots() {
    if (!user) {
      Alert.alert("Not logged in", "You must be logged in to do that")
      return
    }

    Alert.alert(
      "Reset spots",
      "This will remove all your spots and reset your count.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: doResetSpots }
      ]
    )
  }

  async function doResetSpots() {
    if (!user) return

    try {
      setResetting(true)

      const q = query(
        collection(db, "spots"),
        where("uid", "==", user.uid)
      )
      const snapshot = await getDocs(q)

      const tasks = []

      snapshot.forEach(docSnap => {
        const spotId = docSnap.id

        const storageRef = ref(storage, `spots/${user.uid}/${spotId}.jpg`)
        tasks.push(
          deleteObject(storageRef).catch(err => {
            console.log("delete storage error", err)
          })
        )

        tasks.push(
          docSnap.ref.delete().catch(err => {
            console.log("delete doc error", err)
          })
        )
      })

      await Promise.all(tasks)

      const userRef = doc(db, "users", user.uid)
      await setDoc(
        userRef,
        {
          spotsCount: 0,
          spots: []
        },
        { merge: true }
      )

      Alert.alert("Done", "All your spots were cleared.")
    } catch (err) {
      console.log("reset spots error", err)
      Alert.alert("Error", "Reset failed")
    } finally {
      setResetting(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.row}
            onPress={confirmResetSpots}
            disabled={resetting}
          >
            <Text style={[styles.rowLabel, { color: "#b91c1c" }]}>
              Reset my spots (dev)
            </Text>
          </TouchableOpacity>

          {resetting && (
            <View style={styles.row}>
              <ActivityIndicator size="small" />
              <Text style={styles.resettingText}>Resetting…</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.row, styles.logoutRow]}
            onPress={handleLogout}
            disabled={resetting}
          >
            <Text style={[styles.rowLabel, styles.logoutText]}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff"
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8
  },
  row: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center"
  },
  rowLabel: {
    fontSize: 15
  },
  logoutRow: {
    marginTop: 12,
    borderBottomWidth: 0
  },
  logoutText: {
    color: "#b91c1c",
    fontWeight: "600"
  },
  resettingText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#6b7280"
  }
})
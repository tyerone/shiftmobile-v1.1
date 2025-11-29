import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../../utils/firebaseConfig"
import { useAuth } from "../../utils/AuthContext"

export default function EditProfileScreen() {
  const navigation = useNavigation()
  const { user } = useAuth()

  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [website, setWebsite] = useState("")
  const [bio, setBio] = useState("")
  const [email, setEmail] = useState("")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const ref = doc(db, "users", user.uid)
        const snap = await getDoc(ref)

        if (snap.exists()) {
          const data = snap.data()
          setName(data.name || "")
          setUsername(data.username || "")
          setWebsite(data.website || "")
          setBio(data.bio || "")
          setEmail(data.email || user.email || "")
        } else {
          setName(user.displayName || "")
          setUsername("")
          setWebsite("")
          setBio("")
          setEmail(user.email || "")
        }
      } catch (err) {
        console.log("load profile error", err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user])

  async function handleSave() {
    if (!user) return

    try {
      setSaving(true)

      const ref = doc(db, "users", user.uid)

      await setDoc(
        ref,
        {
          name: name.trim(),
          username: username.trim(),
          website: website.trim(),
          bio: bio.trim(),
          email: email.trim(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      )

      navigation.goBack()
    } catch (err) {
      console.log("save profile error", err)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.photoSection}>
          <View style={styles.avatar} />
          <TouchableOpacity>
            <Text style={styles.changePhotoText}>Edit picture</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="username"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              placeholder="Website"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              value={website}
              onChangeText={setWebsite}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Bio"
              placeholderTextColor="#9ca3af"
              multiline
              value={bio}
              onChangeText={setBio}
            />
          </View>

          <View style={styles.sectionLabelWrap}>
            <Text style={styles.sectionLabel}>Private information</Text>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff"
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  photoSection: {
    alignItems: "center",
    marginBottom: 24
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#e5e7eb",
    marginBottom: 8
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3b82f6"
  },
  formSection: {
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 16
  },
  fieldBlock: {
    marginBottom: 16
  },
  label: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4
  },
  input: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#d1d5db",
    paddingVertical: 8,
    fontSize: 14
  },
  bioInput: {
    height: 72,
    textAlignVertical: "top"
  },
  sectionLabelWrap: {
    marginTop: 8,
    marginBottom: 4
  },
  sectionLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600"
  },
  saveButton: {
    marginTop: 24,
    borderRadius: 8,
    backgroundColor: "#111827",
    paddingVertical: 12,
    alignItems: "center"
  },
  saveButtonDisabled: {
    opacity: 0.7
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15
  }
})
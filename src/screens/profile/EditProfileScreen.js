import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../utils/firebaseConfig";
import { useAuth } from "../../utils/AuthContext";

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  // --- Fake icons for now (replace with your actual images)
  const iconOptions = [
    {
      uri: "https://media.formula1.com/image/upload/t_16by9North/c_lfill,w_3392/q_auto/v1740000000/fom-website/manual/Hall%20of%20Fame%202024/GettyImages-927907236.webp",
    },
    {
      uri: "https://i.pinimg.com/474x/67/43/6b/67436b8d9e69d1c76923ffd359d0f3bd.jpg",
    },
    {
      uri: "https://media.cnn.com/api/v1/images/stellar/prod/211120064531-lewis-hamilton-qatar-rainbow-helmet-1119-restricted.jpg?q=x_3,y_76,h_1504,w_2673,c_crop/h_833,w_1480",
    },
    {
      uri: "https://hips.hearstapps.com/hmg-prod/images/race-winner-max-verstappen-of-the-netherlands-and-oracle-news-photo-1677429396.jpg?crop=0.670xw:1.00xh;0,0&resize=1200:*",
    },
    {
      uri: "https://cdn.myportfolio.com/eb190473-8c70-4eff-9134-fcdf80d8a2ca/ef978e34-6de9-4a2b-969c-f8950d66a9f5_rw_1920.jpg?h=4a15aa480b200726b22c1820f421c6ad",
    },
    {
      uri: "https://cdn.myportfolio.com/eb190473-8c70-4eff-9134-fcdf80d8a2ca/7d5096f0-8e55-40c7-944c-30e702769e04_rw_1920.jpg?h=cf0d48bbdb8a997b66670a4235e98ef7",
    },
    {
      uri: "https://4kwallpapers.com/images/wallpapers/mazda-rx-7-jdm-cars-2880x1800-14648.jpg",
    },
    {
      uri: "https://www.hdwallpapers.in/download/miata_jdm_car_4k_hd_jdm-3840x2160.jpg",
    },
  ];

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || "");
          setUsername(data.username || "");
          setWebsite(data.website || "");
          setBio(data.bio || "");
          setEmail(data.email || user.email || "");
          setProfileImage(data.profileImage || ""); // ← load image
        } else {
          setName(user.displayName || "");
          setEmail(user.email || "");
        }
      } catch (err) {
        console.log("load profile error", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  async function handleSave() {
    if (!user) return;

    try {
      setSaving(true);

      const ref = doc(db, "users", user.uid);

      await setDoc(
        ref,
        {
          name: name.trim(),
          username: username.trim(),
          website: website.trim(),
          bio: bio.trim(),
          email: email.trim(),
          profileImage: profileImage || "", // ← save selected image
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      navigation.goBack();
    } catch (err) {
      console.log("save profile error", err);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          {profileImage ? (
            <Image source={profileImage} style={styles.avatar} />
          ) : (
            <View style={styles.avatar} />
          )}

          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.changePhotoText}>Edit picture</Text>
          </TouchableOpacity>
        </View>

        {/* Modal for Icon Picker */}
        <Modal animationType="slide" transparent visible={modalVisible}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Choose an Icon</Text>

              <View style={styles.iconGrid}>
                {iconOptions.map((img, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setProfileImage(img);
                      setModalVisible(false);
                    }}
                  >
                    <Image source={img} style={styles.iconOption} />
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Form */}
        <View style={styles.formSection}>
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Name"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholder="username"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={website}
              onChangeText={setWebsite}
              autoCapitalize="none"
              placeholder="Website"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Bio"
              placeholderTextColor="#9ca3af"
              multiline
            />
          </View>

          <View style={styles.sectionLabelWrap}>
            <Text style={styles.sectionLabel}>Private information</Text>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email"
              placeholderTextColor="#9ca3af"
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
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  photoSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#e5e7eb",
    marginBottom: 8,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3b82f6",
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  iconOption: {
    width: 70,
    height: 70,
    margin: 10,
    borderRadius: 35,
    backgroundColor: "#eee",
  },
  modalCloseBtn: {
    marginTop: 16,
    alignItems: "center",
  },
  modalCloseText: {
    color: "#3b82f6",
    fontSize: 14,
    fontWeight: "600",
  },

  /* Form */
  formSection: {
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 16,
  },
  fieldBlock: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  input: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#d1d5db",
    paddingVertical: 8,
    fontSize: 14,
  },
  bioInput: {
    height: 72,
    textAlignVertical: "top",
  },
  sectionLabelWrap: {
    marginTop: 8,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },

  /* Save button */
  saveButton: {
    marginTop: 24,
    borderRadius: 8,
    backgroundColor: "#111827",
    paddingVertical: 12,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});

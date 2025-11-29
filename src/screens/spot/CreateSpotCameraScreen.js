import React, { useRef, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { CameraView, useCameraPermissions } from "expo-camera"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"

export default function CreateSpotCameraScreen() {
  const navigation = useNavigation()
  const cameraRef = useRef(null)

  const [facing, setFacing] = useState("back")
  const [permission, requestPermission] = useCameraPermissions()
  const [capturing, setCapturing] = useState(false)
  const [photoUri, setPhotoUri] = useState(null)

  if (!permission) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    )
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.permissionTitle}>Camera access needed</Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Allow camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  function toggleFacing() {
    setFacing(current => (current === "back" ? "front" : "back"))
  }

  async function handleTakePicture() {
    if (!cameraRef.current || capturing) return

    try {
      setCapturing(true)
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.8
      })
      setPhotoUri(result?.uri ?? null)
    } catch (err) {
      console.log("take picture error", err)
    } finally {
      setCapturing(false)
    }
  }

  function handleRetake() {
    setPhotoUri(null)
  }

  function handleCancel() {
    if (photoUri) {
      setPhotoUri(null)
      return
    }
    navigation.goBack()
  }

  function handleNext() {
    if (!photoUri) return
    navigation.navigate("NewSpot", { photoUri })
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        {/* header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerIcon}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New spot</Text>
          <View style={styles.headerIcon} />
        </View>

        {/* camera or preview */}
        <View style={styles.cameraWrap}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.preview} />
          ) : (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
            />
          )}
        </View>

        {/* controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={toggleFacing}
            style={styles.smallButton}
            disabled={!!photoUri}
          >
            <Ionicons
              name="sync"
              size={22}
              color={photoUri ? "#555" : "#fff"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={photoUri ? handleRetake : handleTakePicture}
            style={styles.shutterOuter}
            activeOpacity={0.8}
          >
            {capturing ? (
              <ActivityIndicator color="#000" />
            ) : (
              <View style={styles.shutterInner} />
            )}
          </TouchableOpacity>

          {photoUri ? (
            <TouchableOpacity
              onPress={handleNext}
              style={styles.nextButton}
              activeOpacity={0.8}
            >
              <Text style={styles.nextText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.smallButton} />
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#000"
  },
  root: {
    flex: 1,
    backgroundColor: "#000"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8
  },
  headerIcon: {
    width: 40,
    alignItems: "flex-start"
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },
  cameraWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  camera: {
    width: "100%",
    aspectRatio: 3 / 4
  },
  preview: {
    width: "100%",
    aspectRatio: 3 / 4
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 32,
    paddingVertical: 18
  },
  smallButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
  shutterInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fff"
  },
  nextButton: {
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  nextText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600"
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#fff"
  },
  permissionButton: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#111827"
  },
  permissionButtonText: {
    color: "#fff",
    fontWeight: "600"
  }
})
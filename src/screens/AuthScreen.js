import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../utils/firebaseConfig";

export default function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>
          {mode === "login" ? "Log in" : "Create account"}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>
            {mode === "login" ? "Log in" : "Sign up"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchRow}
          onPress={() =>
            setMode((prev) => (prev === "login" ? "register" : "login"))
          }
        >
          <Text style={styles.switchText}>
            {mode === "login"
              ? "Need an account? Sign up"
              : "Have an account? Log in"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 64 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 24 },
  input: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#d1d5db",
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 20,
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: "#0B1C3D",
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  error: {
    color: "#ef4444",
    fontSize: 13,
    marginBottom: 8,
  },
  switchRow: {
    marginTop: 16,
    alignItems: "center",
  },
  switchText: {
    fontSize: 13,
    color: "#2563eb",
  },
});

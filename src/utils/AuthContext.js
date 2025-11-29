import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from "react"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth"
import { auth, db } from "./firebaseConfig"
import { doc, setDoc, getDoc } from "firebase/firestore"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async fbUser => {
      if (!fbUser) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const userRef = doc(db, "users", fbUser.uid)
        const snap = await getDoc(userRef)

        if (!snap.exists()) {
          await setDoc(
            userRef,
            {
              email: fbUser.email || "",
              name: fbUser.displayName || "",
              username: fbUser.email
                ? fbUser.email.split("@")[0]
                : "",
              bio: "",
              spotsCount: 0,
              buildsCount: 0,
              spots: [],
              builds: []
            },
            { merge: true }
          )
        }
      } catch (err) {
        console.log("auth user doc ensure error", err)
      }

      setUser(fbUser)
      setLoading(false)
    })

    return () => unsub()
  }, [])

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  }

  async function register(email, password, name) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)

    if (name) {
      try {
        await updateProfile(cred.user, { displayName: name })
      } catch (err) {
        console.log("updateProfile error", err)
      }
    }

    const userRef = doc(db, "users", cred.user.uid)
    await setDoc(
      userRef,
      {
        email,
        name: name || "",
        username: email.split("@")[0],
        bio: "",
        spotsCount: 0,
        buildsCount: 0,
        spots: [],
        builds: []
      },
      { merge: true }
    )

    return cred.user
  }

  async function logout() {
    await signOut(auth)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
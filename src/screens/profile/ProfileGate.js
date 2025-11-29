import React from "react";
import ProfileScreen from "./ProfileScreen";
import AuthScreen from "../AuthScreen";
import { useAuth } from "../../utils/AuthContext";

export default function ProfileGate() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <AuthScreen />;

  return <ProfileScreen />;
}

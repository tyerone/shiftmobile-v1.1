import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import MeetScreen from "./src/screens/meet/MeetScreen";
import MeetSearchScreen from "./src/screens/meet/MeetSearchScreen";
import MeetResultsScreen from "./src/screens/meet/MeetResultsScreen";

import SpotScreen from "./src/screens/spot/SpotScreen";
import CreateSpotCameraScreen from "./src/screens/spot/CreateSpotCameraScreen";
import NewSpotScreen from "./src/screens/spot/NewSpotScreen";

import BuildScreen from "./src/screens/BuildScreen";

import ProfileGate from "./src/screens/profile/ProfileGate";
import EditProfileScreen from "./src/screens/profile/EditProfileScreen";
import SettingsScreen from "./src/screens/profile/SettingsScreen";

import { AuthProvider } from "./src/utils/AuthContext";
import { ThemeProvider, useTheme } from "./src/utils/ThemeContext";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme === "dark" ? "#ffffff" : "#000000",
        tabBarInactiveTintColor: "#8e8e8e",
        tabBarStyle: {
          backgroundColor: theme === "dark" ? "#000000" : "#ffffff",
          borderTopWidth: 0,
          elevation: 0,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarIcon: ({ focused }) => {
          let iconName = "ellipse";

          if (route.name === "Meet") iconName = "location";
          if (route.name === "SpotStack") iconName = "eye";
          if (route.name === "Build") iconName = "construct";
          if (route.name === "ProfileTab") iconName = "person";

          const color =
            focused && theme === "dark"
              ? "#ffffff"
              : focused
              ? "#000000"
              : "#8e8e8e";

          return <Ionicons name={iconName} size={26} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Meet" component={MeetScreen} />
      <Tab.Screen
        name="SpotStack"
        component={SpotScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Build" component={BuildScreen} />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileGate}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="RootTabs"
              component={MainTabs}
              options={{
                headerShown: false,
                title: "",
                headerBackTitle: "",
                headerBackTitleVisible: false,
              }}
            />

            {/* Meet search popup */}
            <Stack.Screen
              name="MeetSearch"
              component={MeetSearchScreen}
              options={{
                headerShown: false,
                presentation: "transparentModal",
                animation: "fade",
              }}
            />

            {/* Meet results map */}
            <Stack.Screen
              name="MeetResults"
              component={MeetResultsScreen}
              options={{
                headerShown: false,
              }}
            />

            {/* Spot flow */}
            <Stack.Screen
              name="CreateSpotCamera"
              component={CreateSpotCameraScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="NewSpot"
              component={NewSpotScreen}
              options={{
                headerShown: false,
              }}
            />

            {/* Profile flow */}
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{
                title: "Edit profile",
                headerBackTitle: "",
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                title: "Settings",
                headerBackTitle: "",
                headerBackTitleVisible: false,
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </AuthProvider>
  );
}

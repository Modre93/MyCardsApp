import { Stack } from "expo-router";
import { useAuth } from "../../provider/AuthProvider";
import React from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Simple stack layout within the authenticated area
const StackLayout = () => {
  const { signOut } = useAuth();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#f5f5f5",
        },
        headerTintColor: "#000",
      }}
    >
      <Stack.Screen
        name="list"
        options={{
          headerTitle: "My Files",
          headerRight: () => (
            <TouchableOpacity onPress={signOut}>
              <Ionicons name="log-out-outline" size={30} color={"#000"} />
            </TouchableOpacity>
          ),
        }}
      ></Stack.Screen>
    </Stack>
  );
};

export default StackLayout;

import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../provider/AuthProvider";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { View, Text } from "react-native";
import Toast from "react-native-toast-message";

// Prevents the app from rendering until the auth state is initialized
SplashScreen.preventAutoHideAsync();

// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

// Makes sure the user is authenticated before accessing protected pages
const InitialLayout = () => {
  const { session, initialized, sID } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;

    // Check if the path/url is in the (auth) group
    const inAuthGroup = segments[0] === "(auth)";

    if (session && !inAuthGroup) {
      // Redirect authenticated users to the list page
      router.replace("/list");
    } else if (!session && sID) {
      // Redirect unauthenticated but  student users to the form page
      router.replace("/form");
    } else if (!session && !sID) {
      // Redirect unauthenticated and no student users to the login page
      router.replace("/");
    }
  }, [session, initialized, sID]);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (e) {
        console.warn(e);
      } finally {
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  return (
    <>
      <StatusBar style="dark" backgroundColor="#f5f5f5" />
      <Slot />
      <View
        style={{
          alignItems: "center",
          padding: 10,
          backgroundColor: "#f5f5f5",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#888888", fontSize: 17 }}>©</Text>
        <Text style={{ color: "#888888" }}> CleverTech</Text>
      </View>
      <Toast />
    </>
  );
};

// Wrap the app with the AuthProvider
const RootLayout = () => {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
};

export default RootLayout;

import {
  Alert,
  View,
  Button,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useState } from "react";
import React from "react";
import Spinner from "react-native-loading-spinner-overlay";
import { supabase } from "../utils/supabase";
import { useAuth } from "../provider/AuthProvider";
import { useRouter } from "expo-router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [code, setCode] = useState("");
  const { setSID } = useAuth();
  const router = useRouter();

  // Sign in with email and password
  const onSignInPress = async () => {
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  };

  const onSignAsStudentPress = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("etablissements")
      .select("id, name, type")
      .eq("code", code);
    if (error) {
      alert(error.message);
    } else {
      // Save the school ID
      if (setSID) setSID(data[0].id);
      router.replace("/form");
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Spinner visible={loading} />

      <Text style={styles.header}>My CARDS App</Text>
      {isStudent ? (
        <TextInput
          value={code}
          placeholder="CODE"
          onChangeText={setCode}
          style={styles.inputField}
        />
      ) : (
        <>
          <TextInput
            autoCapitalize="none"
            placeholder="john@doe.com"
            value={email}
            onChangeText={setEmail}
            style={styles.inputField}
          />
          <TextInput
            placeholder="password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.inputField}
          />
        </>
      )}

      <TouchableOpacity
        onPress={isStudent ? onSignAsStudentPress : onSignInPress}
        style={styles.button}
      >
        <Text style={{ color: "#fff" }}>Sign in</Text>
      </TouchableOpacity>
      <Pressable onPress={() => setIsStudent(!isStudent)}>
        <Text style={{ color: "#2b825b" }}>
          {!isStudent
            ? "Je suis élève/étudiant"
            : "Se connecter en tant qu'école"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 200,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  header: {
    fontSize: 30,
    textAlign: "center",
    margin: 50,
    color: "#000",
  },
  inputField: {
    marginVertical: 4,
    height: 50,
    borderWidth: 1,
    borderColor: "#4caf50",
    borderRadius: 4,
    padding: 10,
    color: "#000",
    backgroundColor: "#ffffff",
  },
  button: {
    marginVertical: 15,
    alignItems: "center",
    backgroundColor: "#4caf50",
    padding: 12,
    borderRadius: 4,
  },
});

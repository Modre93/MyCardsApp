import { Image, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { supabase } from "../utils/supabase";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Student } from "../app/(auth)/list";

// Image item component that displays the image from Supabase Storage and a delte button
const StudentItem = ({
  item,
  onRemoveImage,
}: {
  item: Student;
  onRemoveImage: () => void;
}) => {
  const [image, setImage] = useState<string>("");

  supabase.storage
    .from("files")
    .download(item.photo)
    .then(({ data }) => {
      const fr = new FileReader();
      fr.readAsDataURL(data!);
      fr.onload = () => {
        setImage(fr.result as string);
      };
    });

  return (
    <View style={styles.container}>
      {image ? (
        <Image
          style={{ width: 80, height: 80, borderRadius: 50 }}
          source={{ uri: image }}
        />
      ) : (
        <View style={{ width: 80, height: 80, backgroundColor: "#e0e0e0" }} />
      )}
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.title}>{`${item.nom} ${item.prenom}`}</Text>
        <Text style={{ flex: 1, color: "#000" }}>Classe: {item.grade}</Text>
        <Text style={{ flex: 1, color: "#000" }}>Sexe: {item.sexe}</Text>
      </View>
      <TouchableOpacity onPress={() => {}} style={{ padding: 10 }}>
        <Ionicons name="pencil" size={20} color={"#000"} />
      </TouchableOpacity>
      {/* Delete image button */}
      <TouchableOpacity onPress={onRemoveImage} style={{ padding: 10 }}>
        <Ionicons name="trash-outline" size={20} color={"#000"} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    margin: 1,
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ffffff",
    padding: 10,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    color: "#000",
  },
});

export default StudentItem;

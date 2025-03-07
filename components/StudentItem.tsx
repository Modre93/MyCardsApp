import { Image, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { supabase } from "../utils/supabase";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pro, Student } from "../app/(auth)/list";
import { useRouter } from "expo-router";
import Checkbox from "expo-checkbox";

// Image item component that displays the image from Supabase Storage and a delte button
const StudentItem = ({
  item,
  onRemoveImage,
  isAdmin,
  onCkecked,
  preview,
}: {
  item: Student | Pro;
  onRemoveImage: () => void;
  isAdmin: boolean;
  onCkecked: (item: Student | Pro) => void;
  preview: (item: Student | Pro) => void;
}) => {
  const [image, setImage] = useState<string>("");
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const router = useRouter();

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

  const onEdit = () => {
    if ("studentID" in item)
      router.push({
        pathname: "/form",
        params: { studentToEdit: JSON.stringify({ ...item }) },
      });
    else
      router.push({
        pathname: "/proForm",
        params: { proToEdit: JSON.stringify({ ...item }) },
      });
  };

  const onCheck = () => {
    setIsChecked(!isChecked);
    onCkecked(item);
  };

  return (
    <View
      style={{
        ...styles.container,
        backgroundColor: isChecked ? "#e0e0e0" : "#ffffff",
        borderBottomRightRadius: isAdmin ? 0 : 50,
      }}
    >
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
        {"grade" in item ? (
          <Text style={{ flex: 1, color: "#000" }}>Classe: {item.grade}</Text>
        ) : (
          <Text style={{ flex: 1, color: "#000" }}>
            Classe: {item.matricule}
          </Text>
        )}
        {"sexe" in item ? (
          <Text style={{ flex: 1, color: "#000" }}>Sexe: {item.sexe}</Text>
        ) : (
          <Text style={{ flex: 1, color: "#000" }}>
            Contact: {item.contact}
          </Text>
        )}
      </View>
      {/* View image button */}
      <View>
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity
            onPress={() => preview(item)}
            style={{ padding: 10 }}
          >
            <Ionicons name="eye" size={20} color={"#000"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onEdit} style={{ padding: 10 }}>
            <Ionicons name="pencil" size={20} color={"#000"} />
          </TouchableOpacity>
          {/* Delete image button */}
          <TouchableOpacity onPress={onRemoveImage} style={{ padding: 10 }}>
            <Ionicons name="trash-outline" size={20} color={"#000"} />
          </TouchableOpacity>
        </View>
        {isAdmin && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              marginRight: 10,
            }}
          >
            <Checkbox value={isChecked} onValueChange={onCheck} />
          </View>
        )}
      </View>
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

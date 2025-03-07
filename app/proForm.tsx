import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  Text,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../provider/AuthProvider";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { supabase, adminEmail } from "../utils/supabase";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import Spinner from "react-native-loading-spinner-overlay";
import { getAssociations } from "@/utils/associations";
import { SelectList } from "@/react-native-dropdown-select-list";
import Toast from "react-native-toast-message";

const placeholderImage = require("@/assets/images/placeholder.png");

type School = {
  id: string;
  name: string;
  type: string;
};

const list = () => {
  const { user, pID, signOut } = useAuth();
  const [nom, setNom] = useState<string | undefined>(undefined);
  const [prenom, setPrenom] = useState<string | undefined>(undefined);
  const [matricule, setMatricule] = useState<string | undefined>(undefined);
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | string>();
  const [numero, setNumero] = useState<string>("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [associations, setAssociations] = useState<School[]>([]);
  const [associationID, setAssociationID] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAPro, setIsAPro] = useState(false);
  const [resetSelectList, setResetSelectList] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [photomodalVisible, setPhotomodalVisible] = useState(false);
  const [status, requestPermission] = ImagePicker.useCameraPermissions();
  const { proToEdit } = useLocalSearchParams();

  useEffect(() => {
    if (!user && !pID) return;
    if (user?.email === adminEmail) {
      setIsAdmin(true);
      getAssociations().then(({ data, error }) => {
        if (data) {
          setAssociations(data);
        } else alert(error);
      });
    } else if (pID) {
      setIsAPro(true);
    }
  }, [user]);

  useEffect(() => {
    if (proToEdit && typeof proToEdit === "string") {
      const parsedProToEdit = JSON.parse(proToEdit);
      setNom(parsedProToEdit.nom);
      setPrenom(parsedProToEdit.prenom);
      setNumero(parsedProToEdit.contact);
      setAssociationID(parsedProToEdit.association);
      setMatricule(parsedProToEdit.matricule);

      supabase.storage
        .from("files")
        .download(parsedProToEdit.photo)
        .then(({ data }) => {
          const fr = new FileReader();
          fr.readAsDataURL(data!);
          fr.onload = () => {
            setPhoto(fr.result as string);
          };
        });
    }
  }, []);

  const onPickImage = () => {
    setPhotomodalVisible(true);
  };

  const selectPhoto = async () => {
    if (!status?.granted) requestPermission();
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      aspect: [3, 4],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0]);
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Vous n'avez pas choisi de photo.",
      });
    }
    setPhotomodalVisible(false);
  };

  const takePhoto = async () => {
    if (!status?.granted) requestPermission();
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      aspect: [3, 4],
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0]);
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Vous n'avez pas pris de photo.",
      });
    }
    setPhotomodalVisible(false);
  };

  const reset = () => {
    setNom("");
    setPrenom("");
    setPhoto(undefined);
    setNumero("");
    setResetSelectList(true);
    setMatricule("");
  };

  const onConfirmSubmit = async () => {
    setModalVisible(false);
    const regExp = /^\d{8}$/;
    const num = numero.replace(/\s/g, "");
    if (!photo) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Veuillez choisir une photo.",
      });
      return;
    }
    if (!nom || !num || !matricule) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Veuillez remplir tous les champs.",
      });
      return;
    }

    if (!regExp.test(num)) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Numero invalide.",
      });
      return;
    }
    setLoading(true);

    // Normal data insertion
    if (typeof photo !== "string" && !proToEdit) {
      const base64 = await FileSystem.readAsStringAsync(photo!.uri, {
        encoding: "base64",
      });
      const filePath = `${
        isAdmin ? associationID : isAPro ? pID : user!.id
      }/${new Date().getTime()}.jpg`;
      const contentType = "image/jpg";
      const { data, error } = await supabase.storage
        .from("files")
        .upload(filePath, decode(base64), { contentType });
      if (error) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Il y a eu une erreur.",
        });
        setLoading(false);
        return;
      } else {
        const { error } = await supabase.from("professionals").insert({
          nom: nom.trim(),
          prenom: prenom?.trim(),
          photo: filePath,
          matricule: matricule?.trim(),
          contact: num,
          association: isAdmin ? associationID : isAPro ? pID : user!.id,
        });
        if (error) {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Il y a eu une erreur.",
          });
          setLoading(false);
        } else {
          Toast.show({
            type: "success",
            text1: "Success",
            text2: "Le membre a été ajoute avec succes.",
          });
          reset();
        }
      }
    } else if (proToEdit && typeof proToEdit === "string") {
      // Update data of the student
      if (typeof photo !== "string") {
        const base64 = await FileSystem.readAsStringAsync(photo!.uri, {
          encoding: "base64",
        });
        const filePath = JSON.parse(proToEdit).photo;
        const contentType = "image/jpg";
        const { data, error } = await supabase.storage
          .from("files")
          .upload(filePath, decode(base64), { contentType, upsert: true });
        if (error) {
          alert(`There was an error: ${error.message}`);
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from("professionals")
        .update({
          nom: nom.trim(),
          prenom: prenom?.trim(),
          matricule: matricule?.trim(),
          contact: num,
        })
        .eq("proID", JSON.parse(proToEdit).proID);

      if (error) {
        setLoading(false);
        alert(`There was an error: ${error.message}`);
      } else {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Le membre a été modifie avec succes.",
        });
        reset();
      }
    }
    setLoading(false);
    if (!isAPro) router.replace("/list");
  };

  const onSubmmitStudent = () => {
    setModalVisible(true);
  };

  const onNumberChange = (text: string) => {
    setNumero(text);
  };

  const resetFunction = () => {
    setResetSelectList(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={signOut}>
          <Ionicons name="log-out-outline" size={30} color="#000" />
        </TouchableOpacity>
      </View>
      <Spinner visible={loading} />
      <ScrollView>
        <Pressable onPress={onPickImage}>
          <Image
            source={
              photo
                ? typeof photo === "string"
                  ? { uri: photo }
                  : photo.uri
                : placeholderImage
            }
            style={styles.image}
          />
        </Pressable>
        <TextInput
          placeholder="Nom"
          value={nom}
          onChangeText={setNom}
          style={styles.inputField}
        />
        <TextInput
          placeholder="Prenom"
          value={prenom}
          onChangeText={setPrenom}
          style={styles.inputField}
        />
        <TextInput
          placeholder="Matricule"
          value={matricule}
          onChangeText={setMatricule}
          style={styles.inputField}
        />
        <TextInput
          placeholder="Contact"
          value={numero.replace(/(\d{2})(?=\d)/g, "$1 ")}
          onChangeText={onNumberChange}
          style={styles.inputField}
          keyboardType="number-pad"
        />
        {isAdmin && !proToEdit && (
          <SelectList
            data={associations.map((association) => {
              return { key: association.id, value: association.name };
            })}
            setSelected={setAssociationID}
            save="key"
            placeholder="Choisir une Association"
            boxStyles={styles.inputField}
            dropdownTextStyles={{ color: "#000" }}
            dropdownStyles={styles.dropDown}
            inputStyles={
              associationID ? { color: "#000" } : { color: "#656565" }
            }
            reset={resetSelectList}
            resetFunction={resetFunction}
          />
        )}
        <TouchableOpacity
          onPress={onSubmmitStudent}
          style={{
            ...styles.button,
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <Ionicons name="send" size={30} color={"#fff"} />
        </TouchableOpacity>
        {/* FAB to add images */}
        <TouchableOpacity onPress={onPickImage} style={styles.fab}>
          <Ionicons name="camera-outline" size={20} color={"#fff"} />
        </TouchableOpacity>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmez vos informations</Text>
            <Text style={styles.modalText}>Nom: {nom}</Text>
            <Text style={styles.modalText}>Prenom: {prenom}</Text>
            <Text style={styles.modalText}>Matricule: {matricule}</Text>
            <Text style={styles.modalText}>Contact: {numero}</Text>
            {isAdmin && (
              <Text style={styles.modalText}>
                Etablissement:{" "}
                {
                  associations.find(
                    (association) => association.id === associationID
                  )?.name
                }
              </Text>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={onConfirmSubmit}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Confirmer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Editer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={photomodalVisible}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              onPress={selectPhoto}
              style={{
                flexDirection: "row",
              }}
            >
              <Ionicons name="image" size={30} color={"#0091FF"} />
              <Text style={{ ...styles.modalTitle, color: "#0091FF" }}>
                Choisir une photo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={takePhoto}
              style={{ flexDirection: "row" }}
            >
              <Ionicons name="camera" size={30} color={"#0091FF"} />
              <Text style={{ ...styles.modalTitle, color: "#0091FF" }}>
                Prendre une photo
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
    marginTop: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "flex-end",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
    color: "#000",
  },
  fab: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    position: "absolute",
    top: 60,
    right: 130,
    backgroundColor: "#4caf50",
    borderRadius: 100,
  },
  button: {
    marginVertical: 4,
    height: 50,
    borderWidth: 1,
    borderColor: "#4caf50",
    borderRadius: 4,
    padding: 10,
    color: "#fff",
    backgroundColor: "#4caf50",
    alignItems: "center",
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
    paddingLeft: 20,
  },
  dropDown: {
    backgroundColor: "#ffffff",
    position: "absolute",
    zIndex: 1,
    top: 50,
    width: "100%",
    borderWidth: 1,
    borderColor: "#4caf50",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    borderColor: "#4caf50",
    borderWidth: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 5,
    justifyContent: "flex-start",
    alignSelf: "flex-start",
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 20,
  },
  modalButton: {
    marginHorizontal: 10,
    padding: 10,
    backgroundColor: "#4caf50",
    borderRadius: 5,
  },
  modalButtonText: {
    color: "#fff",
  },
});

export default list;

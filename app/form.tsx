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
import { SelectList } from "@/react-native-dropdown-select-list";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";

import { grades2 } from "@/assets/data/grades";
const placeholderImage = require("@/assets/images/placeholder.png");

type Grade = {
  key: number;
  value: string;
};

type Filiere = {
  key: number;
  value: string;
};

const Form = () => {
  const { user, sID, signOut, type, filieres, grades } = useAuth();
  const [schoolGrades, setSchoolGrades] = useState<Grade[]>([]);
  const [schoolFilieres, setSchoolFilieres] = useState<Filiere[]>([]);
  const [nom, setNom] = useState<string | undefined>(undefined);
  const [prenom, setPrenom] = useState<string | undefined>(undefined);
  const [grade, setGrade] = useState<string | null>(null);
  const [filiere, setFiliere] = useState<string | null>(null);
  const [sexe, setSexe] = useState<string | null>(null);
  const [matricule, setMatricule] = useState<string | undefined>(undefined);
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | string>();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [lieuDeNaissance, setLieuDeNaissance] = useState<string | undefined>(
    undefined
  );
  const [numero, setNumero] = useState<string>("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [resetSelectList, setResetSelectList] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [photomodalVisible, setPhotomodalVisible] = useState(false);
  const [status, requestPermission] = ImagePicker.useCameraPermissions();
  const { studentToEdit } = useLocalSearchParams();

  useEffect(() => {
    if (!user && !sID) return;
    if (sID) {
      setIsStudent(true);
    }
    if (type) {
      if (type === "universite") {
        setSchoolFilieres(
          filieres!.map((value, key) => ({
            key,
            value,
          }))
        );
        setSchoolGrades(
          grades!.map((value, key) => ({
            key,
            value,
          }))
        );
      } else {
        setSchoolGrades(
          grades2[type as keyof typeof grades2].map((value, key) => ({
            key,
            value,
          }))
        );
      }
    }
  }, [user, sID, type]);

  useEffect(() => {
    if (studentToEdit && typeof studentToEdit === "string") {
      const parsedStudentToEdit = JSON.parse(studentToEdit);
      setNom(parsedStudentToEdit.nom);
      setPrenom(parsedStudentToEdit.prenom);
      setFiliere(parsedStudentToEdit.filiere);
      setGrade(parsedStudentToEdit.grade);
      setSexe(parsedStudentToEdit.sexe);
      setDate(new Date(parsedStudentToEdit.date_de_naissance));
      setLieuDeNaissance(parsedStudentToEdit.lieu_de_naissance);
      setMatricule(parsedStudentToEdit.matricule);
      setNumero(parsedStudentToEdit.contact_du_tuteur);

      supabase.storage
        .from("files")
        .download(parsedStudentToEdit.photo)
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
        text1: "Erreur",
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
        text1: "Erreur",
        text2: "Vous n'avez pas pris de photo.",
      });
    }
    setPhotomodalVisible(false);
  };

  const reset = () => {
    setNom("");
    setPrenom("");
    setGrade(null);
    setSexe(null);
    setPhoto(undefined);
    setDate(undefined);
    setLieuDeNaissance("");
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
        text1: "Erreur",
        text2: "Veuillez choisir une photo.",
      });
      return;
    }
    if (
      !nom ||
      !grade ||
      !sexe ||
      !date ||
      !lieuDeNaissance ||
      !num ||
      !matricule
    ) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Veuillez remplir tous les champs.",
      });
      return;
    }

    if (!regExp.test(num)) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Numero de telephone invalide.",
      });
      return;
    }
    setLoading(true);

    // Normal data insertion
    if (typeof photo !== "string" && !studentToEdit) {
      const base64 = await FileSystem.readAsStringAsync(photo!.uri, {
        encoding: "base64",
      });
      const filePath = `${
        isStudent ? sID : user!.id
      }/${new Date().getTime()}.jpg`;
      const contentType = "image/jpg";
      const { error } = await supabase.storage
        .from("files")
        .upload(filePath, decode(base64), { contentType });
      if (error) {
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2:
            "Il y a eu une erreur lors de l'envoi de la photo. Verifier votre connexion internet.",
        });
        setLoading(false);
        return;
      } else {
        const { error } = await supabase.from("students").insert({
          nom: nom.trim(),
          prenom: prenom?.trim(),
          filiere: filiere,
          grade: grade,
          sexe: sexe,
          photo: filePath,
          date_de_naissance: date,
          matricule: matricule?.trim(),
          lieu_de_naissance: lieuDeNaissance?.trim(),
          contact_du_tuteur: num,
          school: isStudent ? sID : user!.id,
        });
        if (error) {
          Toast.show({
            type: "error",
            text1: "Erreur",
            text2:
              "Il y a eu une erreur lors de l'envoi des donnees. Verifier votre connexion internet.",
          });
          setLoading(false);
        } else {
          Toast.show({
            type: "success",
            text1: "Succes",
            text2: "L'étudiant a été ajoute avec succes.",
          });
          reset();
        }
      }
    } else if (studentToEdit && typeof studentToEdit === "string") {
      // Update data of the student
      if (typeof photo !== "string") {
        const base64 = await FileSystem.readAsStringAsync(photo!.uri, {
          encoding: "base64",
        });
        const filePath = JSON.parse(studentToEdit).photo;
        const contentType = "image/jpg";
        const { data, error } = await supabase.storage
          .from("files")
          .upload(filePath, decode(base64), { contentType, upsert: true });
        if (error) {
          Toast.show({
            type: "error",
            text1: "Erreur",
            text2:
              "Il y a eu une erreur lors de l'envoi de la photo. Verifier votre connexion internet.",
          });
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from("students")
        .update({
          nom: nom.trim(),
          prenom: prenom?.trim(),
          grade: grade,
          sexe: sexe,
          date_de_naissance: date,
          matricule: matricule?.trim(),
          lieu_de_naissance: lieuDeNaissance?.trim(),
          contact_du_tuteur: num,
        })
        .eq("studentID", JSON.parse(studentToEdit).studentID);

      if (error) {
        setLoading(false);
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2:
            "Il y a eu une erreur lors de la modification de l'étudiant. Verifier votre connexion internet.",
        });
      } else {
        Toast.show({
          type: "success",
          text1: "Succes",
          text2: "L'étudiant a été modifié avec succes.",
        });
        reset();
      }
    }
    setLoading(false);
    if (!isStudent) router.replace("/list");
  };

  const onSubmmitStudent = () => {
    setModalVisible(true);
  };

  const onChange = (event: any, selectedDate: any) => {
    const currentDate = selectedDate;
    setDate(currentDate);
  };

  const showMode = (currentMode: any) => {
    DateTimePickerAndroid.open({
      value: date || new Date(),
      onChange,
      mode: currentMode,
      is24Hour: true,
      maximumDate: new Date(),
    });
  };

  const showDatepicker = () => {
    showMode("date");
  };

  const onNumberChange = (text: string) => {
    setNumero(text);
  };

  const resetFunc = () => {
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
        {type === "universite" && (
          <SelectList
            data={schoolFilieres}
            setSelected={setFiliere}
            search={false}
            save="value"
            placeholder="Filiere"
            boxStyles={styles.inputField}
            dropdownTextStyles={{ color: "#000" }}
            dropdownStyles={styles.dropDown}
            inputStyles={filiere ? { color: "#000" } : { color: "#656565" }}
            reset={resetSelectList}
            resetFunction={resetFunc}
          />
        )}
        <SelectList
          data={schoolGrades}
          setSelected={setGrade}
          search={false}
          save="value"
          placeholder="Classe"
          boxStyles={styles.inputField}
          dropdownTextStyles={{ color: "#000" }}
          dropdownStyles={styles.dropDown}
          inputStyles={grade ? { color: "#000" } : { color: "#656565" }}
          reset={resetSelectList}
          resetFunction={resetFunc}
        />
        <SelectList
          data={[
            { key: 1, value: "F" },
            { key: 2, value: "M" },
          ]}
          setSelected={setSexe}
          search={false}
          save="value"
          placeholder="Sexe"
          boxStyles={styles.inputField}
          dropdownTextStyles={{ color: "#000" }}
          dropdownStyles={styles.dropDown}
          inputStyles={sexe ? { color: "#000" } : { color: "#656565" }}
          reset={resetSelectList}
          resetFunction={resetFunc}
        />
        <TextInput
          placeholder="Date de naissance"
          value={date ? date.toDateString() : ""}
          onFocus={showDatepicker}
          style={styles.inputField}
        />
        <TextInput
          placeholder="Lieu de naissance"
          value={lieuDeNaissance}
          onChangeText={setLieuDeNaissance}
          style={styles.inputField}
        />
        <TextInput
          placeholder="Matricule"
          value={matricule}
          onChangeText={setMatricule}
          style={styles.inputField}
        />
        <TextInput
          placeholder="Contact en cas de besoin"
          value={numero.replace(/(\d{2})(?=\d)/g, "$1 ")}
          onChangeText={onNumberChange}
          style={styles.inputField}
          keyboardType="number-pad"
        />
        <TouchableOpacity
          onPress={onSubmmitStudent}
          style={{
            ...styles.button,
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
            <Text style={styles.modalText}>Grade: {grade}</Text>
            <Text style={styles.modalText}>Sexe: {sexe}</Text>
            <Text style={styles.modalText}>
              Date de naissance: {date ? date.toDateString() : ""}
            </Text>
            <Text style={styles.modalText}>
              Lieu de naissance: {lieuDeNaissance}
            </Text>
            <Text style={styles.modalText}>Matricule: {matricule}</Text>
            <Text style={styles.modalText}>Contact du tuteur: {numero}</Text>
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

export default Form;

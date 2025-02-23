import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Pressable,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../provider/AuthProvider";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { supabase, adminEmail } from "../utils/supabase";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Spinner from "react-native-loading-spinner-overlay";
import { getSchools } from "@/utils/schools";
import { SelectList } from "react-native-dropdown-select-list";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";

import { grades } from "@/assets/images/data/grades";
const placeholderImage = require("@/assets/images/placeholder.png");

type School = {
  id: string;
  name: string;
  type: string;
};

const list = () => {
  const { user, sID } = useAuth();
  const [nom, setNom] = useState<string | undefined>(undefined);
  const [prenom, setPrenom] = useState<string | undefined>(undefined);
  const [grade, setGrade] = useState<string | undefined>(undefined);
  const [sexe, setSexe] = useState<string | undefined>(undefined);
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset>();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [lieuDeNaissance, setLieuDeNaissance] = useState<string | undefined>(
    undefined
  );
  const [personneAContacter, setPersonneAContacter] = useState<
    string | undefined
  >(undefined);
  const [numero, setNumero] = useState<string | undefined>(undefined);
  const [schoolID, setSchoolID] = useState<string>("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStudent, setIsStudent] = useState(false);

  useEffect(() => {
    if (!user && !sID) return;
    if (user?.email === adminEmail) {
      setIsAdmin(true);
      getSchools().then((data) => {
        if (data) {
          setSchools(data);
        }
      });
    } else if (sID) {
      setIsStudent(true);
    }
  }, [user]);

  const onSelectImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0]);
    } else {
      alert("You did not select any image.");
    }
  };

  const reset = () => {
    setNom("");
    setGrade("");
    setSexe("");
    setPhoto(undefined);
    setDate(undefined);
    setLieuDeNaissance("");
    setPersonneAContacter("");
    setNumero("");
  };

  const onSubmmitStudent = async () => {
    if (!photo) {
      alert("Please select an image.");
      return;
    }
    if (!nom) {
      alert("Please enter a nom.");
      return;
    }
    console.log(sID);
    setLoading(true);
    const base64 = await FileSystem.readAsStringAsync(photo!.uri, {
      encoding: "base64",
    });
    const filePath = `${
      isAdmin ? schoolID : isStudent ? sID : user!.id
    }/${new Date().getTime()}_${nom}.jpg`;
    const contentType = "image/jpg";
    const { data, error } = await supabase.storage
      .from("files")
      .upload(filePath, decode(base64), { contentType });
    if (error) {
      alert(`There was an error: ${error.message}`);
      setLoading(false);
      return;
    } else {
      const { error } = await supabase.from("students").insert({
        nom: nom,
        prenom: prenom,
        grade: grade,
        sexe: sexe,
        photo: filePath,
        date_de_naissance: date,
        lieu_de_naissance: lieuDeNaissance,
        turteur: personneAContacter,
        contact_du_tuteur: numero,
        school: isAdmin ? schoolID : isStudent ? sID : user!.id,
      });
      if (error) {
        alert(`There was an error: ${error.message}`);
      } else {
        alert("L'etudiant a ete ajoute avec succes");
        reset();
      }
    }
    setLoading(false);
    if (!isStudent) router.replace("/list");
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
    });
  };

  const showDatepicker = () => {
    showMode("date");
  };

  const onNumberChange = (text: string) => {
    const regExp = /^\d{8}$/;
    const number = text.replace(/\s/g, "");
    if (regExp.test(number)) {
      setNumero(text);
    } else {
      setNumero("");
      alert(
        "Numero de telephone invalide. Veuillez entrer un numero de telephone burkinabè sans indicatif."
      );
    }
  };

  return (
    <View style={styles.container}>
      <Spinner visible={loading} />
      <ScrollView>
        <Pressable onPress={onSelectImage}>
          <Image
            source={photo ? photo.uri : placeholderImage}
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
        <SelectList
          data={grades.map((g, i) => {
            return { key: i, value: g };
          })}
          setSelected={setGrade}
          save="value"
          placeholder="Classe"
          boxStyles={styles.inputField}
          dropdownTextStyles={{ color: "#fff" }}
          dropdownStyles={styles.dropDown}
          inputStyles={{ color: "#fff" }}
        />
        <SelectList
          data={[
            { key: 1, value: "F" },
            { key: 2, value: "M" },
          ]}
          setSelected={setSexe}
          save="value"
          placeholder="Sexe"
          boxStyles={styles.inputField}
          dropdownTextStyles={{ color: "#fff" }}
          dropdownStyles={styles.dropDown}
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
          placeholder="Nom et prenom du tuteur"
          value={personneAContacter}
          onChangeText={setPersonneAContacter}
          style={styles.inputField}
        />
        <TextInput
          placeholder="Numero de telephone du tuteur"
          value={numero}
          onEndEditing={(e) => onNumberChange(e.nativeEvent.text)}
          style={styles.inputField}
          keyboardType="phone-pad"
        />
        {isAdmin && (
          <SelectList
            data={schools.map((school) => {
              return { key: school.id, value: school.name };
            })}
            setSelected={setSchoolID}
            save="key"
            placeholder="Choisir un etablissement"
            boxStyles={styles.inputField}
            dropdownTextStyles={{ color: "#fff" }}
            dropdownStyles={styles.dropDown}
          />
        )}
        <TouchableOpacity onPress={onSubmmitStudent} style={styles.button}>
          <Ionicons name="send" size={30} color={"#fff"} />
        </TouchableOpacity>
        {/* FAB to add images */}
        <TouchableOpacity onPress={onSelectImage} style={styles.fab}>
          <Ionicons name="camera-outline" size={20} color={"#fff"} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#151515",
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
    backgroundColor: "#2b825b",
    borderRadius: 100,
  },
  button: {
    marginVertical: 4,
    height: 50,
    borderWidth: 1,
    borderColor: "#2b825b",
    borderRadius: 4,
    padding: 10,
    color: "#fff",
    backgroundColor: "#2b825b",
    alignItems: "center",
  },
  inputField: {
    marginVertical: 4,
    height: 50,
    borderWidth: 1,
    borderColor: "#2b825b",
    borderRadius: 4,
    padding: 10,
    color: "#fff",
    backgroundColor: "#363636",
  },
  dropDown: {
    backgroundColor: "#363636",
    position: "absolute",
    zIndex: 1,
    top: 50,
    width: "100%",
    borderWidth: 1,
    borderColor: "#2b825b",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    borderColor: "#2b825b",
    borderWidth: 1,
  },
});

export default list;

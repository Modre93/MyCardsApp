import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Text,
  Modal,
  Image,
} from "react-native";
import { useEffect, useState } from "react";
import * as React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../provider/AuthProvider";
import { supabase } from "../../utils/supabase";
import StudentItem from "../../components/StudentItem";
import { useRouter } from "expo-router";
import Spinner from "react-native-loading-spinner-overlay";
import { SelectList } from "@/react-native-dropdown-select-list";
import { grades2 } from "@/assets/data/grades";
import {
  getSchool,
  getStudentsDataBySchoolID,
  getAllStudents,
} from "@/utils/schools";
import { getAllPros, getProsDataByAssociation } from "@/utils/associations";
import Toast from "react-native-toast-message";

export type Student = {
  studentID: string;
  nom: string;
  prenom: string;
  grade: string;
  sexe: string;
  photo: string;
  date_de_naissance: string;
  lieu_de_naissance: string;
  matricule: string;
  contact_du_tuteur: string;
  school: string;
};

export type Pro = {
  proID: string;
  nom: string;
  prenom: string;
  matricule: string;
  contact: string;
  photo: string;
  association: string;
};

type SchoolData = {
  id: string;
  name: string;
  type: string;
};

const list = () => {
  const { user, setType, setGrades, setFilieres } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [filteredPros, setFilteredPros] = useState<Pro[]>([]);
  const [checkedStudents, setCheckedStudents] = useState<Student[]>([]);
  const [checkedPros, setCheckedPros] = useState<Pro[]>([]);
  const [pros, setPros] = useState<Pro[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [schoolsData, setSchoolsData] = useState<SchoolData[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewStudent, setPreviewStudent] = useState<Student>();
  const [previewPro, setPreviewPro] = useState<Pro>();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<Student>();
  const [studentToRemoveIndex, setStudentToRemoveIndex] = useState<number>();
  const [proToRemove, setProToRemove] = useState<Pro>();
  const [proToRemoveIndex, setProToRemoveIndex] = useState<number>();
  const [userData, setUserData] = useState<SchoolData>();
  const [selectlistData, setSelectlistData] = useState<any[]>([]);
  const [selectlistReset, setSelectlistReset] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const data = await getSchool(user!.id);
      if (data) {
        setType!(data.type);
        setUserData(data);
        if (data.type === "universite") {
          setGrades!(data.grades);
          setFilieres!(data.filieres);
        }
      } else {
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: "Une erreur s'est produite lors du chargement des données",
        });
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (userData || schoolsData.length > 0) loadData();
  }, [userData, schoolsData]);

  useEffect(() => {
    //Data to show in the select list based on the user type
    if (userData) {
      if (userData.type !== "association" && userData.type !== "entreprise") {
        setSelectlistData(
          grades2[userData.type as keyof typeof grades2].map(
            (value: string, index: number) => ({
              key: index,
              value: value,
            })
          )
        );
      }
    }
  }, [schoolsData, userData]);

  const getAllData = async () => {
    if (userData?.type === "association" || userData?.type === "entreprise") {
      const { data, error } = await getProsDataByAssociation(user!.id);
      if (data) setPros(data);
      else alert(error);
    } else {
      const { data, error } = await getStudentsDataBySchoolID(user!.id);
      if (data) setStudents(data);
      else alert(error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    getAllData();
    setLoading(false);
  };

  const onAddStudent = async () => {
    if (userData?.type === "association" || userData?.type === "entreprise")
      router.push("/proForm");
    else router.push({ pathname: "/form" });
  };

  const onRemoveModal = (item: Student | Pro, listIndex: number) => {
    if ("studentID" in item) {
      setStudentToRemove(item);
      setStudentToRemoveIndex(listIndex);
    } else {
      setProToRemove(item);
      setProToRemoveIndex(listIndex);
    }
    setDeleteModalVisible(true);
  };

  const onRemove = async (item: Student | Pro, listIndex: number) => {
    await supabase.storage.from("files").remove([item.photo]);
    if ("studentID" in item) {
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("photo", item.photo);
      if (error) {
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: "Une erreur s'est produite lors de la suppression",
        });
        setDeleteModalVisible(false);
        return;
      }
      setDeleteModalVisible(false);
      Toast.show({
        type: "success",
        text1: "Succès",
        text2: "Étudiant supprimé avec succès",
      });
      const newStudents = [...students];
      newStudents.splice(listIndex, 1);
      setStudents(newStudents);
      setStudentToRemove(undefined);
      setStudentToRemoveIndex(undefined);
    } else {
      const { error } = await supabase
        .from("professionals")
        .delete()
        .eq("photo", item.photo);
      if (error) {
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: "Une erreur s'est produite lors de la suppression",
        });
        setDeleteModalVisible(false);
        return;
      }
      setDeleteModalVisible(false);
      Toast.show({
        type: "success",
        text1: "Succès",
        text2: "Le membre supprimé avec succès",
      });
      const newPros = [...pros];
      newPros.splice(listIndex, 1);
      setPros(newPros);
      setProToRemove(undefined);
      setProToRemoveIndex(undefined);
    }
  };

  const onFilterChange = () => {
    setFilteredStudents(students.filter((item) => item.grade === selected));
  };

  const onChecked = (item: Student | Pro) => {
    if ("studentID" in item) setCheckedStudents([...checkedStudents, item]);
    else setCheckedPros([...checkedPros, item]);
  };

  const onPriewPressed = async (item: Student | Pro) => {
    setLoading(true);
    await supabase.storage
      .from("files")
      .download(item.photo)
      .then(({ data }) => {
        const fr = new FileReader();
        fr.readAsDataURL(data!);
        fr.onload = () => {
          setPreviewImage(fr.result as string);
        };
      });
    if ("studentID" in item) setPreviewStudent(item);
    else setPreviewPro(item);
    setLoading(false);
    setPreviewVisible(true);
  };

  const resetFunc = () => {
    setSelectlistReset(false);
  };

  return (
    <View style={styles.container}>
      <Spinner visible={loading} />
      <SelectList
        data={selectlistData}
        setSelected={setSelected}
        save={"value"}
        placeholder="Select"
        onSelect={onFilterChange}
        dropdownTextStyles={{ color: "#000" }}
        dropdownStyles={styles.dropBox}
        boxStyles={{ ...styles.searchField, marginBottom: 10 }}
        reset={selectlistReset}
        resetFunction={resetFunc}
        search={false}
      />
      <ScrollView>
        {userData?.type === "association" || userData?.type === "entreprise" ? (
          selected !== "" ? (
            filteredPros.length > 0 ? (
              filteredPros.map((item, index) => (
                <StudentItem
                  key={item.proID}
                  item={item}
                  onRemoveImage={() => onRemoveModal(item, index)}
                  onCkecked={onChecked}
                  preview={onPriewPressed}
                />
              ))
            ) : (
              <Text style={styles.header}>Aucun résultat trouvé</Text>
            )
          ) : (
            pros.map((item, index) => (
              <StudentItem
                key={item.proID}
                item={item}
                onRemoveImage={() => onRemoveModal(item, index)}
                onCkecked={onChecked}
                preview={onPriewPressed}
              />
            ))
          )
        ) : selected !== "" ? (
          filteredStudents.length > 0 ? (
            filteredStudents.map((item, index) => (
              <StudentItem
                key={item.studentID}
                item={item}
                onRemoveImage={() => onRemoveModal(item, index)}
                onCkecked={onChecked}
                preview={onPriewPressed}
              />
            ))
          ) : (
            <Text style={styles.header}>Aucun résultat trouvé</Text>
          )
        ) : (
          students.map((item, index) => (
            <StudentItem
              key={item.studentID}
              item={item}
              onRemoveImage={() => onRemoveModal(item, index)}
              onCkecked={onChecked}
              preview={onPriewPressed}
            />
          ))
        )}
      </ScrollView>

      {/* FAB to add images */}
      <TouchableOpacity onPress={onAddStudent} style={styles.fab}>
        <Ionicons name="add" size={30} color={"#fff"} />
      </TouchableOpacity>
      <Modal visible={previewVisible} transparent={true}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              paddingHorizontal: 10,
              paddingVertical: 20,
              borderRadius: 10,
              width: "90%",
            }}
          >
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontWeight: "bold", marginBottom: 10 }}>
                CARTE
                {previewStudent
                  ? " SCOLAIRE"
                  : userData?.type === "association"
                  ? " DE MEMBRE"
                  : "Professionnelle"}
              </Text>
            </View>
            <View style={{ alignItems: "center", flexDirection: "row" }}>
              <Image
                source={{ uri: previewImage }}
                style={{ width: 100, height: 125, marginRight: 10 }}
              />
              {previewStudent && (
                <View>
                  <Text>Nom: {previewStudent.nom.toLocaleUpperCase()} </Text>
                  <Text>Prénom(s): {previewStudent.prenom} </Text>
                  <Text>Classe: {previewStudent.grade}</Text>
                  <Text>sexe: {previewStudent.sexe} </Text>
                  <Text>
                    Né(e) le:{" "}
                    {previewStudent?.date_de_naissance
                      .split("-")
                      .reverse()
                      .join("/")}{" "}
                    A {previewStudent?.lieu_de_naissance}
                  </Text>
                  <Text>matricule: {previewStudent?.matricule}</Text>

                  <Text>
                    Contact en cas de besoin:{" "}
                    {previewStudent?.contact_du_tuteur}
                  </Text>
                </View>
              )}
              {previewPro && (
                <View>
                  <Text>Nom: {previewPro.nom.toLocaleUpperCase()} </Text>
                  <Text>Prénom(s): {previewPro.prenom} </Text>
                  <Text>matricule: {previewPro.matricule}</Text>
                  <Text>Contact: {previewPro.contact}</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={() => setPreviewVisible(false)}>
            <Ionicons name="close" size={30} color={"#fff"} />
          </TouchableOpacity>
        </View>
      </Modal>
      <Modal visible={deleteModalVisible} transparent={true}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              paddingHorizontal: 10,
              paddingVertical: 20,
              borderRadius: 10,
              width: "70%",
            }}
          >
            <Text>
              Ce étudiant sera définitivement suprimé de la base de données.
              Êtes-vous sûr de vouloir continuer?
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 15,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  if (studentToRemove)
                    onRemove(studentToRemove!, studentToRemoveIndex!);
                  if (proToRemove) onRemove(proToRemove!, proToRemoveIndex!);
                }}
                style={{ padding: 10, backgroundColor: "red", borderRadius: 5 }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  Supprimer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDeleteModalVisible(false)}
                style={{
                  padding: 10,
                  backgroundColor: "green",
                  borderRadius: 5,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  Annuler
                </Text>
              </TouchableOpacity>
            </View>
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
  },
  fab: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    width: 70,
    position: "absolute",
    bottom: 40,
    right: 30,
    height: 70,
    backgroundColor: "#4caf50",
    borderRadius: 100,
  },
  header: {
    fontSize: 30,
    textAlign: "center",
    margin: 50,
    color: "#000",
  },
  searchField: {
    height: 50,
    borderWidth: 1,
    borderColor: "#4caf50",
    borderRadius: 50,
    padding: 10,
    color: "#000",
    backgroundColor: "#ffffff",
  },
  dropBox: {
    backgroundColor: "#ffffff",
    position: "absolute",
    zIndex: 1,
    top: 50,
    width: "100%",
    borderWidth: 1,
    borderColor: "#4caf50",
  },
});

export default list;

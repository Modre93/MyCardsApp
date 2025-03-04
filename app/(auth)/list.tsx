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
import { grades } from "@/assets/images/data/grades";
import { generateExcel } from "../../utils/download";
import { getSchools } from "@/utils/schools";

const adminEmail = "admin@admin.com";

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

type SchoolData = {
  id: string;
  name: string;
  type: string;
};

const list = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [checkedStudents, setCheckedStudents] = useState<Student[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [schoolsData, setSchoolsData] = useState<SchoolData[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewStudent, setPreviewStudent] = useState<Student>();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<Student>();
  const [studentToRemoveIndex, setStudentToRemoveIndex] = useState<number>();

  useEffect(() => {
    if (!user) return;
    if (user.email === adminEmail) {
      setIsAdmin(true);
      getSchools().then((data) => {
        setSchoolsData(data!);
      });
    }

    // Load user images
    loadImages();
  }, [user]);

  const data = isAdmin
    ? schoolsData.map((school) => ({ key: school.id, value: school.name }))
    : grades.map((value, index) => ({
        key: index,
        value: value,
      })); //grade[schoolData.type];

  const getStudentData = async () => {
    if (user!.email === adminEmail) {
      const { data, error } = await supabase.from("students").select(`studentID,
          nom,
          prenom,
          grade,
          sexe,
          date_de_naissance,
          lieu_de_naissance,
          matricule,
          contact_du_tuteur,
          photo,school`);
      if (data) {
        setStudents(data);
      } else {
        console.log(error);
      }
    } else {
      const { data, error } = await supabase
        .from("students")
        .select(
          `studentID,
          nom,
          prenom,
          grade,
          sexe,
          date_de_naissance,
          lieu_de_naissance,
          matricule,
          contact_du_tuteur,
          photo,school`
        )
        .eq("school", user!.id);
      if (data) {
        setStudents(data);
      } else {
        console.log(error);
      }
    }
  };

  const loadImages = async () => {
    setLoading(true);
    getStudentData();
    setLoading(false);
  };

  const onAddStudent = async () => {
    router.push("/form");
  };

  const onRemoveStudentModal = (student: Student, listIndex: number) => {
    setStudentToRemove(student);
    setStudentToRemoveIndex(listIndex);
    setDeleteModalVisible(true);
  };

  const onRemoveStudent = async (item: Student, listIndex: number) => {
    await supabase.storage.from("files").remove([item.photo]);
    await supabase.from("students").delete().eq("photo", item.photo);
    const newStudents = [...students];
    newStudents.splice(listIndex, 1);
    setStudents(newStudents);
    setDeleteModalVisible(false);
  };

  const onFilterChange = () => {
    if (!isAdmin)
      setFilteredStudents(students.filter((item) => item.grade === selected));
    else
      setFilteredStudents(students.filter((item) => item.school === selected));
  };

  const onChecked = (item: Student) => {
    setCheckedStudents([...checkedStudents, item]);
  };

  const onPriewPressed = async (student: Student) => {
    setLoading(true);
    await supabase.storage
      .from("files")
      .download(student.photo)
      .then(({ data }) => {
        const fr = new FileReader();
        fr.readAsDataURL(data!);
        fr.onload = () => {
          setPreviewImage(fr.result as string);
        };
      });
    setPreviewStudent(student);
    setLoading(false);
    setPreviewVisible(true);
  };

  return (
    <View style={styles.container}>
      <Spinner visible={loading} />
      <SelectList
        data={data}
        setSelected={setSelected}
        save={`${isAdmin ? "key" : "value"}`}
        placeholder="Search"
        onSelect={onFilterChange}
        dropdownTextStyles={{ color: "#000" }}
        dropdownStyles={styles.dropBox}
        boxStyles={styles.searchField}
        reset={false}
        search={true}
      />
      <ScrollView>
        {selected !== "" ? (
          filteredStudents.length > 0 ? (
            filteredStudents.map((item, index) => (
              <StudentItem
                key={item.studentID}
                item={item}
                onRemoveImage={() => onRemoveStudentModal(item, index)}
                isAdmin={isAdmin}
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
              onRemoveImage={() => onRemoveStudentModal(item, index)}
              isAdmin={isAdmin}
              onCkecked={onChecked}
              preview={onPriewPressed}
            />
          ))
        )}
      </ScrollView>
      {/* FAB to download images */}
      {user?.email === adminEmail && (
        <TouchableOpacity
          onPress={() =>
            checkedStudents.length > 0
              ? generateExcel(
                  checkedStudents,
                  schoolsData.find((s) => s.id === selected)!.name
                )
              : filteredStudents.length > 0
              ? generateExcel(
                  filteredStudents,
                  schoolsData.find((s) => s.id === selected)!.name
                )
              : alert("Veuillez choisir une école")
          }
          style={{ ...styles.fab, bottom: 130, right: 30 }}
        >
          <Ionicons name="download-outline" size={30} color={"#fff"} />
        </TouchableOpacity>
      )}
      {/* FAB to add images */}
      <TouchableOpacity onPress={onAddStudent} style={styles.fab}>
        <Ionicons name="add" size={30} color={"#fff"} />
      </TouchableOpacity>
      <Modal visible={previewVisible} transparent={true}>
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
              width: "90%",
            }}
          >
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontWeight: "bold", marginBottom: 10 }}>
                CARTE SCOLAIRE
              </Text>
            </View>
            <View style={{ alignItems: "center", flexDirection: "row" }}>
              <Image
                source={{ uri: previewImage }}
                style={{ width: 100, height: 125, marginRight: 10 }}
              />
              <View>
                <Text>Nom: {previewStudent?.nom.toLocaleUpperCase()} </Text>
                <Text>Prénom(s): {previewStudent?.prenom} </Text>
                <Text>Classe: {previewStudent?.grade}</Text>
                <Text>sexe: {previewStudent?.sexe} </Text>
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
                  Contact en cas de besoin: {previewStudent?.contact_du_tuteur}
                </Text>
              </View>
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
                onPress={() =>
                  onRemoveStudent(studentToRemove!, studentToRemoveIndex!)
                }
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
    marginBottom: 20,
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

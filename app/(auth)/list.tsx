import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Text,
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

const adminEmail = "admin@admin.com";

export type Student = {
  studentID: string;
  nom: string;
  prenom: string;
  grade: string;
  sexe: string;
  photo: string;
};

type SchoolData = {
  name: string;
  type: string;
};

const list = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [schoolData, setSchoolData] = useState<SchoolData>({
    name: "",
    type: "",
  });

  useEffect(() => {
    if (!user) return;
    if (user.email === adminEmail) setIsAdmin(true);
    getSchoolData();

    // Load user images
    loadImages();
  }, [user]);

  const data = grades.map((value, index) => ({
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
          tuteur,
          contact_du_tuteur,
          photo`);
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
          tuteur,
          contact_du_tuteur,
          photo`
        )
        .eq("school", user!.id);
      if (data) {
        setStudents(data);
      } else {
        console.log(error);
      }
    }
  };

  const getSchoolData = async () => {
    const { data, error } = await supabase
      .from("etablissements")
      .select("name, type")
      .eq("id", user!.id);
    if (data) {
      setSchoolData(data[0]);
    } else {
      console.log(error);
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

  const onRemoveStudent = async (item: Student, listIndex: number) => {
    await supabase.storage.from("files").remove([item.photo]);
    await supabase.from("students").delete().eq("photo", item.photo);
    const newStudents = [...students];
    newStudents.splice(listIndex, 1);
    setStudents(newStudents);
  };

  const onFilterChange = () => {
    setFilteredStudents(students.filter((item) => item.grade === selected));
  };

  const selectListReset = (func: () => void) => func;

  return (
    <View style={styles.container}>
      <Spinner visible={loading} />
      <SelectList
        data={data}
        setSelected={setSelected}
        save="value"
        placeholder="Search"
        onSelect={onFilterChange}
        dropdownTextStyles={{ color: "#fff" }}
        dropdownStyles={styles.dropBox}
        boxStyles={styles.searchField}
        reset={false}
      />
      <ScrollView>
        {selected !== "" ? (
          filteredStudents.length > 0 ? (
            filteredStudents.map((item, index) => (
              <StudentItem
                key={item.studentID}
                item={item}
                onRemoveImage={() => onRemoveStudent(item, index)}
              />
            ))
          ) : (
            <Text style={styles.header}>No students found</Text>
          )
        ) : (
          students.map((item, index) => (
            <StudentItem
              key={item.studentID}
              item={item}
              onRemoveImage={() => onRemoveStudent(item, index)}
            />
          ))
        )}
      </ScrollView>
      {/* FAB to download images */}
      {user?.email === adminEmail && (
        <TouchableOpacity
          onPress={() => generateExcel(students)}
          style={{ ...styles.fab, bottom: 130, right: 30 }}
        >
          <Ionicons name="download-outline" size={30} color={"#fff"} />
        </TouchableOpacity>
      )}
      {/* FAB to add images */}
      <TouchableOpacity onPress={onAddStudent} style={styles.fab}>
        <Ionicons name="add" size={30} color={"#fff"} />
      </TouchableOpacity>
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
    width: 70,
    position: "absolute",
    bottom: 40,
    right: 30,
    height: 70,
    backgroundColor: "#2b825b",
    borderRadius: 100,
  },
  header: {
    fontSize: 30,
    textAlign: "center",
    margin: 50,
    color: "#fff",
  },
  searchField: {
    marginBottom: 20,
    height: 50,
    borderWidth: 1,
    borderColor: "#2b825b",
    borderRadius: 50,
    padding: 10,
    color: "#fff",
    backgroundColor: "#363636",
  },
  dropBox: {
    backgroundColor: "#363636",
    position: "absolute",
    zIndex: 1,
    top: 50,
    width: "100%",
    borderWidth: 1,
    borderColor: "#2b825b",
  },
});

export default list;

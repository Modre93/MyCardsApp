import { supabase } from "./supabase";

export const getSchools = async () => {
  const { data, error } = await supabase
    .from("etablissements")
    .select("id, name, type");
  if (error) {
    console.log(error);
  } else {
    return data;
  }
};

export const getSchool = async (id: string) => {
  const { data, error } = await supabase
    .from("etablissements")
    .select("id, name, type, filieres, grades")
    .eq("id", id);
  if (error) {
    console.log(error);
  } else {
    return data[0];
  }
};

export const getStudentsDataBySchoolID = async (id: string) => {
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
    .eq("school", id);
  return { data, error };
};

export const getAllStudents = async () => {
  const { data, error } = await supabase.from("students").select(
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
  );
  return { data, error };
};

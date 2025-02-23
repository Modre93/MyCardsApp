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
    .select("name, type")
    .eq("id", id);
  if (error) {
    console.log(error);
  } else {
    return data[0];
  }
};

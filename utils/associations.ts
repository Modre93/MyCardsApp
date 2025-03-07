import { supabase } from "./supabase";

export const getAssociations = async () => {
  const { data, error } = await supabase
    .from("etablissements")
    .select("id, name, type")
    .eq("type", "association");
  return { data, error };
};

export const getProsDataByAssociation = async (id: string) => {
  const { data, error } = await supabase
    .from("professionals")
    .select("proID, nom, prenom, matricule, association, contact, photo")
    .eq("association", id);
  return { data, error };
};

export const getAllPros = async () => {
  const { data, error } = await supabase
    .from("professionals")
    .select("proID, nom, prenom, matricule, association, contact, photo");
  return { data, error };
};

import * as XLSX from "xlsx";
import * as FileSystem from "expo-file-system";
import { StorageAccessFramework } from "expo-file-system";
import { supabase } from "./supabase";

import { Student, Pro } from "@/app/(auth)/list";

export const generateExcel = async (
  students: Student[] | Pro[],
  schoolName: string
) => {
  try {
    const data =
      "studentID" in students
        ? [
            [
              "id",
              "Nom",
              "Prenom",
              "Grade",
              "Sexe",
              "Date de naissance",
              "Lieu de naissance",
              "Matricule",
              "Contact du tuteur",
              "Photo",
            ],
            ...students.map((student: any) => [
              student.studentID,
              student.nom,
              student.prenom,
              student.grade,
              student.sexe,
              student.date_de_naissance,
              student.lieu_de_naissance,
              student.matricule,
              student.contact_du_tuteur,
              student.photo.split("/").pop()!,
            ]),
          ]
        : [
            ["id", "Nom", "Prenom", "Matricule", "Contact", "Photo"],
            ...students.map((pro: any) => [
              pro.proID,
              pro.nom,
              pro.prenom,
              pro.matricule,
              pro.contact,
              pro.photo.split("/").pop()!,
            ]),
          ];

    // Create a new workbook and worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    // Write the Excel file to Base64 format
    const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

    // Get permission to write to the Downloads folder
    const downloadsUri =
      await StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!downloadsUri.granted) {
      console.log("Permission denied to access Downloads folder");
      return;
    }

    for (const student of students) {
      const photoURI = await StorageAccessFramework.createFileAsync(
        downloadsUri.directoryUri,
        student.photo.split(".")[0]!,
        "image/jpeg"
      );
      supabase.storage
        .from("files")
        .download(student.photo)
        .then(({ data }) => {
          const fr = new FileReader();
          fr.readAsDataURL(data!);
          fr.onloadend = async () => {
            await StorageAccessFramework.writeAsStringAsync(
              photoURI,
              fr.result?.toString().split(",")[1]!,
              {
                encoding: FileSystem.EncodingType.Base64,
              }
            );
          };
        });
    }

    // Define file name and create the file in Downloads
    const fileName = `${schoolName}.xlsx`;

    const uri = await StorageAccessFramework.createFileAsync(
      downloadsUri.directoryUri,
      fileName.split(".")[0],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Write Base64 data to the file
    await StorageAccessFramework.writeAsStringAsync(uri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    alert("Excel file saved to Downloads folder");
  } catch (error) {
    console.log("Error generating Excel file:", error);
  }
};

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/firebaseClient";

export async function uploadFile(file: File, chatType: string, chatId: string): Promise<string> {
  try {
    const storageRef = ref(storage, `${chatType}/${chatId}/${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}
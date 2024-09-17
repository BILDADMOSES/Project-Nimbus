import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app } from "./firebaseClient";
import toast from "react-hot-toast";

const storage = getStorage(app);

const upload = async (file: File): Promise<string> => {
  const storageRef = ref(storage, `images/${Date.now() + file.name}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
      },
      (error) => {
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
        toast.success("Image uploaded successfully!");
      }
    );
  });
};

export default upload;
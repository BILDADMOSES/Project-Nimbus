import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  FirebaseStorage,
  StorageReference,
} from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

import firebaseConfig from './firebase.config';

const app: FirebaseApp = initializeApp(firebaseConfig);
const storage: FirebaseStorage = getStorage(app);

/**
 * Handles the file upload to Firebase Storage.
 * @param {File} file - The file to be uploaded.
 * @returns {Promise<string>} A promise that resolves with the download URL of the uploaded file.
 */
export async function handleFileUpload(file: File): Promise<string> {
  if (!file) {
    throw new Error('Invalid passport photo file.');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size exceeds the limit of 5 MB.');
  }

  try {
    const fileId: string = uuidv4();
    const fileExtension: string = path.extname(file.name);
    const storageRef: StorageReference = ref(storage, `uploads/profile_photos/${fileId}${fileExtension}`);

    // Upload the file to Firebase Storage
    await uploadBytes(storageRef, file);

    // Get the download URL of the uploaded file
    const downloadUrl: string = await getDownloadURL(storageRef);

    console.log(downloadUrl);
    return downloadUrl;
  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : String(error);
    console.error('Error in handleFileUpload:', errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Retrieves a file from Firebase Storage.
 * @param {string} fileUrl - The URL of the file to retrieve.
 * @returns {Promise<string>} A promise that resolves with the download URL of the file.
 */
export async function getFileFromStorage(fileUrl: string): Promise<string> {
  try {
    const fileRef: StorageReference = ref(storage, fileUrl);
    const downloadUrl: string = await getDownloadURL(fileRef);
    return downloadUrl;
  } catch (error: unknown) {
    console.error('Error retrieving file:', error);
    throw new Error('Error retrieving file from Firebase Storage');
  }
}

/**
 * Deletes a file from Firebase Storage.
 * @param {string} fileUrl - The URL of the file to delete.
 */
export async function deleteFileFromStorage(fileUrl: string): Promise<void> {
  try {
    const token: string | undefined = process.env.FIREBASE_STORAGE_TOKEN;
    const urlParts: URL = new URL(fileUrl);
    const filePath: string = urlParts.pathname.split('/').slice(3).join('/');
    const decodedFilePath: string = decodeURIComponent(filePath);
    const deleteUrl: string = `${fileUrl}?token=${token}`;
    const fileRef: StorageReference = ref(storage, decodedFilePath);
    await deleteObject(fileRef);
    console.log('File deleted successfully');
  } catch (error: unknown) {
    console.error('Error deleting file:', error);
    throw new Error('Error deleting file');
  }
}
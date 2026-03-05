import { storage } from "../firebase/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const uploadImage = async (uri) => {
  const filename = `products/${Date.now()}.jpg`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const storageRef = ref(storage, filename);

  await uploadBytes(storageRef, blob);

  const downloadURL = await getDownloadURL(storageRef);

  return downloadURL;
};
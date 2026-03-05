import { db } from "../components/firebase/firebaseConfig";
import { collection, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";

export const addProduct = async (data) => {
  return await addDoc(collection(db, "products"), data);
};

export const updateProduct = async (id, data) => {
  return await updateDoc(doc(db, "products", id), data);
};

export const deleteProduct = async (id) => {
  return await deleteDoc(doc(db, "products", id));
};
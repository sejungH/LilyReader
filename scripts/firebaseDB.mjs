// Firebase SDK import
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyA4ytSbKyzAfnTNNw3cKRN9VOCW6ORPPBY",
    authDomain: "dcreader-project.firebaseapp.com",
    projectId: "dcreader-project",
    storageBucket: "dcreader-project.firebasestorage.app",
    messagingSenderId: "612017471498",
    appId: "1:612017471498:web:b46b8b23074e0b1a065ff3",
    measurementId: "G-GP8PTD3TLS"
};

export class FirebaseDB {

    /**
     * FirebaseDB 생성자
     */
    constructor() {
        this.app = initializeApp(FIREBASE_CONFIG);
        this.db = getFirestore(this.app);
    }

    /** 
     * Firestore에서 전체 시리즈 데이터를 읽어옵니다.
     * @returns {Promise<Array>}
     */
    async readData() {
        const data = await getDocs(collection(this.db, "series"));
        return data.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    /**
     * Firestore에서 특정 시리즈 데이터를 읽어옵니다.
     * @param {String} docId 
     * @returns {Promise<Object|null>}
     */
    async readDataById(docId) {
        try {
            const docRef = doc(this.db, "series", docId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                console.log("Document data:", docSnap.data());
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                console.log("No such document!");
                return null;
            }
        } catch (error) {
            console.error("Error reading document: ", error);
            return null;
        }
    }


    /**
     * Firestore에 시리즈 데이터를 씁니다.
     * @param {Object} doc 
     * @returns {Promise<String>}
     */
    async writeData(doc) {
        try {
            const docRef = await addDoc(collection(this.db, "series"), doc);
            console.log("Document written with ID: ", docRef.id);
            return docRef.id;

        } catch (error) {
            console.error("Error adding document: ", error);
            return null;
        }
    }

    /**
     * Firestore에서 시리즈 데이터를 업데이트합니다.
     * @param {String} docId 
     * @param {Object} updatedFields 
     */
    async updateData(docId, updatedFields) {
        try {
            const docRef = doc(this.db, "series", docId);
            await updateDoc(docRef, updatedFields);
            console.log("Document updated with ID: ", docId);
        } catch (error) {
            console.error("Error updating document: ", error);
        }
    }

    /**
     * Firestore에서 시리즈 데이터를 삭제합니다.
     * @param {String} docId
     */
    async deleteData(docId) {
        try {
            const docRef = doc(this.db, "series", docId);
            await deleteDoc(docRef);
            console.log("Document deleted with ID: ", docId);

        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    }

}
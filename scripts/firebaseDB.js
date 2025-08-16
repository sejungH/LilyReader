// Firebase SDK import
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyA4ytSbKyzAfnTNNw3cKRN9VOCW6ORPPBY",
    authDomain: "dcreader-project.firebaseapp.com",
    projectId: "dcreader-project",
    storageBucket: "dcreader-project.firebasestorage.app",
    messagingSenderId: "612017471498",
    appId: "1:612017471498:web:b46b8b23074e0b1a065ff3",
    measurementId: "G-GP8PTD3TLS"
};

class FirebaseDB {

    /**
     * FirebaseDB 생성자
     */
    constructor() {
        this.app = firebase.initializeApp(FIREBASE_CONFIG);
        this.db = firebase.firestore();
    }

    /** 
     * Firestore에서 전체 시리즈 데이터를 읽어옵니다.
     * @returns {Promise<Array>}
     */
    async readData() {
        const docSnap = await this.db.collection("series").get();
        return docSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    /**
     * Firestore에서 특정 시리즈 데이터를 읽어옵니다.
     * @param {String} docId 
     * @returns {Promise<Object|null>}
     */
    async readDataById(docId) {
        try {
            const docRef = this.db.collection("series").doc(docId);
            const docSnap = await docRef.get();

            if (docSnap) {
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
            const docRef = this.db.collection("series").doc();
            await docRef.set(doc);
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
            const docRef = this.db.collection("series").doc(docId);
            await docRef.update(updatedFields);
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
            const docRef = this.db.collection("series").doc(docId);
            await docRef.delete();
            console.log("Document deleted with ID: ", docId);

        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    }

}

window.FirebaseDB = FirebaseDB;
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

let DEVMODE = false;
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    DEVMODE = true;
}

var COLLECTION = "series";
var LOG_COLLECTION = "logs";
var USER_COLLECTION = "users";

if (DEVMODE) {
    COLLECTION = "test_series";
    LOG_COLLECTION = "test_logs";
    USER_COLLECTION = "test_users";
}

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
        const docSnap = await this.db.collection(COLLECTION).get();
        return docSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    /**
     * Firestore에서 특정 시리즈 데이터를 읽어옵니다.
     * @param {String} docId 
     * @returns {Promise<Object|null>}
     */
    async readDataById(docId) {
        try {
            const docRef = this.db.collection(COLLECTION).doc(docId);
            const docSnap = await docRef.get();

            if (docSnap.exists) {
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
            const docRef = this.db.collection(COLLECTION).doc();
            await docRef.set(doc);
            this.recordLog(new Date(), `Document written [${docRef.id}]: ` + JSON.stringify(doc));
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
            const docRef = this.db.collection(COLLECTION).doc(docId);
            await docRef.update(updatedFields);
            this.recordLog(new Date(), `Document updated [${docId}]: ` + JSON.stringify(updatedFields));
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
            const docRef = this.db.collection(COLLECTION).doc(docId);
            await docRef.delete();
            this.recordLog(new Date(), `Document deleted [${docId}]`);
            console.log("Document deleted with ID: ", docId);

        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    }

    /**
     * 
     * @param {Date} date 
     * @param {String} log 
     */
    async recordLog(date, log) {
        try {
            // yyyymmdd_hhmmss 포맷 생성
            const pad = n => String(n).padStart(2, '0');
            const yyyymmdd = date.getFullYear().toString() +
                pad(date.getMonth() + 1) +
                pad(date.getDate());
            const hhmmss = pad(date.getHours()) +
                pad(date.getMinutes()) +
                pad(date.getSeconds());
            const docId = `${yyyymmdd}_${hhmmss}`;

            const docRef = this.db.collection(LOG_COLLECTION).doc(docId);
            await docRef.set({ timestamp: date, log: log });
        } catch (error) {
            console.error("Error recording log: ", error);
        }
    }

    async getUser(email) {
        try {
            const docRef = this.db.collection(USER_COLLECTION).doc(email);
            const docSnap = await docRef.get();

            if (docSnap.exists) {
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                console.log("No such user!");
                return null;
            }
        } catch (error) {
            console.error("Error getting User Info: ", error);
            return null;
        }
    }

    async addUser(userInfo) {
        try {
            const docRef = this.db.collection(USER_COLLECTION).doc(userInfo.email);
            await docRef.set({ userInfo: userInfo });
            this.recordLog(new Date(), `User added [${docRef.id}]: ` + JSON.stringify(userInfo));
            console.log("Document written with ID: ", docRef.id);
            return docRef.id;

        } catch (error) {
            console.error("Error adding user: ", error);
            return null;
        }
    }

    async addBookmark(email, seriesId) {
        try {
            const user = await this.getUser(email);
            if (!user) throw new Error("User not found");

            const docRef = this.db.collection(USER_COLLECTION).doc(email);
            await docRef.update({
                bookmarks: firebase.firestore.FieldValue.arrayUnion(seriesId)
            });
            this.recordLog(new Date(), `Bookmark added [${seriesId}] for user [${email}]`);
            console.log("Bookmark added for user: ", email);
        } catch (error) {
            console.error("Error adding bookmark: ", error);
        }
    }


    async removeBookmark(email, seriesId) {
        try {
            const user = await this.getUser(email);
            if (!user) throw new Error("User not found");

            const docRef = this.db.collection(USER_COLLECTION).doc(email);
            await docRef.update({
                bookmarks: firebase.firestore.FieldValue.arrayRemove(seriesId)
            });
            this.recordLog(new Date(), `Bookmark removed [${seriesId}] for user [${email}]`);
            console.log("Bookmark removed for user: ", email);
        } catch (error) {
            console.error("Error removing bookmark: ", error);
        }
    }

    async addViewed(email, seriesId, episodeId) {
        try {
            const user = await this.getUser(email);
            if (!user) throw new Error("User not found");

            const docRef = this.db.collection(USER_COLLECTION).doc(email);
            const docSnap = await docRef.get();
            let viewed = {};

            if (docSnap.exists && docSnap.data().viewed) {
                viewed = docSnap.data().viewed;
            }

            if (!viewed[seriesId]) {
                viewed[seriesId] = [];
            }

            // 중복 방지
            if (!viewed[seriesId].includes(episodeId)) {
                viewed[seriesId].push(episodeId);
            }

            await docRef.update({ viewed: viewed });
            console.log("Episode viewed for user: ", email);
        } catch (error) {
            console.error("Error adding viewed episode: ", error);
        }
    }

}

window.FirebaseDB = FirebaseDB;
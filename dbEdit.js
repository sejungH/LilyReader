import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDocs, updateDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyA4ytSbKyzAfnTNNw3cKRN9VOCW6ORPPBY",
    authDomain: "dcreader-project.firebaseapp.com",
    projectId: "dcreader-project",
    storageBucket: "dcreader-project.firebasestorage.app",
    messagingSenderId: "612017471498",
    appId: "1:612017471498:web:b46b8b23074e0b1a065ff3",
    measurementId: "G-GP8PTD3TLS"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 백업할 컬렉션 이름 배열
const collectionsToBackup = ["series"]; // 여기에 실제 컬렉션 이름 입력

async function edit() {
    const colRef = collection(db, "series");
    const snapshot = await getDocs(colRef);

    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (Array.isArray(data.tags)) {
            // tags 배열 수정
            const newTags = data.tags.map(tag => {
                if (tag === "코믹스") return "만화";
                if (tag === "라노벨") return "소설";
                return tag;
            });

            // 변경사항이 있을 때만 업데이트
            if (JSON.stringify(newTags) !== JSON.stringify(data.tags)) {
                await updateDoc(doc(db, "series", docSnap.id), { tags: newTags });
                console.log(`Updated tags for doc ${docSnap.id}:`, newTags);
            }
        }
    }
}

edit();
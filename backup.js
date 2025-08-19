import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

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
const collectionsToBackup = ["series", "users", "logs"]; // 여기에 실제 컬렉션 이름 입력

async function backupCollections() {
  for (const colName of collectionsToBackup) {
    const colRef = collection(db, colName);
    const snapshot = await getDocs(colRef);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // backup 폴더가 없으면 생성
  const backupDir = 'backup';
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  // yyyymmdd 형식 날짜 생성
  const now = new Date();
  const yyyymmdd = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const filePath = `${backupDir}/${colName}_backup_${yyyymmdd}.json`;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
  console.log("백업 완료");
}

backupCollections();
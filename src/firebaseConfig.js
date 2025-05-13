import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDLvjcLIE7qzSAMKzEShiqpOgxnqs2PdkY",
  authDomain: "okututor-f276b.firebaseapp.com",
  projectId: "okututor-f276b",
  storageBucket: "okututor-f276b.appspot.com", // Исправил тут
  messagingSenderId: "776583921685",
  appId: "1:776583921685:web:a0216345e3c15c9139ce1c"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const storage = getStorage(app);

export { auth, storage };

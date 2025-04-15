
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Ваша конфигурация Firebase (замените значения на ваши из консоли Firebase)
const firebaseConfig = {
    apiKey: "AIzaSyDLvjcLIE7qzSAMKzEShiqpOgxnqs2PdkY",
    authDomain: "okututor-f276b.firebaseapp.com",
    projectId: "okututor-f276b",
    storageBucket: "okututor-f276b.firebasestorage.app",
    messagingSenderId: "776583921685",
    appId: "1:776583921685:web:a0216345e3c15c9139ce1c"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Инициализация Authentication
const auth = getAuth(app);

export { auth };
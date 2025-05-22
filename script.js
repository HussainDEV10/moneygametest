// استيراد Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAuQJpBMSijYcYZQ8rAsdnKX-75s5x7qts",
  authDomain: "moneygame-2025.firebaseapp.com",
  projectId: "moneygame-2025",
  storageBucket: "moneygame-2025.appspot.com",
  messagingSenderId: "427481930723",
  appId: "1:427481930723:web:20ebe3ecfdd76cb5f0ded6"
};

// تهيئة التطبيق
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// عناصر النموذج
const email = document.getElementById("email");
const password = document.getElementById("password");
const msg = document.getElementById("msg");
const signUpBtn = document.getElementById("signUpBtn");
const signInBtn = document.getElementById("signInBtn");

// إنشاء حساب جديد
signUpBtn.addEventListener("click", () => {
  createUserWithEmailAndPassword(auth, email.value, password.value)
    .then((userCredential) => {
      msg.textContent = "تم إنشاء الحساب بنجاح";
    })
    .catch((error) => {
      msg.textContent = "خطأ في التسجيل: " + error.message;
    });
});

// تسجيل دخول
signInBtn.addEventListener("click", () => {
  signInWithEmailAndPassword(auth, email.value, password.value)
    .then((userCredential) => {
      // تسجيل دخول ناجح → الانتقال إلى صفحة اللعبة
      window.location.href = "game.html";
    })
    .catch((error) => {
      msg.textContent = "خطأ في تسجيل الدخول: " + error.message;
    });
});

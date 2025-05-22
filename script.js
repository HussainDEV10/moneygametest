// استيراد Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
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

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// تحديد عناصر HTML
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");
const messageBox = document.getElementById("message");

// تسجيل حساب جديد
registerBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showMessage("يرجى إدخال البريد وكلمة المرور");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      showMessage("تم إنشاء الحساب بنجاح. جاري تسجيل الدخول...");
      // الانتقال إلى صفحة اللعبة
      window.location.href = "game.html";
    })
    .catch((error) => {
      showMessage("فشل التسجيل: " + error.message);
    });
});

// تسجيل الدخول لحساب موجود
loginBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showMessage("يرجى إدخال البريد وكلمة المرور");
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      showMessage("تم تسجيل الدخول. جاري التوجيه...");
      window.location.href = "game.html";
    })
    .catch((error) => {
      showMessage("فشل تسجيل الدخول: " + error.message);
    });
});

// رسالة توضيحية
function showMessage(msg) {
  if (messageBox) {
    messageBox.textContent = msg;
    messageBox.style.color = "red";
  } else {
    alert(msg); // حل بديل لو ما عندك div للرسائل
  }
}

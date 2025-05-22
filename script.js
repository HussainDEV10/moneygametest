// firebase إعداد
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAuQJpBMSijYcYZQ8rAsdnKX-75s5x7qts",
  authDomain: "moneygame-2025.firebaseapp.com",
  projectId: "moneygame-2025",
  storageBucket: "moneygame-2025.appspot.com",
  messagingSenderId: "427481930723",
  appId: "1:427481930723:web:20ebe3ecfdd76cb5f0ded6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// وظيفة التسجيل
window.register = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("msg");

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      msg.style.color = "green";
      msg.textContent = "تم إنشاء الحساب بنجاح";
    })
    .catch((error) => {
      msg.style.color = "red";
      msg.textContent = "خطأ: " + error.message;
    });
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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

// عناصر الصفحة
const userEmailSpan = document.getElementById("userEmail");
const usernameDisplay = document.getElementById("usernameDisplay");
const editBtn = document.getElementById("editUsername");
const coinAmount = document.getElementById("coinAmount");

onAuthStateChanged(auth, (user) => {
  if (user) {
    userEmailSpan.textContent = user.email;
    usernameDisplay.textContent = user.displayName || "@username";
    coinAmount.textContent = 100; // كل مستخدم يبدأ بـ 100
  } else {
    window.location.href = "index.html";
  }
});

editBtn.addEventListener("click", () => {
  const newName = prompt("أدخل اسم جديد (بدون @):");
  if (newName && newName.trim().length >= 3) {
    const displayName = "@" + newName.trim();
    updateProfile(auth.currentUser, { displayName })
      .then(() => {
        usernameDisplay.textContent = displayName;
        alert("تم تحديث الاسم بنجاح!");
      })
      .catch((error) => {
        alert("فشل التحديث: " + error.message);
      });
  } else {
    alert("الاسم يجب أن يكون على الأقل 3 أحرف.");
  }
});

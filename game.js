import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// إعداد Firebase
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
const db = getFirestore(app);

// عناصر الصفحة
const userEmailSpan = document.getElementById("userEmail");
const usernameDisplay = document.getElementById("usernameDisplay");
const editBtn = document.getElementById("editUsername");
const coinAmount = document.getElementById("coinAmount");
const donateForm = document.getElementById("donateForm");
const donateMessage = document.getElementById("donateMessage");

let currentUser = null;

// تحقق من تسجيل الدخول
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    userEmailSpan.textContent = user.email;
    usernameDisplay.textContent = user.displayName || "@username";

    // جلب عدد العملات الحقيقي من قاعدة البيانات
    const snapshot = await getDocs(collection(db, "users"));
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email === user.email) {
        coinAmount.textContent = data.coins || 0;
      }
    });
  } else {
    window.location.href = "index.html";
  }
});

// تعديل اسم المستخدم
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

// التبرع
donateForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) {
    donateMessage.textContent = "يرجى تسجيل الدخول أولاً.";
    return;
  }

  const recipientEmail = document.getElementById("recipientEmail").value.trim().toLowerCase();
  const donateAmount = parseInt(document.getElementById("donateAmount").value);

  if (!recipientEmail || isNaN(donateAmount) || donateAmount <= 0) {
    donateMessage.textContent = "يرجى إدخال بيانات صحيحة.";
    return;
  }

  try {
    const snapshot = await getDocs(collection(db, "users"));
    let recipientDoc = null;
    let senderDoc = null;

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email === recipientEmail) {
        recipientDoc = { id: doc.id, ...data };
      }
      if (data.email === currentUser.email) {
        senderDoc = { id: doc.id, ...data };
      }
    });

    if (!recipientDoc) {
      donateMessage.textContent = "المستلم غير موجود.";
      return;
    }

    if (!senderDoc || senderDoc.coins < donateAmount) {
      donateMessage.textContent = "رصيدك غير كافٍ.";
      return;
    }

    // خصم من المرسل
    await updateDoc(doc(db, "users", senderDoc.id), {
      coins: senderDoc.coins - donateAmount
    });

    // إضافة للمستلم
    await updateDoc(doc(db, "users", recipientDoc.id), {
      coins: (recipientDoc.coins || 0) + donateAmount
    });

    donateMessage.textContent = `تم التبرع بـ ${donateAmount} عملة إلى ${recipientEmail}`;
    coinAmount.textContent = senderDoc.coins - donateAmount;
  } catch (error) {
    console.error(error);
    donateMessage.textContent = "حدث خطأ أثناء التبرع.";
  }
});

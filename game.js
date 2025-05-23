import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// إعدادات Firebase
const firebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// تأكد من أن الجلسة تبقى محفوظة حتى بعد إعادة تحميل الصفحة
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("خطأ في إعداد الجلسة:", error);
});

const userEmail = document.getElementById("userEmail");
const usernameDisplay = document.getElementById("usernameDisplay");
const editUsernameBtn = document.getElementById("editUsername");
const coinAmount = document.getElementById("coinAmount");
const donateBtn = document.getElementById("donateBtn");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // المستخدم غير موجود، أعد التوجيه
    window.location.href = "game.html";
    return;
  }

  try {
    const uid = user.uid;
    userEmail.textContent = user.email;

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        username: "@مستخدم",
        coins: 100
      });
    }

    const userData = (await getDoc(userRef)).data();
    usernameDisplay.textContent = userData.username || "@مستخدم";
    coinAmount.textContent = userData.coins || 0;

    // تغيير الاسم عند الضغط
    editUsernameBtn.addEventListener("click", async () => {
      const newName = prompt("ادخل اسم المستخدم الجديد (بدون @):");
      if (newName && newName.trim() !== "") {
        const finalName = "@" + newName.trim();
        await updateDoc(userRef, { username: finalName });
        usernameDisplay.textContent = finalName;
        alert("تم تحديث اسم المستخدم.");
      }
    });

    // التبرع بالعملات
    donateBtn.addEventListener("click", async () => {
      const targetUsername = document.getElementById("donateTo").value.trim();
      const amount = parseInt(document.getElementById("donateAmount").value);

      if (!targetUsername.startsWith("@") || isNaN(amount) || amount <= 0) {
        alert("يرجى إدخال اسم صحيح ومبلغ صحيح.");
        return;
      }

      if (targetUsername === userData.username) {
        alert("لا يمكنك التبرع لنفسك.");
        return;
      }

      if (userData.coins < amount) {
        alert("لا تملك رصيد كافٍ.");
        return;
      }

      // البحث عن المستخدم بواسطة اسم المستخدم
      const usernameDoc = await getDoc(doc(db, "usernames", targetUsername));
      if (!usernameDoc.exists()) {
        alert("لم يتم العثور على الحساب.");
        return;
      }

      const recipientId = usernameDoc.data().uid;
      const recipientRef = doc(db, "users", recipientId);

      await updateDoc(userRef, { coins: increment(-amount) });
      await updateDoc(recipientRef, { coins: increment(amount) });

      alert(`تم التبرع بـ ${amount} إلى ${targetUsername}`);
      location.reload();
    });

  } catch (error) {
    console.error("خطأ أثناء تحميل بيانات المستخدم:", error);
    alert("حدث خطأ، يرجى إعادة المحاولة.");
  }
});

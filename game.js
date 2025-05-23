import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
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

const userEmail = document.getElementById("userEmail");
const usernameDisplay = document.getElementById("usernameDisplay");
const editUsernameBtn = document.getElementById("editUsername");
const coinAmount = document.getElementById("coinAmount");
const donateBtn = document.getElementById("donateBtn");

onAuthStateChanged(auth, async (user) => {
  if (user) {
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

      let recipientRef = null;
      let recipientId = null;

      // البحث عن الحساب الآخر
      const usersSnap = await getDoc(doc(db, "users", uid));
      const usersQuery = await getDoc(doc(db, "usernames", targetUsername));

      if (usersQuery.exists()) {
        recipientId = usersQuery.data().uid;
        recipientRef = doc(db, "users", recipientId);
      } else {
        // حل مؤقت: تفحص كل المستخدمين (غير فعال جداً، يُفضل إنشاء collection 'usernames')
        alert("لم يتم العثور على الحساب.");
        return;
      }

      await updateDoc(userRef, { coins: increment(-amount) });
      await updateDoc(recipientRef, { coins: increment(amount) });

      alert(`تم التبرع بـ ${amount} إلى ${targetUsername}`);
      location.reload();
    });

  } else {
    window.location.href = "index.html"; // العودة إلى تسجيل الدخول إن لم يكن المستخدم موجود
  }
});

// 1) استيراد Firebase SDK (الإصدار 10)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 2) إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAuQJpBMSijYcYZQ8rAsdnKX-75s5x7qts",
  authDomain: "moneygame-2025.firebaseapp.com",
  projectId: "moneygame-2025",
  storageBucket: "moneygame-2025.appspot.com",
  messagingSenderId: "427481930723",
  appId: "1:427481930723:web:20ebe3ecfdd76cb5f0ded6"
};

// 3) تهيئة Firebase
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// 4) عناصر HTML
const userEmailSpan    = document.getElementById("userEmail");
const usernameDisplay  = document.getElementById("usernameDisplay");
const editBtn          = document.getElementById("editUsername");
const coinAmount       = document.getElementById("coinAmount");
const donateBtn        = document.getElementById("donateBtn");
const targetEmailInput = document.getElementById("targetEmail");
const amountInput      = document.getElementById("amount");

let currentUserUID = null;

// 5) إنشاء مستند المستخدم إذا لم يكن موجودًا
async function ensureUserDoc(user) {
  const userRef = doc(db, "users", user.uid);
  const snap    = await getDoc(userRef);

  if (!snap.exists()) {
    const initialData = {
      email: user.email,
      displayName: user.email.split("@")[0],
      coins: 100
    };
    await setDoc(userRef, initialData);
    return initialData;
  }

  return snap.data();
}

// 6) تحديث عناصر الصفحة ببيانات المستخدم
function updateUI(data) {
  userEmailSpan.textContent   = auth.currentUser.email;
  usernameDisplay.textContent = "@" + data.displayName;
  coinAmount.textContent      = data.coins;
}

// 7) التحقق من تسجيل الدخول
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "index.html";

  currentUserUID = user.uid;
  try {
    const data = await ensureUserDoc(user);
    updateUI(data);
  } catch (e) {
    console.error("فشل تحميل البيانات:", e);
    alert("حدث خطأ أثناء تحميل بيانات المستخدم.");
  }
});

// 8) تغيير اسم المستخدم
editBtn.addEventListener("click", async () => {
  const input = prompt("أدخل اسم جديد (بدون @):");

  if (!input || input.trim().length < 3) {
    return alert("الاسم يجب أن يتكون من 3 أحرف على الأقل.");
  }

  const newName = input.trim();
  const userRef = doc(db, "users", currentUserUID);

  try {
    await updateDoc(userRef, { displayName: newName });
    usernameDisplay.textContent = "@" + newName;
    alert("تم تحديث الاسم بنجاح!");
  } catch (e) {
    console.error("فشل تعديل الاسم:", e);
    alert("حدث خطأ أثناء تعديل الاسم.");
  }
});

// 9) التبرع بالعملات
donateBtn.addEventListener("click", async () => {
  const email  = targetEmailInput.value.trim().toLowerCase();
  const amount = parseInt(amountInput.value.trim(), 10);

  if (!email || isNaN(amount) || amount <= 0) {
    return alert("يرجى إدخال بريد صحيح ومبلغ أكبر من 0.");
  }

  if (email === auth.currentUser.email.toLowerCase()) {
    return alert("لا يمكنك التبرع لنفسك.");
  }

  try {
    const q = query(collection(db, "users"), where("email", "==", email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return alert("لم يتم العثور على المستخدم المستلم.");
    }

    const recipientRef = snapshot.docs[0].ref;
    const senderRef = doc(db, "users", currentUserUID);

    await runTransaction(db, async (t) => {
      const senderSnap = await t.get(senderRef);
      const recipientSnap = await t.get(recipientRef);

      if (!senderSnap.exists() || !recipientSnap.exists()) {
        throw new Error("تعذر العثور على بيانات المستخدمين.");
      }

      const senderCoins    = senderSnap.data().coins;
      const recipientCoins = recipientSnap.data().coins;

      if (senderCoins < amount) {
        throw new Error("رصيدك غير كافٍ.");
      }

      t.update(senderRef,    { coins: senderCoins - amount });
      t.update(recipientRef, { coins: recipientCoins + amount });
    });

    alert(`تم التبرع بـ ${amount} عملة إلى ${email}.`);

    // تحديث البيانات بعد التبرع
    const updatedData = (await getDoc(senderRef)).data();
    updateUI(updatedData);

    targetEmailInput.value = "";
    amountInput.value = "";

  } catch (e) {
    console.error("خطأ في التبرع:", e);
    alert(e.message || "حدث خطأ أثناء عملية التبرع.");
  }
});

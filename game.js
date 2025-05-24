// 1) استيراد Firebase SDKs إصدار 10
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

// 2) إعدادات Firebase (استبدل بالقيم لديك)
const firebaseConfig = {
  apiKey: "AIzaSyAuQJpBMSijYcYZQ8rAsdnKX-75s5x7qts",
  authDomain: "moneygame-2025.firebaseapp.com",
  projectId: "moneygame-2025",
  storageBucket: "moneygame-2025.appspot.com",
  messagingSenderId: "427481930723",
  appId: "1:427481930723:web:20ebe3ecfdd76cb5f0ded6"
};

// 3) التهيئة
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// 4) عناصر الواجهة
const userEmailSpan    = document.getElementById("userEmail");
const usernameDisplay  = document.getElementById("usernameDisplay");
const editBtn          = document.getElementById("editUsername");
const coinAmount       = document.getElementById("coinAmount");
const donateBtn        = document.getElementById("donateBtn");
const targetEmailInput = document.getElementById("targetEmail");
const amountInput      = document.getElementById("amount");

let currentUserUID = null;

// 5) إنشاء أو التأكد من مستند المستخدم
async function ensureUserDoc(user) {
  const userRef = doc(db, "users", user.uid);
  const snap    = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      email:       user.email,
      displayName: user.email.split("@")[0],
      coins:       100
    });
    return { displayName: user.email.split("@")[0], coins: 100 };
  }
  return snap.data();
}

// 6) تحديث الواجهة بناءً على بيانات Firestore
function updateUI(userData) {
  userEmailSpan.textContent   = auth.currentUser.email;
  usernameDisplay.textContent = "@" + userData.displayName;
  coinAmount.textContent      = userData.coins;
}

// 7) مراقبة حالة المصادقة
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  currentUserUID = user.uid;
  try {
    const userData = await ensureUserDoc(user);
    updateUI(userData);
  } catch (err) {
    console.error("Error in ensureUserDoc:", err);
    alert("حدث خطأ عند تحميل بياناتك.");
  }
});

// 8) تعديل اسم المستخدم
editBtn.addEventListener("click", async () => {
  const newName = prompt("أدخل اسم جديد (بدون @):");
  if (!newName || newName.trim().length < 3) {
    alert("الاسم يجب أن يتكون من 3 أحرف على الأقل.");
    return;
  }
  const displayName = newName.trim();
  const userRef     = doc(db, "users", currentUserUID);
  try {
    await updateDoc(userRef, { displayName });
    usernameDisplay.textContent = "@" + displayName;
    alert("تم تحديث الاسم بنجاح!");
  } catch (err) {
    console.error("Error updating displayName:", err);
    alert("فشل تحديث الاسم: " + err.message);
  }
});

// 9) زر التبرع باستخدام runTransaction
donateBtn.addEventListener("click", async () => {
  const targetEmail = targetEmailInput.value.trim().toLowerCase();
  const amount      = parseInt(amountInput.value.trim(), 10);

  // التحقق من المدخلات
  if (!targetEmail || isNaN(amount) || amount <= 0) {
    alert("يرجى إدخال بريد المستلم ومبلغ صالحين.");
    return;
  }
  if (targetEmail === auth.currentUser.email.toLowerCase()) {
    alert("لا يمكنك التبرع لنفسك.");
    return;
  }

  try {
    // 1) ابحث عن UID المستلم عبر البريد
    const q = query(
      collection(db, "users"),
      where("email", "==", targetEmail)
    );
    const querySnap = await getDocs(q);
    if (querySnap.empty) {
      alert("المستخدم المستلم غير موجود.");
      return;
    }
    const recipientRef = querySnap.docs[0].ref;

    // 2) نفذ المعاملة
    await runTransaction(db, async (t) => {
      const senderRef    = doc(db, "users", currentUserUID);
      const senderSnap   = await t.get(senderRef);
      const recipientSnap= await t.get(recipientRef);

      if (!senderSnap.exists() || !recipientSnap.exists()) {
        throw new Error("بيانات المستخدم غير موجودة.");
      }

      const senderCoins    = senderSnap.data().coins;
      const recipientCoins = recipientSnap.data().coins;

      if (senderCoins < amount) {
        throw new Error("رصيدك غير كافٍ.");
      }

      // تحديث الأرصدة
      t.update(senderRef,    { coins: senderCoins - amount });
      t.update(recipientRef, { coins: recipientCoins + amount });
    });

    alert(`تم التبرع بنجاح: أرسلت ${amount} عملة إلى ${targetEmail}`);
    // 3) تحديث الواجهة للمرسل
    const newSenderData = (await getDoc(doc(db, "users", currentUserUID))).data();
    updateUI(newSenderData);
    targetEmailInput.value = "";
    amountInput.value      = "";

  } catch (err) {
    console.error("Donation transaction error:", err);
    alert(err.message || "حدث خطأ أثناء عملية التبرع.");
  }
});

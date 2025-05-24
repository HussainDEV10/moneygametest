// استيراد Firebase SDKs (Firestore + Auth)
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
  getDocs
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

// عناصر الواجهة
const userEmailSpan    = document.getElementById("userEmail");
const usernameDisplay  = document.getElementById("usernameDisplay");
const editBtn          = document.getElementById("editUsername");
const coinAmount       = document.getElementById("coinAmount");
const donateBtn        = document.getElementById("donateBtn");
const targetEmailInput = document.getElementById("targetEmail");
const amountInput      = document.getElementById("amount");

let currentUserUID = null;

// دالة لإنشاء مستند المستخدم إذا لم يكن موجوداً
async function ensureUserDoc(user) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName || user.email.split("@")[0],
      coins: 100
    });
    return { coins: 100, displayName: user.displayName || user.email.split("@")[0] };
  } else {
    return snap.data();
  }
}

// تحديث الواجهة من Firestore
async function updateUI(userData) {
  userEmailSpan.textContent   = auth.currentUser.email;
  usernameDisplay.textContent = "@" + userData.displayName;
  coinAmount.textContent      = userData.coins;
}

// مراقبة حالة المصادقة
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  currentUserUID = user.uid;
  // إنشاء المستند أو جلب البيانات
  const userData = await ensureUserDoc(user);
  await updateUI(userData);
});

// تعديل الاسم (Firestore + Auth)
editBtn.addEventListener("click", async () => {
  const newName = prompt("أدخل اسم جديد (بدون @):");
  if (!newName || newName.trim().length < 3) {
    alert("الاسم يجب أن يتكون من 3 أحرف على الأقل.");
    return;
  }
  const displayName = newName.trim();
  const userRef = doc(db, "users", currentUserUID);
  try {
    // تحديث Firestore
    await updateDoc(userRef, { displayName });
    // تحديث الواجهة
    usernameDisplay.textContent = "@" + displayName;
    alert("تم تحديث الاسم بنجاح!");
  } catch (err) {
    alert("خطأ أثناء التحديث: " + err.message);
  }
});

// زر التبرع (Firestore transaction مبسط)
donateBtn.addEventListener("click", async () => {
  const targetEmail = targetEmailInput.value.trim().toLowerCase();
  const amount      = parseInt(amountInput.value.trim(), 10);
  if (!targetEmail || isNaN(amount) || amount <= 0) {
    alert("يرجى إدخال بريد المستلم ومبلغ صالحين.");
    return;
  }
  if (targetEmail === auth.currentUser.email.toLowerCase()) {
    alert("لا يمكنك التبرع لنفسك.");
    return;
  }

  // ابحث عن المستلم حسب البريد
  const q = query(
    collection(db, "users"),
    where("email", "==", targetEmail)
  );
  const querySnap = await getDocs(q);
  if (querySnap.empty) {
    alert("المستخدم المستلم غير موجود.");
    return;
  }
  const recipientDoc = querySnap.docs[0];
  const recipientRef = recipientDoc.ref;

  // جلب بيانات المرسل والمستلم
  const senderRef = doc(db, "users", currentUserUID);
  const [senderSnap, recipientSnap] = await Promise.all([
    getDoc(senderRef),
    getDoc(recipientRef)
  ]);

  const senderData    = senderSnap.data();
  const recipientData = recipientSnap.data();

  if (senderData.coins < amount) {
    alert("رصيدك غير كافٍ.");
    return;
  }

  // تحديث الأرصدة
  await Promise.all([
    updateDoc(senderRef,    { coins: senderData.coins - amount }),
    updateDoc(recipientRef, { coins: recipientData.coins + amount })
  ]);

  alert(`تمت عملية التبرع بنجاح: أرسلت ${amount} عملة إلى ${recipientData.displayName || recipientData.email}`);
  // تحديث الواجهة للمستخدم الحالي
  const newSenderData = await getDoc(senderRef);
  updateUI(newSenderData.data());
  // تنظيف الحقول
  targetEmailInput.value = "";
  amountInput.value      = "";
});

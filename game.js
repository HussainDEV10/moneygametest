// استيراد Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  get,
  update
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// إعداد Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAuQJpBMSijYcYZQ8rAsdnKX-75s5x7qts",
  authDomain: "moneygame-2025.firebaseapp.com",
  projectId: "moneygame-2025",
  storageBucket: "moneygame-2025.appspot.com",
  messagingSenderId: "427481930723",
  appId: "1:427481930723:web:20ebe3ecfdd76cb5f0ded6",
  databaseURL: "https://moneygame-2025-default-rtdb.firebaseio.com"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// عناصر الواجهة
const userEmailSpan    = document.getElementById("userEmail");
const usernameDisplay  = document.getElementById("usernameDisplay");
const editBtn          = document.getElementById("editUsername");
const coinAmount       = document.getElementById("coinAmount");
const donateBtn        = document.getElementById("donateBtn");
const targetEmailInput = document.getElementById("targetEmail");
const amountInput      = document.getElementById("amount");

let currentUserUID = null;

// عند تغيير حالة المصادقة (تسجيل دخول/خروج)
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // إذا لم يكن هناك مستخدم مسجل، أعيده للصفحة الرئيسية
    window.location.href = "index.html";
    return;
  }

  // تخزين UID
  currentUserUID = user.uid;

  // عرض البريد واسم المستخدم
  userEmailSpan.textContent   = user.email;
  usernameDisplay.textContent = user.displayName || "@username";

  // المرجع لمستند المستخدم في Realtime Database
  const userRef = ref(db, `users/${currentUserUID}`);
  const snap    = await get(userRef);

  if (!snap.exists()) {
    // أول دخول للمستخدم: إنشاء بياناته مع 100 عملة
    await set(userRef, {
      email:       user.email,
      displayName: user.displayName || "@username",
      coins:       100
    });
    coinAmount.textContent = 100;
  } else {
    // تحميل الرصيد الحالي
    coinAmount.textContent = snap.val().coins || 0;
  }
});

// تعديل اسم المستخدم
editBtn.addEventListener("click", () => {
  const newName = prompt("أدخل اسم جديد (بدون @):");
  if (!newName || newName.trim().length < 3) {
    alert("الاسم يجب أن يتكون من 3 أحرف على الأقل.");
    return;
  }
  const displayName = "@" + newName.trim();

  updateProfile(auth.currentUser, { displayName })
    .then(async () => {
      // تحديث العرض في الصفحة
      usernameDisplay.textContent = displayName;
      // تحديث الاسم في قاعدة البيانات
      await update(ref(db, `users/${currentUserUID}`), { displayName });
      alert("تم تحديث الاسم بنجاح!");
    })
    .catch((err) => {
      alert("خطأ أثناء التحديث: " + err.message);
    });
});

// زر التبرع
donateBtn.addEventListener("click", async () => {
  const targetEmail = targetEmailInput.value.trim().toLowerCase();
  const amount      = parseInt(amountInput.value.trim(), 10);

  // التحقق من صحة المدخلات
  if (!targetEmail || isNaN(amount) || amount <= 0) {
    alert("يرجى إدخال بريد المستلم ومبلغ صالحين.");
    return;
  }

  // البحث عن UID المستلم عبر الإيميل
  const allUsersSnap = await get(ref(db, "users/"));
  let recipientUID = null;
  allUsersSnap.forEach(childSnap => {
    if (childSnap.val().email.toLowerCase() === targetEmail) {
      recipientUID = childSnap.key;
    }
  });

  if (!recipientUID) {
    alert("المستخدم المستلم غير موجود.");
    return;
  }

  // مراجع المرسل والمستلم
  const senderRef    = ref(db, `users/${currentUserUID}`);
  const recipientRef = ref(db, `users/${recipientUID}`);

  // جلب بياناتهما
  const senderSnap    = await get(senderRef);
  const recipientSnap = await get(recipientRef);

  const senderCoins    = senderSnap.val().coins || 0;
  const recipientCoins = recipientSnap.val().coins || 0;

  // التحقق من كفاية الرصيد
  if (senderCoins < amount) {
    alert("رصيدك غير كافٍ.");
    return;
  }

  // تحديث الأرصدة في القاعدة
  await update(senderRef,    { coins: senderCoins - amount });
  await update(recipientRef, { coins: recipientCoins + amount });

  // تحديث الواجهة للمستخدم الحالي
  coinAmount.textContent = senderCoins - amount;
  alert(`تمت عملية التبرع بنجاح: أرسلت ${amount} عملة إلى ${targetEmail}`);
  
  // إفراغ الحقول
  targetEmailInput.value = "";
  amountInput.value      = "";
});

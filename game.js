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
  update,
  child,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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

const userEmailSpan = document.getElementById("userEmail");
const usernameDisplay = document.getElementById("usernameDisplay");
const editBtn = document.getElementById("editUsername");
const coinAmount = document.getElementById("coinAmount");

let currentUserUID = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    userEmailSpan.textContent = user.email;
    usernameDisplay.textContent = user.displayName || "@username";
    currentUserUID = user.uid;

    const userRef = ref(db, 'users/' + user.uid);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      // أول مرة يسجل دخول
      set(userRef, {
        email: user.email,
        displayName: user.displayName || "@username",
        coins: 100
      });
      coinAmount.textContent = 100;
    } else {
      coinAmount.textContent = snapshot.val().coins || 0;
    }
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
        update(ref(db, 'users/' + currentUserUID), { displayName });
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
document.getElementById("donateBtn").addEventListener("click", async () => {
  const targetEmail = document.getElementById("targetEmail").value.trim().toLowerCase();
  const amount = parseInt(document.getElementById("amount").value.trim());

  if (!targetEmail || isNaN(amount) || amount <= 0) {
    alert("أدخل بيانات صحيحة.");
    return;
  }

  const usersRef = ref(db, "users/");
  const usersSnap = await get(usersRef);
  let recipientUID = null;

  usersSnap.forEach((childSnap) => {
    if (childSnap.val().email.toLowerCase() === targetEmail) {
      recipientUID = childSnap.key;
    }
  });

  if (!recipientUID) {
    alert("المستخدم غير موجود.");
    return;
  }

  const senderRef = ref(db, "users/" + currentUserUID);
  const recipientRef = ref(db, "users/" + recipientUID);

  const senderSnap = await get(senderRef);
  const recipientSnap = await get(recipientRef);

  const senderCoins = senderSnap.val().coins || 0;

  if (senderCoins < amount) {
    alert("ليس لديك رصيد كافٍ.");
    return;
  }

  await update(senderRef, { coins: senderCoins - amount });
  await update(recipientRef, {
    coins: (recipientSnap.val().coins || 0) + amount
  });

  coinAmount.textContent = senderCoins - amount;
  alert("تم إرسال " + amount + " عملة بنجاح إلى " + targetEmail);
});

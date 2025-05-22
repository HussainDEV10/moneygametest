<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
  import {
    getAuth,
    onAuthStateChanged,
    updateProfile
  } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
  import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    getDocs,
    collection
  } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

  // إعدادات Firebase
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

  const userEmailSpan = document.getElementById("userEmail");
  const usernameDisplay = document.getElementById("usernameDisplay");
  const editBtn = document.getElementById("editUsername");
  const coinAmount = document.getElementById("coinAmount");
  const donateForm = document.getElementById("donateForm");
  const donateMessage = document.getElementById("donateMessage");

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      userEmailSpan.textContent = user.email;
      usernameDisplay.textContent = user.displayName || "@username";

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // إنشاء مستند جديد برصيد 100 عملة
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || "@username",
          coins: 100
        });
        coinAmount.textContent = 100;
      } else {
        const data = userSnap.data();
        coinAmount.textContent = data.coins || 0;
      }
    } else {
      window.location.href = "index.html";
    }
  });

  editBtn.addEventListener("click", async () => {
    const newName = prompt("أدخل اسم جديد (بدون @):");
    if (newName && newName.trim().length >= 3) {
      const displayName = "@" + newName.trim();
      try {
        await updateProfile(auth.currentUser, { displayName });
        usernameDisplay.textContent = displayName;

        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, { displayName });

        alert("تم تحديث الاسم بنجاح!");
      } catch (error) {
        alert("فشل التحديث: " + error.message);
      }
    } else {
      alert("الاسم يجب أن يكون على الأقل 3 أحرف.");
    }
  });

  donateForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      donateMessage.textContent = "يجب تسجيل الدخول أولاً.";
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
      let senderId = null;
      let recipientId = null;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.email === recipientEmail) {
          recipientDoc = data;
          recipientId = docSnap.id;
        }
        if (data.email === user.email) {
          senderDoc = data;
          senderId = docSnap.id;
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

      // تنفيذ التحديثات
      await updateDoc(doc(db, "users", senderId), {
        coins: senderDoc.coins - donateAmount
      });

      await updateDoc(doc(db, "users", recipientId), {
        coins: (recipientDoc.coins || 0) + donateAmount
      });

      coinAmount.textContent = senderDoc.coins - donateAmount;
      donateMessage.textContent = `تم التبرع بـ ${donateAmount} عملة إلى ${recipientEmail}`;
    } catch (error) {
      console.error(error);
      donateMessage.textContent = "حدث خطأ أثناء التبرع.";
    }
  });
</script>

// استيراد الوظائف من Firebase SDK (تأكد من إعداد Firebase مسبقاً في مشروعك)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// إعدادات Firebase الخاصة بك
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// دالة لإنشاء مستند مستخدم إذا لم يكن موجودًا
async function createUserDocIfNotExists(user) {
  const userDocRef = doc(db, "users", user.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (!userDocSnap.exists()) {
    await setDoc(userDocRef, {
      email: user.email,
      username: user.email.split('@')[0],  // يمكنك تعديلها لاحقًا
      coins: 1000  // رصيد ابتدائي
    });
  }
}

// تحديث عرض البيانات في الصفحة
async function updateUI(user) {
  const userDocRef = doc(db, "users", user.uid);
  const userDocSnap = await getDoc(userDocRef);
  if (userDocSnap.exists()) {
    const data = userDocSnap.data();
    document.getElementById("userEmail").textContent = data.email;
    document.getElementById("usernameDisplay").textContent = "@" + data.username;
    document.getElementById("coinAmount").textContent = data.coins;
  }
}

// التعامل مع حالة تسجيل الدخول
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await createUserDocIfNotExists(user);
    await updateUI(user);
  } else {
    // إذا لم يكن المستخدم مسجلاً، يمكن توجيهه لتسجيل الدخول
    document.getElementById("userEmail").textContent = "يرجى تسجيل الدخول";
    document.getElementById("usernameDisplay").textContent = "@guest";
    document.getElementById("coinAmount").textContent = "0";
  }
});

// زر التبرع
document.getElementById("donateBtn").addEventListener("click", async () => {
  const sender = auth.currentUser;
  if (!sender) {
    alert("يجب تسجيل الدخول أولاً!");
    return;
  }

  const targetEmail = document.getElementById("targetEmail").value.trim();
  const amount = parseInt(document.getElementById("amount").value);

  if (!targetEmail || isNaN(amount) || amount <= 0) {
    alert("يرجى إدخال بريد المستلم والمبلغ بشكل صحيح.");
    return;
  }

  if (targetEmail === sender.email) {
    alert("لا يمكنك التبرع لنفسك.");
    return;
  }

  // ابحث عن المستخدم المستلم في قاعدة البيانات
  const usersCollectionRef = doc(db, "users");
  try {
    // بحث عن المستلم عبر البريد الإلكتروني (نحتاج لإجراء بحث عبر مجموعة المستخدمين)
    // للأسف Firestore لا يدعم البحث المباشر بدون فهرس، لذا ننفذ بحث عبر جلب كل المستخدمين (غير مثالي في مشاريع كبيرة)
    // البديل الأفضل: استخدام قاعدة بيانات تحتوي على إسناد البريد إلى uid أو استخدام Firebase Functions

    // هنا طريقة مبسطة جداً (تنصح بتحسينها في المشروع الحقيقي)
    const usersQuerySnapshot = await getDoc(doc(db, "users", sender.uid)); // هذا فقط المستند الخاص بالمرسل، نحتاج البحث عن المستلم

    // هنا بدلاً من البحث المعقد، سأفترض أن البريد الخاص بالمستلم معروف بالفعل uid له أو أن لديك خريطة في قاعدة بيانات (لتحديث لاحق)

    // لذلك سأعطيك دالة للبحث عن uid لمستخدم بواسطة البريد (طريقة غير مثالية):
    const usersRef = await getDocs(collection(db, "users"));
    let targetUid = null;
    usersRef.forEach(docSnap => {
      if (docSnap.data().email === targetEmail) {
        targetUid = docSnap.id;
      }
    });

    if (!targetUid) {
      alert("لم يتم العثور على المستلم.");
      return;
    }

    // جلب بيانات المرسل والمستلم
    const senderDocRef = doc(db, "users", sender.uid);
    const senderDocSnap = await getDoc(senderDocRef);

    const targetDocRef = doc(db, "users", targetUid);
    const targetDocSnap = await getDoc(targetDocRef);

    if (!senderDocSnap.exists() || !targetDocSnap.exists()) {
      alert("حدث خطأ في البيانات.");
      return;
    }

    const senderData = senderDocSnap.data();
    const targetData = targetDocSnap.data();

    if (senderData.coins < amount) {
      alert("رصيدك غير كافٍ.");
      return;
    }

    // تحديث الأرصدة بشكل آمن
    await updateDoc(senderDocRef, {
      coins: senderData.coins - amount
    });

    await updateDoc(targetDocRef, {
      coins: targetData.coins + amount
    });

    alert(`تم التبرع بـ ${amount} عملات إلى ${targetData.username}`);

    // تحديث الواجهة
    await updateUI(sender);

  } catch (error) {
    console.error("خطأ في التبرع:", error);
    alert("حدث خطأ أثناء عملية التبرع.");
  }
});

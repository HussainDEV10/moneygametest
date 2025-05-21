const firebaseConfig = {
  apiKey: "AIzaSyAuQJpBMSijYcYZQ8rAsdnKX-75s5x7qts",
  authDomain: "moneygame-2025.firebaseapp.com",
  projectId: "moneygame-2025",
  storageBucket: "moneygame-2025.firebasestorage.app",
  messagingSenderId: "427481930723",
  appId: "1:427481930723:web:20ebe3ecfdd76cb5f0ded6"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      db.collection("users").doc(user.uid).set({
        email: email,
        balance: 1000
      });
      document.getElementById("status").innerText = "تم إنشاء الحساب!";
    })
    .catch((error) => {
      document.getElementById("status").innerText = "خطأ: " + error.message;
    });
}

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      document.getElementById("status").innerText = "تم تسجيل الدخول!";
      // redirect to game.html later
    })
    .catch((error) => {
      document.getElementById("status").innerText = "خطأ: " + error.message;
    });
    }

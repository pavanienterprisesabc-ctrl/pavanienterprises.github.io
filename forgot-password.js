// 🔥 FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyBD9ml42x0fesLcf3fReCoureRJEsf5E5Q",
  authDomain: "pavani-auth.firebaseapp.com",
  projectId: "pavani-auth",
  appId: "1:432020373990:web:462a69f39757a1a325d627"
};

// Prevent re-initialization
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

// ================= POPUP =================
function showPopup(message) {
  document.getElementById("popup-text").innerText = message;
  document.getElementById("popup").classList.remove("hidden");
}

function closePopup() {
  document.getElementById("popup").classList.add("hidden");
}

// ================= SEND RESET LINK =================
function sendResetLink() {
  const email = document.getElementById("email").value.trim();

  // Mandatory field check
  if (!email) {
    showPopup("Please enter your registered email address.");
    return;
  }

  // Send password reset email via Firebase
  auth.sendPasswordResetEmail(email)
    .then(() => {
      showPopup(
        "Password reset link has been sent to your email. Please check your inbox or spam box of your email."
      );

      // Redirect to login page after short delay
      setTimeout(() => {
        window.location.href = "login.html";
      }, 7000);
    })
    .catch((error) => {
      if (error.code === "auth/user-not-found") {
        showPopup("This email is not registered.");
      } else if (error.code === "auth/invalid-email") {
        showPopup("Please enter a valid email address.");
      } else {
        showPopup(error.message);
      }
    });
}

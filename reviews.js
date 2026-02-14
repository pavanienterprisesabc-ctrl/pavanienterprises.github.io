// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBD9ml42x0fesLcf3fReCoureRJEsf5E5Q",
  authDomain: "pavani-auth.firebaseapp.com",
  projectId: "pavani-auth"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;

// 🔔 POPUP FUNCTION
function showPopup(message = "You must login first") {
  const popup = document.getElementById("globalPopup");
;  const popupText = document.getElementById("popupMessage");

  popupText.innerText = message;
  popup.style.display = "flex";
}

function closePopup() {
  document.getElementById("globalPopup").style.display = "none";
}

// Auth state
auth.onAuthStateChanged(async user => {
  currentUser = user;

  document.getElementById("addReviewSection").style.display = "block";

  if (user) {
    const userRef = db.collection("users").doc(user.uid);
    const snap = await userRef.get();

    if (!snap.exists) {
      const usernameSnap = await db
        .collection("usernames")
        .where("uid", "==", user.uid)
        .limit(1)
        .get();

      const chosenUsername = usernameSnap.empty
        ? "User"
        : usernameSnap.docs[0].id;

      await userRef.set({
        username: chosenUsername
      });
    }

    const reviewDoc = await db.collection("reviews").doc(user.uid).get();
    if (reviewDoc.exists) {
      document.getElementById("rating").value = reviewDoc.data().rating;
      document.getElementById("reviewText").value = reviewDoc.data().text;
    }
  }

  loadReviews();
});

// Save / Update review
async function saveReview() {
  if (!currentUser) return showPopup("Login first to submit a review");

  const rating = Number(document.getElementById("rating").value);
  const text = document.getElementById("reviewText").value;

  const userDoc = await db.collection("users").doc(currentUser.uid).get();
  const username =
    userDoc.exists && userDoc.data().username
      ? userDoc.data().username
      : "Anonymous";

  await db.collection("reviews").doc(currentUser.uid).set({
    uid: currentUser.uid,
    username,
    rating,
    text,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    helpfulBy: [],
    notHelpfulBy: []
  });

  loadReviews();
}

// Delete review
async function deleteReview() {
  if (!currentUser) return showPopup("Login first to delete your review");

  await db.collection("reviews").doc(currentUser.uid).delete();
  document.getElementById("reviewText").value = "";
  loadReviews();
}

// Time formatter
function timeAgo(timestamp) {
  if (!timestamp) return "";
  const seconds = Math.floor((Date.now() - timestamp.toDate()) / 1000);
  const intervals = [
    { label: "year", secs: 31536000 },
    { label: "month", secs: 2592000 },
    { label: "day", secs: 86400 },
    { label: "hour", secs: 3600 },
    { label: "minute", secs: 60 }
  ];
  for (const i of intervals) {
    const count = Math.floor(seconds / i.secs);
    if (count >= 1) return `${count} ${i.label}${count > 1 ? "s" : ""} ago`;
  }
  return "Just now";
}

// ⭐ Filter Function (Amazon Style)
function filterReviews(star) {
  const reviews = document.querySelectorAll("#reviewsList .review-box");

  reviews.forEach((box, index) => {
    if (index === 0) return;

    const ratingText = box.querySelector(".rating").innerText;
    const ratingCount = (ratingText.match(/★/g) || []).length;

    box.style.display = ratingCount === star ? "block" : "none";
  });
}

// Load reviews + Amazon style summary
async function loadReviews() {
  const list = document.getElementById("reviewsList");
  list.innerHTML = "";

  const snapshot = await db
    .collection("reviews")
    .orderBy("createdAt", "desc")
    .get();

  let total = 0;
  let sum = 0;
  const starCount = [0, 0, 0, 0, 0];

  snapshot.forEach(doc => {
    const r = doc.data();
    total++;
    sum += r.rating;
    starCount[r.rating - 1]++;
  });

  if (total > 0) {
    const avg = (sum / total).toFixed(1);

    const summary = document.createElement("div");
    summary.className = "review-box";

    summary.innerHTML = `
      <div style="max-width:500px">

        <div style="display:flex;align-items:center;gap:10px;">
          <div style="font-size:28px;font-weight:600;color:#ffd369;">
            ${avg}
          </div>

          <div style="position:relative;font-size:20px;color:#ddd;">
            ★★★★★
            <div style="
              position:absolute;
              top:0;
              left:0;
              white-space:nowrap;
              overflow:hidden;
              width:${(avg/5)*100}%;
              color:#ffa41c;">
              ★★★★★
            </div>
          </div>
        </div>

        <div style="color:#ccc;font-size:14px;margin-bottom:15px;">
          ${total} global ratings
        </div>

        ${[5,4,3,2,1].map(star => {
          const count = starCount[star - 1];
          const percent = ((count / total) * 100).toFixed(0);

          return `
            <div 
              onclick="filterReviews(${star})"
              onmouseover="this.style.opacity='0.8'"
              onmouseout="this.style.opacity='1'"
              style="display:flex;align-items:center;gap:10px;margin-bottom:6px;cursor:pointer;">

              <div style="width:60px;color:#ffd369;font-size:14px;">
                ${star} star
              </div>

              <div style="
                flex:1;
                background:#3a3a3a;
                height:12px;
                border-radius:6px;
                overflow:hidden;">
                
                <div style="
                  width:${percent}%;
                  background:#ffa41c;
                  height:100%;
                  border-radius:6px;
                  transition:width 0.4s ease;">
                </div>

              </div>

              <div style="width:40px;text-align:right;color:#ccc;font-size:13px;">
                ${percent}%
              </div>
            </div>
          `;
        }).join("")}

      </div>
    `;

    list.appendChild(summary);
  }

  snapshot.forEach(doc => {
    const r = doc.data();

    const helpfulCount = r.helpfulBy?.length || 0;
    const notHelpfulCount = r.notHelpfulBy?.length || 0;

    const div = document.createElement("div");
    div.className = "review-box";

    div.innerHTML = `
      <div class="username">${r.username}</div>
      <div class="rating">${"★".repeat(r.rating)} <span style="color:#ccc;font-size:13px;">(${r.rating}/5)</span></div>
      <p>${r.text}</p>
      <small style="color:#ccc;">${timeAgo(r.createdAt)}</small>

      <div class="actions">
        <button onclick="vote('${doc.id}', true)">Helpful (${helpfulCount})</button>
        <button onclick="vote('${doc.id}', false)">Not Helpful (${notHelpfulCount})</button>
      </div>
    `;

    list.appendChild(div);
  });
}

// Voting logic
async function vote(reviewUid, isHelpful) {
  if (!currentUser) return showPopup("Login first to vote on reviews");

  if (reviewUid === currentUser.uid) {
    return showPopup("You cannot vote your own review");
  }

  const ref = db.collection("reviews").doc(reviewUid);
  const doc = await ref.get();
  if (!doc.exists) return;

  const data = doc.data();

  if (
    data.helpfulBy.includes(currentUser.uid) ||
    data.notHelpfulBy.includes(currentUser.uid)
  ) {
    return showPopup("You already voted on this review");
  }

  await ref.update({
    [isHelpful ? "helpfulBy" : "notHelpfulBy"]:
      firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
  });

  loadReviews();
}

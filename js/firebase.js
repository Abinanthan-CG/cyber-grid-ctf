import { initializeApp }                        from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getDatabase, ref, set, get, update,
         onValue, push, serverTimestamp }        from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDKKMNXFrwtEzAw7vGfPUPCTfI3LkPWXLs",
  authDomain:        "cyber-grid-ctf.firebaseapp.com",
  databaseURL:       "https://cyber-grid-ctf-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "cyber-grid-ctf",
  storageBucket:     "cyber-grid-ctf.firebasestorage.app",
  messagingSenderId: "579249626650",
  appId:             "1:579249626650:web:4d8bc462623fa12582bba3"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

export { db, ref, set, get, update, onValue, push, serverTimestamp };

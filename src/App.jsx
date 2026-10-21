import React, { useState, useEffect } from "react";
import { auth, db, storage } from "./firebase"; 
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
sendEmailVerification,sendPasswordResetEmail,
reload
} from "firebase/auth";
import { 
  collection, 
  addDoc, 
  getDocs, 
  setDoc, 
  doc, 
  query, 
  orderBy,
  updateDoc,
  deleteDoc,
  getDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const CATEGORIES = ["All", "Electronics", "Books", "Fashion", "Hostel Items", "Food/Groceries", "Others"];
const ADMIN_EMAIL = "sagewitty53@gmail.com";

function App() {
  // --- AUTH STATES ---
  const [user, setUser] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [fullName, setFullName] = useState(""); 
  const [view, setView] = useState("home"); // "home", "about", "admin"

  // --- MARKETPLACE STATES ---
  const [items, setItems] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]); 
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategory, setItemCategory] = useState("Electronics");
  const [itemDescription, setItemDescription] = useState("");
  const [itemImage, setItemImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  // --- SEARCH, FILTERS &WISHLIST ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem("uniKart_wishlist");
    return saved ? JSON.parse(saved) : [];
  });
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
const [selectedImage, setSelectedImage] = useState(null);

  // Monitor Authentication State change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Sync wishlist to local storage
  useEffect(() => {
    localStorage.setItem("uniKart_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  // Fetch Marketplace Items from Firestore
  const fetchItems = async () => {
    try {
      const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const itemsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(itemsList);
    } catch (err) {
      console.error("Error fetching items:", err);
    }
  };

  // Fetch verified users for admin overview
  const fetchAdminData = async () => {
    if (user && user.email === ADMIN_EMAIL) {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        setAdminUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchItems();
      if (user.email === ADMIN_EMAIL) {
        fetchAdminData();
      }
    }
  }, [user, view]);

  // --- AUTHENTICATION ACTIONS ---
  const handleSignUp = async () => {
    if (!fullName || !email || !password || !matricNumber || !whatsappNumber) {
      alert("Please fill all registration fields");
      return;
    }
    let phone = whatsappNumber.trim();
    if (phone.startsWith("0")) phone = "234" + phone.substring(1);

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
await updateProfile(res.user, { displayName: fullName.trim() });
await sendEmailVerification(res.user, {
  url: "https://sage-unikart.vercel.app",
  handleCodeInApp: false
});
      await setDoc(doc(db, "users", res.user.uid), {
        uid: res.user.uid,
        name: fullName.trim(),
        email: email.trim(),
        matricNumber: matricNumber.trim(),
        whatsapp: phone
      });
      alert("Account registered successfully on sage-uniKart!");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) return alert("Please enter email and password");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert(err.message);
    }
  };
const handlePasswordReset = async () => {
  if (!email.trim()) {
    return alert("Please enter your email address first.");
  }

  try {
    await sendPasswordResetEmail(auth, email.trim());
    alert("Password reset email sent. Check your inbox and Spam folder.");
  } catch (err) {
    alert("Password reset failed: " + err.message);
  }
};  const checkEmailVerification = async () => {
    if (!auth.currentUser) return;

    await reload(auth.currentUser);

    if (auth.currentUser.emailVerified) {
      alert("Email verified successfully! Welcome to sage-uniKart.");
      setUser(auth.currentUser);
    } else {
      alert("Your email is not verified yet. Please check your inbox.");
    }
  };
  const handleSignOut = async () => {
    await signOut(auth);
    setView("home");
  };

  // --- MARKETPLACE MANAGEMENT ACTIONS ---
  const addItem = async () => {
    if (!itemName || !itemPrice || !itemDescription || !itemImage) {
      alert("Please enter all details and upload an image");
      return;
    }
    setUploading(true);
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};

// 1. Upload directly to your free Cloudinary account instead
const formData = new FormData();
formData.append("file", itemImage); // Fits your existing state variable name 'itemImage'
formData.append("upload_preset", "unikart_upload");

const clResponse = await fetch("https://api.cloudinary.com/v1_1/domjyslu0/image/upload", {
  method: "POST",
  body: formData
});

const clData = await clResponse.json();

if (!clData.secure_url) {
  throw new Error("Cloudinary upload failed: " + (clData.error?.message || "Unknown error"));
}

// 2. Capture the newly generated live web link
const imageUrl = clData.secure_url; 

      await addDoc(collection(db, "items"), {
        name: itemName.trim(),
        price: Number(itemPrice),
        category: itemCategory,
        description: itemDescription.trim(),
        imageUrl: imageUrl,
sellerUid: user.uid,
sellerEmail: user.email,
// If it's you (the admin), it forces your number. Otherwise, it uses the vendor's database number!
sellerPhone: user.email === ADMIN_EMAIL ? "2349035861907" : (whatsappNumber || userData.whatsapp || "2348000000000"),
isSold: false,
        createdAt: new Date().toISOString()
      });

      setItemName("");
      setItemPrice("");
      setItemDescription("");
      setItemImage(null);
      alert("Product item posted successfully!");
      fetchItems();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleSoldStatus = async (itemId, currentStatus) => {
    try {
      await updateDoc(doc(db, "items", itemId), { isSold: !currentStatus });
      fetchItems();
    } catch (err) {
      alert("Failed updating status: " + err.message);
    }
  };

  const deleteListing = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this product listing?")) {
      await deleteDoc(doc(db, "items", itemId));
      fetchItems();
    }
  };
const deleteUserRecord = async (userId, userFullName) => {
  if (user.email !== ADMIN_EMAIL) return;
  if (window.confirm(`CRITICAL WARNING:\nAre you sure you want to permanently delete user profile "${userFullName}" from sage-uniKart database logs?`)) {
    try {
      await deleteDoc(doc(db, "users", userId));
      alert("User profile successfully expunged.");
      fetchAdminData(); // Refresh the list automatically
    } catch (err) {
      alert("Admin execution failure: " + err.message);
    }
  }
};

  const toggleWishlist = (id) => {
    if (wishlist.includes(id)) {
      setWishlist(wishlist.filter(item => item !== id));
    } else {
      setWishlist([...wishlist, id]);
    }
  };

  // --- RENDERING FILTERS ---
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesWishlist = !showWishlistOnly || wishlist.includes(item.id);
    return matchesSearch && matchesCategory && matchesWishlist;
  });

  // --- GATEWAY SCREEN: LOGIN / SIGN UP ---
  if (!user) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#0f172a", padding: "20px" }}>
        <div style={{ background: "#1e293b", padding: "35px", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.3)", width: "100%", maxWidth: "400px", color: "#fff", boxSizing: "border-box" }}>
          <h2 style={{ textAlign: "center", margin: "0 0 5px 0", color: "#38bdf8", fontSize: "1.8rem", fontWeight: "800" }}>sage-uniKart 🛒</h2>
          <p style={{ textAlign: "center", color: "#94a3b8", margin: "0 0 25px 0", fontSize: "0.9rem" }}>Campus Commerce Made Secure</p>

          {isSignUp && (
            <input
              placeholder="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ width: "100%", padding: "12px", margin: "8px 0", borderRadius: "8px", border: "1px solid #334155", boxSizing: "border-box", color: "#fff", backgroundColor: "#0f172a", fontSize: "1rem" }}
            />
          )}

          <input 
            placeholder="Student Email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={{ width: "100%", padding: "12px", margin: "8px 0", borderRadius: "8px", border: "1px solid #334155", boxSizing: "border-box", color: "#fff", backgroundColor: "#0f172a", fontSize: "1rem" }}
          />
          
          <input 
            placeholder="Password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ width: "100%", padding: "12px", margin: "8px 0", borderRadius: "8px", border: "1px solid #334155", boxSizing: "border-box", color: "#fff", backgroundColor: "#0f172a", fontSize: "1rem" }}
          />

          {isSignUp && (
            <>
              <input 
                placeholder="Matric Number" 
                type="text" 
                value={matricNumber} 
                onChange={(e) => setMatricNumber(e.target.value)} 
                style={{ width: "100%", padding: "12px", margin: "8px 0", borderRadius: "8px", border: "1px solid #334155", boxSizing: "border-box", color: "#fff", backgroundColor: "#0f172a", fontSize: "1rem" }}
          />
              <input
                placeholder="WhatsApp Phone (e.g. 080...)"
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                style={{ width: "100%", padding: "12px", margin: "8px 0", borderRadius: "8px", border: "1px solid #334155", boxSizing: "border-box", color: "#fff", backgroundColor: "#0f172a", fontSize: "1rem" }}
              />
            </>
          )}

                    <button
            onClick={isSignUp ? handleSignUp : handleSignIn}
            style={{ width: "100%", padding: "14px", marginTop: "15px", background: "#0284c7", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "1rem" }}
          >
            {isSignUp ? "Register Campus Profile" : "Secure Login"}
          </button>{!isSignUp && (
  <p
    onClick={handlePasswordReset}
    style={{
      textAlign: "center",
      color: "#38bdf8",
      cursor: "pointer",
      marginTop: "12px"
    }}
  >
    Forgot Password?
  </p>
)}

          <p style={{ textAlign: "center", fontSize: "0.9rem", marginTop: "20px", cursor: "pointer", color: "#38bdf8" }} onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? "Already have an account? Sign In" : "New vendor? Create profile here"}
          </p>
                </div>
      </div>
      );
}

if (!user.emailVerified) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#0f172a", padding: "20px" }}>
      <div style={{ background: "#1e293b", padding: "35px", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.3)", width: "100%", maxWidth: "400px", color: "#fff", boxSizing: "border-box", textAlign: "center" }}>
        
        <div style={{ fontSize: "3rem", marginBottom: "10px" }}>📧</div>

        <h2 style={{ color: "#38bdf8", marginBottom: "10px" }}>
          Verify Your Email
        </h2>

        <p style={{ color: "#cbd5e1", lineHeight: "1.6" }}>
          We've sent a verification link to:
        </p>

        <p style={{ color: "#fff", fontWeight: "bold", wordBreak: "break-word" }}>
          {user.email}
        </p>

        <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: "1.5" }}>
          Please check your inbox and click the verification link before accessing sage-uniKart.
        </p>

        <button
          onClick={checkEmailVerification}
          style={{ width: "100%", padding: "14px", marginTop: "15px", background: "#0284c7", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "1rem" }}
        >
          I've Verified My Email
        </button>

        <button
          onClick={async () => {
            try {
              await sendEmailVerification(auth.currentUser);
              alert("Verification email sent again. Please check your inbox.");
            } catch (err) {
              alert(err.message);
            }
          }}
          style={{ width: "100%", padding: "12px", marginTop: "10px", background: "transparent", color: "#38bdf8", border: "1px solid #38bdf8", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
        >
          Resend Verification Email
        </button>

        <button
          onClick={handleSignOut}
          style={{ width: "100%", padding: "12px", marginTop: "10px", background: "#334155", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
        >
          Sign Out
        </button>

      </div>
    </div>
  );
}

// --- CORE SYSTEM INTERFACE AREA ---
return (

    <div style={{ fontFamily: "'Segoe UI', Roboto, sans-serif", backgroundColor: "#0f172a", color: "#f8fafc", minHeight: "100vh", paddingBottom: "60px" }}>
      
      {/* GLOBAL APPLICATION TOP-NAVIGATION HEADER */}
      <div style={{ background: "#1e293b", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", position: "sticky", top: 0, zIndex: 100 }}>
        <div>
  <h1 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "#38bdf8", letterSpacing: "0.5px" }}>sage-uniKart 🛒</h1>
  <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>
    Hi, {user.displayName?.trim().split(" ")[0] || "there"} 👋
  </p>
</div>
        
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => setView("home")} style={{ background: view === "home" ? "#38bdf8" : "#334155", color: view === "home" ? "#0f172a" : "#fff", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold", transition: "all 0.2s" }}>Home</button>
          <button onClick={() => setView("about")} style={{ background: view === "about" ? "#38bdf8" : "#334155", color: view === "about" ? "#0f172a" : "#fff", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold", transition: "all 0.2s" }}>About</button>
          
          {/* SECURE ADMIN GATECHECK FOR YOUR LOGGED EMAIL */}
          {user.email === ADMIN_EMAIL && (
            <button onClick={() => setView("admin")} style={{ background: view === "admin" ? "#f59e0b" : "#b45309", color: "white", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "900" }}>👑 Admin</button>
          )}
          
          <button onClick={handleSignOut} style={{ background: "#ef4444", color: "white", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}>Exit</button>
        </div>
      </div>

      <div style={{ maxWidth: "600px", margin: "20px auto", padding: "0 15px", boxSizing: "border-box" }}>
        
        {/* VIEW DETOUR 1: SYSTEM MASTER ADMINISTRATIVE PRIVILEGE VIEW */}
        {view === "admin" && user.email === ADMIN_EMAIL ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid #f59e0b" }}>
              <h2 style={{ margin: 0, color: "#f59e0b", fontSize: "1.4rem", fontWeight: "800" }}>Admin Command Dashboard</h2>
              <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "5px 0 0 0" }}>System Control: Active Listings ({items.length}) | Registered Profiles ({adminUsers.length})</p>
            </div>

            <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
              <h3 style={{ marginTop: 0, color: "#38bdf8", fontSize: "1.1rem", borderBottom: "1px solid #334155", paddingBottom: "8px" }}>Registered Campus Users</h3>
              {adminUsers.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>No users registered in database records.</p>
              ) : (
                adminUsers.map(u => (
                  <div key={u.id} style={{ padding: "12px 0", borderBottom: "1px solid #334155", fontSize: "0.85rem" }}>
                    <div style={{ fontWeight: "bold", color: "#f8fafc" }}>{u.name}</div>
                    <div style={{ color: "#94a3b8", marginTop: "3px" }}>Email: {u.email} | Matric: {u.matricNumber}</div>
                    <div style={{ color: "#38bdf8", marginTop: "2px" }}>WhatsApp Connection Base: +{u.whatsapp}</div> 
<button
onClick={() => deleteUserRecord(u.id, u.name)}
style={{ background: "#ef4444", color: "white", border: "none", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "bold", marginTop: "8px" }}
>
Terminate Account
</button>
                  </div>
                ))
              )}
            </div>

          </div>
        ) : view === "about" ? (
          /* VIEW DETOUR 2: TERMS, SERVICES & TRUST PARAMETERS */
          <div style={{ background: "#1e293b", padding: "25px", borderRadius: "12px", border: "1px solid #334155" }}>
            <h2 style={{ marginTop: 0, color: "#38bdf8", fontWeight: "800" }}>About sage-uniKart</h2>
            <p style={{ lineHeight: "1.6", color: "#cbd5e1", fontSize: "0.95rem" }}>sage-uniKart is a high-performance student marketplace optimized for secure peer commerce within our local campus community.</p>
            
            <h3 style={{ color: "#f43f5e", marginTop: "25px", fontSize: "1.1rem" }}>⚠️ Absolute Marketplace Safety Laws</h3>
            <ul style={{ lineHeight: "1.8", paddingLeft: "20px", color: "#94a3b8", fontSize: "0.9rem" }}>
              <li>Always schedule physical meets within well-lit public campus locations.</li>
              <li>Thoroughly inspect the operation and build quality of an item before payment.</li>
              <li>Never make deposit commitments or wire delivery logistics cash in advance.</li>
            </ul>
          </div>
        ) : (
          /* VIEW DETOUR 3: LIVE MAIN MARKETPLACE DISCOVERY HUB */
          <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            
            {/* POST NEW LISTING FORM PANEL */}
            <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", border: "1px solid #334155" }}>
              <h3 style={{ marginTop: 0, color: "#f8fafc", fontSize: "1.2rem", fontWeight: 700, marginBottom: "15px", textAlign: "center" }}>Sell an Item</h3>
              
              <input type="text" placeholder="Item Name (e.g., Scientific Calculator)" value={itemName} onChange={(e) => setItemName(e.target.value)} style={{ width: "100%", padding: "12px", margin: "6px 0", borderRadius: "8px", border: "1px solid #334155", boxSizing: "border-box", color: "#fff", backgroundColor: "#0f172a", fontSize: "1rem" }} />
              <input type="number" placeholder="Price (₦)" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} style={{ width: "100%", padding: "12px", margin: "6px 0", borderRadius: "8px", border: "1px solid #334155", boxSizing: "border-box", color: "#fff", backgroundColor: "#0f172a", fontSize: "1rem" }} />
              
              <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} style={{ width: "100%", padding: "12px", margin: "6px 0", borderRadius: "8px", border: "1px solid #334155", boxSizing: "border-box", color: "#fff", backgroundColor: "#0f172a", fontSize: "1rem" }}>
                {CATEGORIES.slice(1).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>

              <textarea placeholder="Item Description (specify condition, modifications, etc.)" value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} style={{ width: "100%", padding: "12px", margin: "6px 0", borderRadius: "8px", border: "1px solid #334155", height: "80px", resize: "none", boxSizing: "border-box", color: "#fff", backgroundColor: "#0f172a", fontSize: "1rem" }} />
              
              <div style={{ margin: "12px 0" }}>
                <span style={{ fontSize: "0.85rem", color: "#94a3b8", display: "block", marginBottom: "5px" }}>Upload Image Asset:</span>
                <input type="file" onChange={(e) => setItemImage(e.target.files[0])} style={{ width: "100%", fontSize: "0.85rem", color: "#cbd5e1" }} />
              </div>

              <button onClick={addItem} disabled={uploading} style={{ width: "100%", padding: "12px", background: "#16a34a", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: uploading ? "not-allowed" : "pointer", fontSize: "1rem" }}>
                {uploading ? "Uploading Product..." : "List Product Item"}
              </button>
            </div>

            {/* HIGH-PERFORMANCE DISCOVERY MATRIX (SEARCH, FILTERS, WISHLIST SWITCH) */}
            <div style={{ background: "#1e293b", padding: "15px", borderRadius: "12px", border: "1px solid #334155" }}>
              <input 
                type="text" 
                placeholder="🔍 Search active marketplace..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #334155", boxSizing: "border-box", fontSize: "0.95rem", color: "#fff", backgroundColor: "#0f172a", marginBottom: "12px" }}
              />

              {/* HORIZONTAL CATEGORY SLIDER */}
              <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px", scrollbarWidth: "none" }}>
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setSelectedCategory(cat)}
                    style={{ background: selectedCategory === cat ? "#38bdf8" : "#0f172a", color: selectedCategory === cat ? "#0f172a" : "#94a3b8", border: "none", padding: "6px 14px", borderRadius: "20px", cursor: "pointer", whiteSpace: "nowrap", fontSize: "0.8rem", fontWeight: "bold" }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", borderTop: "1px solid #334155", paddingTop: "10px" }}>
                <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Found {filteredItems.length} active matching logs</span>
                <button 
                  onClick={() => setShowWishlistOnly(!showWishlistOnly)}
                  style={{ background: "transparent", border: "none", color: showWishlistOnly ? "#f43f5e" : "#94a3b8", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem" }}
                >
                  {showWishlistOnly ? "❤️ Showing Saved Items" : "🤍 View Wishlist"}
                </button>
              </div>
            </div>

{/* LIVE DYNAMIC LISTINGS FEED STREAM */}
<div style={{ 
  display: "grid", 
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", 
  gap: "20px",
  padding: "5px"
}}>
{filteredItems.length === 0 ? (
    <p style={{ color: "#94a3b8", textAlign: "center", background: "#1e293b", padding: "40px", borderRadius: "12px", border: "1px solid #334155" }}>No matching listings found.</p>
  ) : (
filteredItems.map((item) => {
  const isOwner = user.uid === item.sellerUid;
  const isSaved = wishlist.includes(item.id);

  return (
<div key={item.id} style={{ background: "#1e293b", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 15px rgba(0,0,0,0.2)", border: "1px solid #334155", display: "flex", flexDirection: "column", opacity: item.isSold ? 0.6 : 1, position: "relative" }}>            
                      
                      {/* WISHLIST FLOATING ACTION TRIGGER */}
                      <button 
                        onClick={() => toggleWishlist(item.id)}
                        style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(15, 23, 42, 0.6)", border: "none", width: "36px", height: "36px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", zIndex: 10, fontSize: "1.1rem" }}
                      >
                        {isSaved ? "❤️" : "🤍"}
                      </button>

{/* CARD CANVAS FRAME FOR SYSTEM PRODUCT IMAGE */}
<div style={{ width: "100%", height: "230px", backgroundColor: "#334155", position: "relative" }}>
<img 
  src={item.imageUrl} 
  alt="" 
  onClick={() => setSelectedImage(item.imageUrl)}
  style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }} 
/>
                        
                        {/* CONDITIONAL SYSTEM BANNER FOR SOLD ARTIFACTS */}
                        {item.isSold && (
                          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.75)", display: "flex", justifyContent: "center", alignItems: "center", color: "#f43f5e", fontWeight: "900", fontSize: "1.8rem", letterSpacing: "2px" }}>
                            SOLD OUT
                          </div>
                        )}

                        <span style={{ position: "absolute", bottom: "10px", left: "10px", background: "#0f172a", color: "#38bdf8", fontSize: "0.7rem", fontWeight: "bold", padding: "4px 10px", borderRadius: "6px" }}>
                          {item.category || "General"}
                        </span>
                      </div>

                      {/* DATA SPECIFICATION INVENTORY REGION */}
                      <div style={{ padding: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                          <h4 style={{ margin: 0, color: "#f8fafc", fontSize: "1.2rem", fontWeight: "700" }}>{item.name}</h4>
                          <span style={{ color: "#38bdf8", fontWeight: "800", fontSize: "1.25rem" }}>₦{item.price.toLocaleString()}</span>
                        </div>

                        <p style={{ margin: "0 0 20px 0", color: "#cbd5e1", fontSize: "0.9rem", lineHeight: "1.5" }}>{item.description}</p>
                        
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #334155", paddingTop: "15px" }}>
                          <span style={{ fontSize: "0.75rem", color: "#94a3b8", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Seller: {item.sellerEmail}</span>
                          
{/* DYNAMIC CARD ACTION CONTROL MATRIX */}
{isOwner || user.email === ADMIN_EMAIL ? (
  <div style={{ display: "flex", gap: "6px" }}>
    {isOwner && (
      <button
        onClick={() => toggleSoldStatus(item.id, item.isSold)}
        style={{
          background: item.isSold ? "#64748b" : "#ea580c",
          color: "white",
          border: "none",
          padding: "6px 12px",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "0.75rem",
          fontWeight: "bold"
        }}
      >
        {item.isSold ? "Relist" : "Mark Sold"}
      </button>
    )}
    <button
      onClick={() => deleteListing(item.id)}
      style={{ background: "#ef4444", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "bold" }}
    >
      Delete
    </button>
  </div>
) : (
  !item.isSold && (
    <a
      href={`https://wa.me/${item.sellerPhone}?text=Hello!%20I%20am%20interested%20in%20"${encodeURIComponent(item.name)}"`}
      target="_blank"
      rel="noopener noreferrer"
      style={{ background: "#25D366", color: "white", textDecoration: "none", padding: "8px 16px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}
    >
      Buy via WhatsApp 💬
    </a>
  )
)}

                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}
      </div>
{/* FULL SCREEN IMAGE VIEWER MODAL */}
{selectedImage && (
  <div 
    onClick={() => setSelectedImage(null)}
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2000,
      padding: "20px",
      cursor: "zoom-out"
    }}
  >
    <img 
      src={selectedImage} 
      alt="Preview" 
      style={{
        maxWidth: "100%",
        maxHeight: "90vh",
        borderRadius: "12px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        objectFit: "contain"
      }}
    />
    <button
      onClick={() => setSelectedImage(null)}
      style={{
        position: "absolute",
        top: "20px",
        right: "20px",
        background: "rgba(255,255,255,0.1)",
        border: "none",
        color: "white",
        fontSize: "1.5rem",
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        cursor: "pointer"
      }}
    >
      ✕
    </button>
  </div>
)}
    </div>
  );
}

export default App;

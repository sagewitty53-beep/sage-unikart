import React, { useState, useEffect } from "react";
import { db } from "../firebase"; 
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

function Admin() {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all listings and users for administrative oversight
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Items
      const itemsSnapshot = await getDocs(collection(db, "items"));
      const itemsList = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(itemsList);

      // 2. Fetch Users
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Force delete offensive or rule-breaking listings
  const deleteItemAsAdmin = async (itemId, itemName) => {
    if (window.confirm(`ADMIN ACTION: Force delete listing "${itemName}"?`)) {
      try {
        await deleteDoc(doc(db, "items", itemId));
        alert("Listing removed successfully.");
        fetchAdminData(); // Refresh list data
      } catch (err) {
        alert("Action failed: " + err.message);
      }
    }
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#12141c", minHeight: "100vh", color: "#fff", padding: "20px" }}>
      
      {/* HEADER SECTION */}
      <div style={{ textAlign: "center", paddingBottom: "20px", borderBottom: "1px solid #232736" }}>
        <h1 style={{ margin: "10px 0 5px 0", fontSize: "2rem" }}>Admin Dashboard</h1>
        <p style={{ margin: 0, color: "#8a94a6", fontSize: "0.95rem" }}>Manage items, users, and listings here.</p>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", marginTop: "40px", color: "#8a94a6" }}>Loading data logs...</p>
      ) : (
        <div style={{ maxWidth: "1200px", margin: "20px auto", display: "flex", flexDirection: "column", gap: "30px" }}>
          
          {/* STATS OVERVIEW RIBBON */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div style={{ background: "#1c1f2e", padding: "15px", borderRadius: "8px", textAlign: "center", border: "1px solid #2a2f45" }}>
              <h3 style={{ margin: 0, color: "#8a94a6", fontSize: "0.9rem" }}>TOTAL ACTIVE LISTINGS</h3>
              <p style={{ margin: "5px 0 0 0", fontSize: "1.8rem", fontWeight: "bold", color: "#4caf50" }}>{items.length}</p>
            </div>
            <div style={{ background: "#1c1f2e", padding: "15px", borderRadius: "8px", textAlign: "center", border: "1px solid #2a2f45" }}>
              <h3 style={{ margin: 0, color: "#8a94a6", fontSize: "0.9rem" }}>REGISTERED USERS</h3>
              <p style={{ margin: "5px 0 0 0", fontSize: "1.8rem", fontWeight: "bold", color: "#2196f3" }}>{users.length}</p>
            </div>
          </div>

          {/* ACTIVE LISTINGS PANEL */}
          <div style={{ background: "#1c1f2e", padding: "20px", borderRadius: "8px", border: "1px solid #2a2f45" }}>
            <h2 style={{ marginTop: 0, fontSize: "1.2rem", color: "#fff", borderBottom: "1px solid #2a2f45", paddingBottom: "10px" }}>Active Marketplace Items</h2>
            {items.length === 0 ? (
              <p style={{ color: "#8a94a6", fontSize: "0.9rem" }}>No listed items found.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "15px" }}>
                {items.map(item => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#12141c", padding: "12px", borderRadius: "6px", border: "1px solid #232736" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                      <img src={item.imageUrl} alt="" style={{ width: "45px", height: "45px", borderRadius: "4px", objectFit: "cover" }} />
                      <div>
                        <h4 style={{ margin: 0, fontSize: "0.95rem" }}>{item.name}</h4>
                        <p style={{ margin: "3px 0 0 0", fontSize: "0.8rem", color: "#8a94a6" }}>Price: ₦{item.price} | Seller: {item.sellerEmail}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteItemAsAdmin(item.id, item.name)}
                      style={{ background: "#d32f2f", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* USER DIRECTORY PANEL */}
          <div style={{ background: "#1c1f2e", padding: "20px", borderRadius: "8px", border: "1px solid #2a2f45" }}>
            <h2 style={{ marginTop: 0, fontSize: "1.2rem", color: "#fff", borderBottom: "1px solid #2a2f45", paddingBottom: "10px" }}>Verified Student Profiles</h2>
            {users.length === 0 ? (
              <p style={{ color: "#8a94a6", fontSize: "0.9rem" }}>No student records discovered.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
                {users.map(u => (
                  <div key={u.id} style={{ background: "#12141c", padding: "12px", borderRadius: "6px", border: "1px solid #232736", fontSize: "0.85rem", lineHeight: "1.5" }}>
                    <div style={{ fontWeight: "bold", color: "#2196f3", fontSize: "0.9rem" }}>{u.name || "Anonymous Student"}</div>
                    <div style={{ color: "#8a94a6" }}>Email: <span style={{ color: "#fff" }}>{u.email}</span></div>
                    <div style={{ color: "#8a94a6" }}>Matric No: <span style={{ color: "#fff" }}>{u.matricNumber || "N/A"}</span> | WhatsApp: <span style={{ color: "#fff" }}>{u.whatsapp || "N/A"}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default Admin;

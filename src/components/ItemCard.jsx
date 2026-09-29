import React from "react";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

function ItemCard({ item, currentUser, onFetchItems }) {
  // Check if the logged-in user is the one who listed the product
  const isSeller = currentUser && currentUser.uid === item.sellerUid;

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        await deleteDoc(doc(db, "items", item.id));
        alert("Item deleted successfully!");
        if (onFetchItems) onFetchItems(); // Refresh the listing grid
      } catch (err) {
        alert("Error deleting item: " + err.message);
      }
    }
  };

  return (
    <div style={{ background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
      <img 
        src={item.imageUrl} 
        alt={item.name} 
        style={{ width: "100%", height: "180px", objectFit: "cover" }}
      />
      <div style={{ padding: "15px", flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <h4 style={{ margin: "0 0 5px 0", color: "#333", fontSize: "1.1rem" }}>{item.name}</h4>
          <p style={{ margin: "0 0 10px 0", fontWeight: "bold", color: "#e65100", fontSize: "1.2rem" }}>₦{item.price}</p>
          <p style={{ margin: "0 0 15px 0", color: "#666", fontSize: "0.9rem", lineHeight: "1.4" }}>{item.description}</p>
        </div>
        
        <div style={{ borderTop: "1px solid #eee", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "#888" }}>Seller: {item.sellerEmail}</span>
          
          {/* Show delete button only if current user owns this product post */}
          {isSeller && (
            <button 
              onClick={handleDelete}
              style={{ background: "#d32f2f", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem" }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemCard;

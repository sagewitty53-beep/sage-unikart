import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import ItemCard from "../components/ItemCard";

function Home() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "items"));
      setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    load();
  }, []);

  return (
    <div style={{ padding: 15 }}>
      <h2>Latest Listings</h2>

      <div style={{ display: "grid", gap: 15 }}>
        {items.map(item => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export default Home;

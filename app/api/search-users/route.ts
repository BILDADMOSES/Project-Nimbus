import type { NextApiRequest, NextApiResponse } from "next";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const { searchTerm } = req.query;

  if (!searchTerm || typeof searchTerm !== "string") {
    return res.status(400).json({ error: "Search term is required" });
  }

  try {
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("username", ">=", searchTerm),
      where("username", "<=", searchTerm + "\uf8ff")
    );
    const querySnapshot = await getDocs(q);

    const users = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      username: doc.data().username,
    }));

    res.status(200).json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "An error occurred while searching users" });
  }
}

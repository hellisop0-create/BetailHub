import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';

export const getOrCreateChat = async (buyerId: string, sellerId: string, adId: string, adTitle: string) => {
  const chatsRef = collection(db, 'chats');
  
  // Check if a chat already exists for this specific ad between these two people
  const q = query(
    chatsRef, 
    where('adId', '==', adId),
    where('participants', 'array-contains', buyerId)
  );

  const snapshot = await getDocs(q);
  const existingChat = snapshot.docs.find(doc => doc.data().participants.includes(sellerId));

  if (existingChat) {
    return existingChat.id;
  }

  // Create new chat room if not found
  const newChat = await addDoc(chatsRef, {
    adId,
    adTitle,
    participants: [buyerId, sellerId],
    lastMessage: '',
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    unreadCount: 0
  });

  return newChat.id;
};

export const sendMessage = async (chatId: string, senderId: string, text: string) => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  
  await addDoc(messagesRef, {
    senderId,
    text,
    timestamp: serverTimestamp(),
  });

  // Update the parent chat document for the sidebar preview
  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: text,
    updatedAt: serverTimestamp()
  });
};
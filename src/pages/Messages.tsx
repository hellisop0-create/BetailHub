import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, query, where, orderBy, onSnapshot, 
  limit, doc, writeBatch, getDocs, getDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { sendMessage } from '../lib/chat-service';
import { 
  Send, ChevronLeft, MessageCircle, Search, 
  MoreVertical, Check, CheckCheck, ExternalLink, Tag
} from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

export default function Messages() {
  const { user } = useAuth();
  const location = useLocation();
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [activeAd, setActiveAd] = useState<any>(null); // State for the Ad Preview
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Mark as Seen logic
  useEffect(() => {
    if (!activeChat || !user) return;
    const markAsRead = async () => {
      const q = query(
        collection(db, 'chats', activeChat.id, 'messages'),
        where('senderId', '!=', user.uid),
        where('status', '!=', 'seen')
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return;
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => batch.update(d.ref, { status: 'seen' }));
      await batch.commit();
    };
    markAsRead();
  }, [activeChat, messages, user]);

  // Fetch Chat List
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(list);
      const stateId = location.state?.selectedChatId;
      if (stateId && !activeChat) {
        const target = list.find(c => c.id === stateId);
        if (target) setActiveChat(target);
      }
    });
  }, [user, location.state]);

  // Fetch Ad Details for the Preview Bar
  useEffect(() => {
    if (!activeChat?.adId) {
      setActiveAd(null);
      return;
    }
    const fetchAdPreview = async () => {
      const adDoc = await getDoc(doc(db, 'ads', activeChat.adId));
      if (adDoc.exists()) {
        setActiveAd({ id: adDoc.id, ...adDoc.data() });
      }
    };
    fetchAdPreview();
  }, [activeChat]);

  // Fetch Messages
  useEffect(() => {
    if (!activeChat) return;
    const q = query(collection(db, 'chats', activeChat.id, 'messages'), orderBy('timestamp', 'asc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [activeChat]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat || !user) return;
    const text = inputText; setInputText('');
    await sendMessage(activeChat.id, user.uid, text);
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 flex bg-white z-40">
      {/* Sidebar */}
      <div className={`w-full md:w-[380px] border-r flex flex-col bg-white ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b"><h1 className="text-2xl font-black mb-6">Messages</h1></div>
        <div className="flex-1 overflow-y-auto">
          {chats.map(chat => (
            <div key={chat.id} onClick={() => setActiveChat(chat)} className={`p-4 mx-2 my-1 rounded-2xl cursor-pointer flex gap-4 ${activeChat?.id === chat.id ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center font-bold text-green-700 uppercase">{chat.adTitle?.charAt(0)}</div>
              <div className="flex-1 min-w-0"><h3 className="font-bold truncate text-sm">{chat.adTitle}</h3><p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-gray-50 ${!activeChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* 1. TOP HEADER (Seller Name) */}
            <div className="bg-white px-6 py-3 border-b flex items-center justify-between shadow-sm z-20">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="md:hidden p-2"><ChevronLeft /></button>
                <div className="w-10 h-10 rounded-xl bg-green-700 text-white flex items-center justify-center font-bold">{(activeChat.sellerName || "S").charAt(0)}</div>
                <h3 className="font-black text-gray-900 leading-none">{activeChat.sellerName || "Seller"}</h3>
              </div>
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </div>

            {/* 2. AD PREVIEW BAR (Sticky below header) */}
            {activeAd && (
              <div className="bg-white px-6 py-2 border-b flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden border">
                    <img src={activeAd.images?.[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-gray-900 truncate leading-tight uppercase tracking-tighter">{activeAd.title}</p>
                    <p className="text-sm font-black text-green-700">Rs. {activeAd.price?.toLocaleString()}</p>
                  </div>
                </div>
                <Link 
                  to={`/ad/${activeAd.id}`} 
                  className="bg-gray-100 hover:bg-green-600 hover:text-white transition-colors text-gray-600 px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2"
                >
                  VIEW AD <ExternalLink size={12} />
                </Link>
              </div>
            )}

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${msg.senderId === user.uid ? 'bg-green-700 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                    <p className="text-sm">{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[9px] opacity-70">{msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.senderId === user.uid && (msg.status === 'seen' ? <CheckCheck size={14} className="text-blue-400" /> : <Check size={14} />)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 bg-white border-t flex gap-3">
              <input value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type a message..." className="flex-1 bg-gray-50 border rounded-2xl px-4 py-3 outline-none text-sm" />
              <button type="submit" className="bg-green-700 text-white p-4 rounded-2xl"><Send size={20} /></button>
            </form>
          </>
        ) : (
          <div className="text-center opacity-30"><MessageCircle size={60} className="mx-auto mb-4 text-green-700" /><p className="font-black uppercase tracking-widest text-sm">Select a Conversation</p></div>
        )}
      </div>
    </div>
  );
}
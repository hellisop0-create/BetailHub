import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, query, where, orderBy, onSnapshot, 
  limit, doc, writeBatch, getDocs 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { sendMessage } from '../lib/chat-service';
import { 
  Send, ChevronLeft, MessageCircle, Search, 
  MoreVertical, Check, CheckCheck, ExternalLink, Navigation 
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Handle Mark as Seen
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
      snapshot.docs.forEach((d) => {
        batch.update(d.ref, { status: 'seen' });
      });
      await batch.commit();
    };

    markAsRead();
  }, [activeChat, messages, user]);

  // Real-time Chat List
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [user]);

  // Real-time Messages
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
    const text = inputText;
    setInputText('');
    await sendMessage(activeChat.id, user.uid, text);
  };

  // WhatsApp-style Tick Component
  const MessageStatus = ({ status, isMe }: { status: string, isMe: boolean }) => {
    if (!isMe) return null;
    if (status === 'seen') return <CheckCheck size={14} className="text-blue-400" />;
    if (status === 'delivered') return <CheckCheck size={14} className="text-gray-400" />;
    return <Check size={14} className="text-gray-400" />;
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-white z-40">
      
      {/* Sidebar */}
      <div className={`w-full md:w-[380px] border-r flex flex-col bg-white h-full ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b">
          <h1 className="text-2xl font-black mb-6">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-2xl outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => setActiveChat(chat)}
              className={`p-4 mx-2 my-1 rounded-2xl cursor-pointer flex items-center gap-4 ${activeChat?.id === chat.id ? 'bg-green-50' : 'hover:bg-gray-50'}`}
            >
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center font-bold text-green-700 uppercase">{chat.adTitle?.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate text-sm">{chat.adTitle}</h3>
                <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-gray-50 h-full ${!activeChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* STICKY HEADER */}
            <div className="bg-white px-6 py-3 border-b flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="md:hidden p-2 -ml-2"><ChevronLeft /></button>
                <div className="w-10 h-10 rounded-xl bg-green-700 text-white flex items-center justify-center font-bold">{activeChat.adTitle?.charAt(0)}</div>
                <div className="min-w-0">
                  <h3 className="font-black text-gray-900 leading-none truncate">
                    {activeChat.sellerName || "Chat"}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-bold text-gray-400 truncate max-w-[120px]">
                      {activeChat.adTitle}
                    </span>
                    <Link 
                      to={`/ad/${activeChat.adId}`} 
                      className="text-[9px] bg-green-600 text-white px-2 py-0.5 rounded font-black flex items-center gap-1 hover:bg-green-700 transition-colors"
                    >
                      VIEW AD <ExternalLink size={10} />
                    </Link>
                  </div>
                </div>
              </div>
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </div>

            {/* MESSAGE LIST */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4">
              {messages.map((msg) => {
                const isMe = msg.senderId === user.uid;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${isMe ? 'bg-green-700 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className={`text-[9px] font-bold ${isMe ? 'text-green-100' : 'text-gray-400'}`}>
                          {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <MessageStatus status={msg.status} isMe={isMe} />
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT BAR */}
            <div className="p-4 bg-white border-t">
              <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3">
                <input 
                  value={inputText} 
                  onChange={(e) => setInputText(e.target.value)} 
                  placeholder="Ask about weight, price..." 
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 outline-none text-sm" 
                />
                <button type="submit" className="bg-green-700 text-white p-4 rounded-2xl shadow-lg shadow-green-100 hover:scale-105 active:scale-95 transition-all">
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="text-center opacity-40">
            <MessageCircle size={60} className="mx-auto mb-4 text-green-700" />
            <p className="font-black uppercase tracking-widest text-sm">Select a negotiation</p>
          </div>
        )}
      </div>
    </div>
  );
}
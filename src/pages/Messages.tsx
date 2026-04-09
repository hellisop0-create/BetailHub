import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { sendMessage } from '../lib/chat-service';
import { 
  Send, 
  ChevronLeft, 
  MessageCircle, 
  Search, 
  User, 
  MoreVertical,
  Navigation,
  CheckCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!activeChat) return;
    const q = query(
      collection(db, 'chats', activeChat.id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [activeChat]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat || !user) return;
    const text = inputText;
    setInputText('');
    try {
      await sendMessage(activeChat.id, user.uid, text);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (!user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 z-50">
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-sm mx-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Login Required</h2>
          <button onClick={() => navigate('/')} className="w-full bg-green-700 text-white py-3 rounded-xl font-bold">Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    /* MAIN WRAPPER: Fixed to top and prevents page-level scrolling */
    <div className="fixed inset-0 flex overflow-hidden bg-white z-40">
      
      {/* SIDEBAR */}
      <div className={`w-full md:w-[400px] border-r flex flex-col bg-white h-full transition-all ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b bg-white">
          <h1 className="text-2xl font-black text-gray-900 mb-6">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search chats..." className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none" />
          </div>
        </div>

        {/* Scrollable conversation list */}
        <div className="flex-1 overflow-y-auto bg-white">
          {loading ? (
             <div className="p-6 space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse" />)}</div>
          ) : chats.length > 0 ? (
            chats.map(chat => (
              <div 
                key={chat.id} 
                onClick={() => setActiveChat(chat)}
                className={`p-4 mx-2 my-1 rounded-2xl cursor-pointer transition-all flex items-center gap-4 ${activeChat?.id === chat.id ? 'bg-green-50 border border-green-100' : 'hover:bg-gray-50 border border-transparent'}`}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center font-bold text-green-700 text-xl">{chat.adTitle?.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-gray-900 truncate text-[15px]">{chat.adTitle}</h3>
                  </div>
                  <p className={`text-xs truncate ${activeChat?.id === chat.id ? 'text-green-700' : 'text-gray-500'}`}>{chat.lastMessage || 'Start a conversation...'}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 opacity-40 text-center">
              <Navigation className="w-12 h-12 mb-4" />
              <p className="font-bold">No messages yet</p>
            </div>
          )}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className={`flex-1 flex flex-col bg-[#F9FAFB] h-full ${!activeChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* STICKY HEADER */}
            <div className="bg-white px-6 py-4 border-b flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveChat(null)} className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full">
                  <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div className="w-10 h-10 rounded-xl bg-green-700 flex items-center justify-center font-bold text-white shadow-lg">{activeChat.adTitle?.charAt(0)}</div>
                <div>
                  <h3 className="font-bold text-gray-900 leading-none">{activeChat.adTitle}</h3>
                  <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Active Discussion</span>
                </div>
              </div>
              <MoreVertical className="w-5 h-5 text-gray-400 cursor-pointer" />
            </div>

            {/* MESSAGE LIST: Only this area scrolls */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
              {messages.map((msg) => {
                const isMe = msg.senderId === user?.uid;
                return (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[85%] md:max-w-[70%]">
                      <div className={`p-4 shadow-sm ${isMe ? 'bg-green-700 text-white rounded-3xl rounded-tr-none' : 'bg-white text-gray-800 rounded-3xl rounded-tl-none border border-gray-100'}`}>
                        <p className="text-[14px] leading-relaxed">{msg.text}</p>
                      </div>
                      <div className={`flex items-center gap-1.5 mt-1.5 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[9px] text-gray-400 font-bold">
                           {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && <CheckCheck className="w-3 h-3 text-green-600" />}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* STICKY INPUT BAR */}
            <div className="p-4 md:p-6 bg-white border-t">
              <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-3">
                <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-1">
                  <input 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type your message..." 
                    className="w-full bg-transparent border-none outline-none py-3 text-sm"
                  />
                </div>
                <button type="submit" disabled={!inputText.trim()} className="bg-green-700 text-white p-4 rounded-2xl hover:bg-green-800 disabled:opacity-50 transition-all shadow-xl shadow-green-100">
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="w-24 h-24 bg-green-50 rounded-[2.5rem] flex items-center justify-center mb-6 mx-auto">
              <MessageCircle className="w-10 h-10 text-green-700 opacity-30" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Select a Conversation</h2>
            <p className="text-gray-500 text-sm max-w-xs leading-relaxed">Negotiate directly with buyers and sellers in real-time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, query, where, orderBy, onSnapshot, 
  limit, doc, writeBatch, getDocs, getDoc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { sendMessage } from '../lib/chat-service';
import { 
  Send, ChevronLeft, MessageCircle, 
  MoreVertical, Check, CheckCheck, ExternalLink,
  Ban, LogOut, ShieldAlert, Trash2, ShoppingBag, Tag, Inbox
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

export default function Messages() {
  const { user } = useAuth();
  const location = useLocation();
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [activeAd, setActiveAd] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [openSidebarMenu, setOpenSidebarMenu] = useState<string | null>(null);
  const [chatFilter, setChatFilter] = useState<'all' | 'buying' | 'selling'>('all');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // FIXED Cooldown Calculation Logic
  const getCooldownStatus = (chat: any) => {
    // Check if user and leftAt map exist
    if (!chat?.leftAt || !user?.uid || !chat.leftAt[user.uid]) {
      return { isRestricted: false, remainingHours: 0 };
    }

    const leftTimeStr = chat.leftAt[user.uid];
    const leftTime = new Date(leftTimeStr).getTime();
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    const now = Date.now();
    
    const diff = now - leftTime;
    const isRestricted = diff < TWELVE_HOURS;
    const remainingHours = Math.ceil((TWELVE_HOURS - diff) / (1000 * 60 * 60));

    return { isRestricted: isRestricted === true, remainingHours };
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (!window.confirm("Delete this chat? This will remove all messages for everyone.")) return;

    try {
      const messagesSnapshot = await getDocs(collection(db, 'chats', chatId, 'messages'));
      const batch = writeBatch(db);
      messagesSnapshot.docs.forEach((msg) => batch.delete(msg.ref));
      await batch.commit();

      await deleteDoc(doc(db, 'chats', chatId));
      if (activeChat?.id === chatId) setActiveChat(null);
      setOpenSidebarMenu(null);
      toast.success("Chat deleted permanently");
    } catch (error) {
      toast.error("Failed to delete chat");
    }
  };

  const handleBlockChat = async () => {
    if (!activeChat || !user) return;
    if (!window.confirm("Block this user? You won't receive further messages.")) return;
    try {
      await updateDoc(doc(db, 'chats', activeChat.id), { status: 'blocked', blockedBy: user.uid });
      toast.error("User Blocked");
      setShowMenu(false);
    } catch (error) { toast.error("Action failed"); }
  };

  const handleLeaveChat = async () => {
    if (!activeChat || !user) return;
    
    const warningText = "After leaving the chat, you won't be able to chat this person for 12 hours. Do you want to proceed?";
    
    if (!window.confirm(warningText)) return;
    
    try {
      await updateDoc(doc(db, 'chats', activeChat.id), {
        [`leftAt.${user.uid}`]: new Date().toISOString()
      });
      
      // We don't null setActiveChat here so the user can immediately see the cooldown state
      setShowMenu(false);
      toast.success("You left the chat. 12h cooldown active.");
    } catch (error) {
      toast.error("Action failed");
    }
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const updatedChats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(updatedChats);
      
      // Update active chat if it changes (important for detecting the 'leftAt' change)
      if (activeChat) {
        const currentActive = updatedChats.find(c => c.id === activeChat.id);
        if (currentActive) setActiveChat(currentActive);
      }
    });
  }, [user, activeChat?.id]); // Added activeChat.id to refresh when status changes

  useEffect(() => {
    if (!activeChat?.adId) { setActiveAd(null); return; }
    getDoc(doc(db, 'ads', activeChat.adId)).then(s => s.exists() && setActiveAd(s.data()));
  }, [activeChat?.adId]);

  useEffect(() => {
    if (!activeChat?.id) return;
    const q = query(collection(db, 'chats', activeChat.id, 'messages'), orderBy('timestamp', 'asc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [activeChat?.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const { isRestricted } = getCooldownStatus(activeChat);
    
    if (!inputText.trim() || !activeChat || !user || 
        activeChat.status === 'blocked' || isRestricted) return;

    const text = inputText; 
    setInputText('');
    await sendMessage(activeChat.id, user.uid, text);
  };

  const filteredChats = chats.filter(chat => {
    if (chatFilter === 'all') return true;
    if (chatFilter === 'selling') return chat.sellerId === user.uid;
    if (chatFilter === 'buying') return chat.sellerId !== user.uid;
    return true;
  });

  if (!user) return null;

  return (
    <div className="fixed inset-0 flex bg-white z-40 font-sans">
      {/* Sidebar */}
      <div className={`w-full md:w-[380px] border-r border-gray-100 flex flex-col bg-white h-full shadow-sm ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Sidebar Header */}
        <div className="pt-6 px-6 pb-4 border-b border-gray-100">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-5">Messages</h1>
          <div className="flex bg-gray-100 p-1 rounded-xl relative">
            <button onClick={() => setChatFilter('all')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${chatFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Inbox size={14} /> All
            </button>
            <button onClick={() => setChatFilter('buying')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${chatFilter === 'buying' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <ShoppingBag size={14} /> Buying
            </button>
            <button onClick={() => setChatFilter('selling')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${chatFilter === 'selling' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Tag size={14} /> Selling
            </button>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto pt-2">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 px-6 text-center">
              <MessageCircle size={32} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No conversations found</p>
            </div>
          ) : (
            filteredChats.map(chat => (
              <div key={chat.id} onClick={() => setActiveChat(chat)} className={`p-4 mx-3 my-1.5 rounded-2xl cursor-pointer flex gap-4 relative group transition-all duration-200 ${activeChat?.id === chat.id ? 'bg-green-50/80 shadow-sm ring-1 ring-green-100' : 'hover:bg-gray-50'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg uppercase flex-shrink-0 ${activeChat?.id === chat.id ? 'bg-green-600 text-white shadow-md' : 'bg-green-100 text-green-700'}`}>{chat.adTitle?.charAt(0) || "C"}</div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className={`font-bold truncate text-sm ${activeChat?.id === chat.id ? 'text-green-900' : 'text-gray-900'}`}>{chat.adTitle || "Unknown Ad"}</h3>
                  <p className={`text-xs truncate ${activeChat?.id === chat.id ? 'text-green-700/80 font-medium' : 'text-gray-500'}`}>{chat.lastMessage || "No messages yet"}</p>
                </div>
                <div className="relative self-center">
                  <button onClick={(e) => { e.stopPropagation(); setOpenSidebarMenu(openSidebarMenu === chat.id ? null : chat.id); }} className="p-2 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all text-gray-400 hover:text-gray-600 shadow-sm"><MoreVertical size={16} /></button>
                  {openSidebarMenu === chat.id && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-20 overflow-hidden">
                      <button onClick={(e) => handleDeleteChat(e, chat.id)} className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"><Trash2 size={14} /> Delete Chat</button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-gray-50/30 h-full relative ${!activeChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-100 shadow-sm z-30">
              <div className="px-6 py-4 flex items-center justify-between relative">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveChat(null)} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft /></button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-green-800 text-white flex items-center justify-center font-bold shadow-sm">{(activeChat.sellerName || "S").charAt(0)}</div>
                  <div>
                    <h3 className="font-black text-gray-900 leading-none">{activeChat.sellerName || "Seller"}</h3>
                    <p className="text-[10px] text-green-600 font-bold tracking-widest uppercase mt-1">Online</p>
                  </div>
                </div>
                <div className="relative">
                  <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="p-2.5 hover:bg-gray-100 rounded-full transition-colors relative z-40 text-gray-500"><MoreVertical size={20} /></button>
                  {showMenu && (
                    <div className="fixed right-4 md:right-8 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-1.5 z-[101] overflow-hidden" style={{ top: '65px' }}>
                      <button onClick={handleLeaveChat} className="w-full px-4 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"><LogOut size={16} /> Leave Chat</button>
                      <button onClick={handleBlockChat} className="w-full px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"><Ban size={16} /> Block User</button>
                    </div>
                  )}
                </div>
              </div>

              {activeAd && (
                <div className="px-6 py-3 flex items-center justify-between bg-white border-t border-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm">
                      <img src={activeAd.images?.[0] || '/placeholder.jpg'} alt="ad" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-800 truncate uppercase tracking-tight max-w-[200px] md:max-w-md">{activeAd.title}</h4>
                      <p className="text-base font-black text-green-700 mt-0.5">Rs. {activeAd.price?.toLocaleString()}</p>
                    </div>
                  </div>
                  <Link to={`/ad/${activeChat.adId}`} className="bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-xl text-[10px] font-black flex items-center gap-2 transition-all shadow-sm">VIEW AD <ExternalLink size={12} /></Link>
                </div>
              )}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg) => {
                const isMe = msg.senderId === user.uid;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-3.5 rounded-2xl shadow-sm relative ${isMe ? 'bg-green-700 text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'}`}>
                      <p className="text-[15px] leading-relaxed">{msg.text}</p>
                      <div className={`flex items-center justify-end gap-1.5 mt-1.5 ${isMe ? 'text-green-200' : 'text-gray-400'}`}>
                        <span className="text-[10px] font-bold tracking-wider">{msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && (msg.status === 'seen' ? <CheckCheck size={14} className="text-green-300" /> : <Check size={14} />)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area / Cooldown Bar */}
            {activeChat.status === 'blocked' ? (
              <div className="p-5 bg-red-50 text-red-700 border-t flex items-center justify-center gap-3 italic text-xs font-bold uppercase tracking-wider">
                <ShieldAlert size={18} /> Chat is blocked
              </div>
            ) : getCooldownStatus(activeChat).isRestricted ? (
              <div className="p-5 bg-amber-50 text-amber-700 border-t flex flex-col items-center justify-center gap-1">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                   <ShieldAlert size={16} /> Cooldown Active
                </div>
                <p className="text-[10px] font-bold opacity-80">
                  You left this chat. You can send messages again in {getCooldownStatus(activeChat).remainingHours} hours.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-white border-t border-gray-100 shadow-sm z-20">
                <form onSubmit={handleSend} className="max-w-5xl mx-auto flex gap-3 items-end">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 flex items-center shadow-inner">
                    <input value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type your message..." className="w-full bg-transparent outline-none text-[15px]" />
                  </div>
                  <button type="submit" disabled={!inputText.trim()} className={`p-4 rounded-2xl shadow-md flex items-center justify-center ${inputText.trim() ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                    <Send size={20} />
                  </button>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle size={40} className="text-green-600" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Your Messages</h2>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">Select a conversation to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
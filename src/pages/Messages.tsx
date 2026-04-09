import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, query, where, orderBy, onSnapshot, 
  limit, doc, writeBatch, getDocs, getDoc, updateDoc, arrayRemove, deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { sendMessage } from '../lib/chat-service';
import { 
  Send, ChevronLeft, MessageCircle, 
  MoreVertical, Check, CheckCheck, ExternalLink,
  Ban, LogOut, ShieldAlert, Trash2, ShoppingBag, Tag, Inbox, UserMinus, AlertTriangle
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

export default function Messages() {
  const { user } = useAuth();
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

  // Logic to end communication immediately
  const handleLeaveChat = async () => {
    if (!activeChat || !user) return;
    
    const confirmLeave = window.confirm(
      "Are you sure you want to leave? This will end the conversation and you won't be able to message each other again."
    );

    if (confirmLeave) {
      try {
        await updateDoc(doc(db, 'chats', activeChat.id), { 
          // Remove me from participants so it disappears from my list
          participants: arrayRemove(user.uid),
          // Set status to left so the other person is locked out
          status: 'left',
          leftBy: user.uid
        });
        
        setActiveChat(null);
        setShowMenu(false);
        toast.success("You left the conversation.");
      } catch (error) { 
        toast.error("Action failed"); 
      }
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (!window.confirm("Delete this chat?")) return;
    try {
      const messagesSnapshot = await getDocs(collection(db, 'chats', chatId, 'messages'));
      const batch = writeBatch(db);
      messagesSnapshot.docs.forEach((msg) => batch.delete(msg.ref));
      await batch.commit();
      await deleteDoc(doc(db, 'chats', chatId));
      if (activeChat?.id === chatId) setActiveChat(null);
      toast.success("Chat deleted");
    } catch (error) { toast.error("Error deleting chat"); }
  };

  const handleBlockChat = async () => {
    if (!activeChat || !user) return;
    if (!window.confirm("Block this user? They will not be able to contact you again.")) return;
    try {
      await updateDoc(doc(db, 'chats', activeChat.id), { 
        status: 'blocked', 
        blockedBy: user.uid,
        participants: arrayRemove(user.uid) // Also remove it from victim's list
      });
      setActiveChat(null);
      toast.error("User Blocked");
      setShowMenu(false);
    } catch (error) { toast.error("Block failed"); }
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [user]);

  useEffect(() => {
    if (!activeChat?.adId) { setActiveAd(null); return; }
    getDoc(doc(db, 'ads', activeChat.adId)).then(s => s.exists() && setActiveAd(s.data()));
  }, [activeChat]);

  useEffect(() => {
    if (!activeChat) return;
    const q = query(collection(db, 'chats', activeChat.id, 'messages'), orderBy('timestamp', 'asc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [activeChat]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    // Block sending if the chat is blocked or someone has left
    if (!inputText.trim() || !activeChat || activeChat.status === 'blocked' || activeChat.status === 'left') return;
    const text = inputText; setInputText('');
    await sendMessage(activeChat.id, user.uid, text);
  };

  const filteredChats = chats.filter(chat => {
    if (chatFilter === 'all') return true;
    return chatFilter === 'selling' ? chat.sellerId === user.uid : chat.sellerId !== user.uid;
  });

  if (!user) return null;

  return (
    <div className="fixed inset-0 flex bg-white z-40 font-sans">
      {/* Sidebar */}
      <div className={`w-full md:w-[380px] border-r border-gray-100 flex flex-col bg-white h-full shadow-sm ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="pt-6 px-6 pb-4 border-b border-gray-100">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-5">Messages</h1>
          <div className="flex bg-gray-100 p-1 rounded-xl relative">
            <button onClick={() => setChatFilter('all')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${chatFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}><Inbox size={14} /> All</button>
            <button onClick={() => setChatFilter('buying')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${chatFilter === 'buying' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}><ShoppingBag size={14} /> Buying</button>
            <button onClick={() => setChatFilter('selling')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${chatFilter === 'selling' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}><Tag size={14} /> Selling</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pt-2">
          {filteredChats.map(chat => (
            <div key={chat.id} onClick={() => setActiveChat(chat)} className={`p-4 mx-3 my-1.5 rounded-2xl cursor-pointer flex gap-4 transition-all ${activeChat?.id === chat.id ? 'bg-green-50/80 shadow-sm ring-1 ring-green-100' : 'hover:bg-gray-50'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg uppercase ${activeChat?.id === chat.id ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'}`}>{chat.adTitle?.charAt(0)}</div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className="font-bold truncate text-sm text-gray-900">{chat.adTitle || "Chat"}</h3>
                <p className="text-xs truncate text-gray-500">{chat.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-gray-50/30 h-full relative ${!activeChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {activeChat ? (
          <>
            <div className="bg-white border-b border-gray-100 shadow-sm z-30">
              <div className="px-6 py-4 flex items-center justify-between relative">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveChat(null)} className="md:hidden p-2"><ChevronLeft /></button>
                  <div className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center font-bold">{(activeChat.sellerName || "U").charAt(0)}</div>
                  <h3 className="font-black text-gray-900 leading-none">{activeChat.sellerName || "User"}</h3>
                </div>

                <div className="relative">
                  <button onClick={() => setShowMenu(!showMenu)} className="p-2.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><MoreVertical size={20} /></button>
                  {showMenu && (
                    <>
                      <div className="fixed inset-0 z-[100]" onClick={() => setShowMenu(false)} />
                      <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-[101] overflow-hidden">
                        <div className="px-4 py-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">Options</div>
                        
                        <button onClick={handleLeaveChat} className="w-full px-4 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3"><LogOut size={16} /> Leave Chat</button>
                        
                        <div className="h-px bg-gray-100 w-full" />
                        
                        <button onClick={handleBlockChat} className="w-full px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3"><Ban size={16} /> Block User</button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {activeAd && (
                <div className="px-6 py-3 flex items-center justify-between bg-white border-t border-gray-50">
                   <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border bg-gray-50">
                      <img src={activeAd.images?.[0] || '/placeholder.jpg'} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-tight truncate max-w-[150px]">{activeAd.title}</h4>
                      <p className="text-sm font-black text-green-700">Rs. {activeAd.price?.toLocaleString()}</p>
                    </div>
                  </div>
                  <Link to={`/ad/${activeChat.adId}`} className="bg-gray-900 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5">View <ExternalLink size={10} /></Link>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3.5 rounded-2xl shadow-sm ${msg.senderId === user.uid ? 'bg-green-700 text-white rounded-br-none' : 'bg-white text-gray-800 border rounded-bl-none'}`}>
                    <p className="text-[15px] leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Safety UI Check */}
            {activeChat.status === 'blocked' ? (
              <div className="p-5 bg-red-50 text-red-700 border-t border-red-100 flex items-center justify-center gap-3 italic text-xs font-bold uppercase"><ShieldAlert size={18} /> This chat is blocked</div>
            ) : activeChat.status === 'left' ? (
              <div className="p-5 bg-gray-100 text-gray-500 border-t flex flex-col items-center justify-center gap-1 uppercase tracking-tighter">
                <div className="flex items-center gap-2 text-xs font-black"><UserMinus size={16} /> Conversation Ended</div>
                <span className="text-[10px] normal-case font-medium opacity-70 text-center px-10">This conversation is closed because a participant has left.</span>
              </div>
            ) : (
              <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSend} className="max-w-5xl mx-auto flex gap-3">
                  <input value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type a message..." className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-green-500/20" />
                  <button type="submit" disabled={!inputText.trim()} className="p-4 bg-green-700 text-white rounded-2xl shadow-md disabled:bg-gray-200 disabled:text-gray-400"><Send size={20} /></button>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <MessageCircle size={40} className="mx-auto text-green-600 mb-4 opacity-20" />
            <h2 className="text-lg font-black text-gray-900">Your Messages</h2>
            <p className="text-sm text-gray-500">Select a chat to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}
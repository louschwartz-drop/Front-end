'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAdminSocket } from '@/context/AdminSocketContext';
import { getAllChatsAdmin, getChatMessagesAdmin, deleteChatAdmin } from '@/lib/api/admin/chat.api';
import {
  MessageSquare, Send, User, Users, CreditCard, UserCheck,
  Headset, Clock, XCircle, Loader2, PlayCircle, BadgeCheck,
  Search, Trash2, CheckCheck, Archive,
} from 'lucide-react';
import { toast } from 'react-toastify';

// ── User-type helpers ─────────────────────────────────────────────────────────
function getUserType(chat) {
  if (!chat.userId) return 'guest';
  return (chat.userId?.planCredits?.length ?? 0) > 0 ? 'paid' : 'registered';
}

const USER_TYPE_META = {
  guest:      { label: 'Guest',      color: 'bg-gray-100 text-gray-600',       dot: 'bg-gray-400' },
  registered: { label: 'Registered', color: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500' },
  paid:       { label: 'Paid',       color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
};

function userTypePill(type) {
  const m = USER_TYPE_META[type] ?? USER_TYPE_META.guest;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${m.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

const STATUS_META = {
  AI:         { label: 'AI Chat', color: 'bg-gray-100 text-gray-500' },
  WAITING:    { label: 'Waiting', color: 'bg-yellow-100 text-yellow-700' },
  LIVE_AGENT: { label: 'Live',    color: 'bg-green-100 text-green-700' },
  FIXED:      { label: 'Fixed',   color: 'bg-blue-100 text-blue-700' },
  CLOSED:     { label: 'Closed',  color: 'bg-red-100 text-red-600' },
};

function statusPill(status) {
  const m = STATUS_META[status] ?? STATUS_META.AI;
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.color}`}>{m.label}</span>;
}

function timeAgo(date) {
  if (!date) return '';
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
}

// ── Section tabs ──────────────────────────────────────────────────────────────
// "active"  → AI / WAITING / LIVE_AGENT (ongoing conversations)
// "chatted" → FIXED (already handled, but resolved)
// "closed"  → CLOSED (explicitly closed by admin)
const SECTIONS = [
  { key: 'active',  label: 'Active',             Icon: MessageSquare },
  { key: 'chatted', label: 'Issue Fixed',         Icon: CheckCheck },
  { key: 'closed',  label: 'Closed',             Icon: Archive },
];

const ACTIVE_STATUSES  = ['AI', 'WAITING', 'LIVE_AGENT'];
const CHATTED_STATUSES = ['FIXED'];
const CLOSED_STATUSES  = ['CLOSED'];

function sectionStatuses(section) {
  if (section === 'active')  return ACTIVE_STATUSES;
  if (section === 'chatted') return CHATTED_STATUSES;
  return CLOSED_STATUSES;
}

// ── User-type filter tabs (only for active section) ───────────────────────────
const USER_FILTERS = [
  { key: 'all',        label: 'All',        Icon: Users },
  { key: 'guest',      label: 'Guest',      Icon: User },
  { key: 'registered', label: 'Registered', Icon: UserCheck },
  { key: 'paid',       label: 'Paid',       Icon: CreditCard },
];

// ── MessageBubble ─────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  if (msg.isSystem) {
    return (
      <div className="flex justify-center my-1">
        <span className="bg-gray-100 text-gray-500 italic text-[10px] py-1 px-3 rounded-full">{msg.content}</span>
      </div>
    );
  }
  const isAgent = msg.sender === 'AGENT';
  return (
    <div className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
        isAgent
          ? 'bg-brand-blue text-white rounded-br-none'
          : msg.sender === 'USER'
          ? 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-bl-none'
          : 'bg-gray-50 border border-gray-100 text-gray-500 italic rounded-bl-none'
      }`}>
        {!isAgent && (
          <p className="text-[9px] font-bold uppercase tracking-wide mb-0.5 opacity-60">
            {msg.sender === 'AI' ? 'AI Assistant' : 'User'}
          </p>
        )}
        {msg.content}
      </div>
    </div>
  );
}

// ── ChatListItem ──────────────────────────────────────────────────────────────
function ChatListItem({ chat, isSelected, onClick, hasUnread, onDelete, isDeletable }) {
  const isWaiting  = chat.status === 'WAITING';
  const userType   = getUserType(chat);
  const displayName  = chat.userId?.name  || (chat.guestId ? `Guest · ${chat.guestId.slice(0, 6)}` : 'Guest');
  const displayEmail = chat.userId?.email || 'Anonymous';

  return (
    <div className={`relative group border-b border-gray-100 ${isSelected ? 'bg-blue-50 border-l-2 border-l-brand-blue' : 'hover:bg-gray-50'} transition-colors`}>
      <button onClick={onClick} className="w-full text-left px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              isWaiting ? 'bg-yellow-100' : userType === 'paid' ? 'bg-emerald-100' : 'bg-gray-100'
            }`}>
              <User size={14} className={isWaiting ? 'text-yellow-600' : userType === 'paid' ? 'text-emerald-600' : 'text-gray-500'} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{displayName}</p>
              <p className="text-[10px] text-gray-400 truncate">{displayEmail}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {statusPill(chat.status)}
            <span className="text-[9px] text-gray-400">{timeAgo(chat.lastMessageAt)}</span>
            {hasUnread && <span className="w-2 h-2 bg-red-500 rounded-full" />}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {userTypePill(userType)}
          {isWaiting && (
            <span className="text-[10px] text-yellow-600 font-medium flex items-center gap-1">
              <Clock size={9} /> Waiting
            </span>
          )}
        </div>
      </button>

      {/* Delete button — visible on hover for chatted/closed */}
      {isDeletable && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(chat._id); }}
          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600"
          title="Delete conversation"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, Icon, color, sub }) {
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${color}`}>
      <div className="p-2 rounded-lg bg-white/60"><Icon size={18} /></div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs font-medium mt-0.5 opacity-80">{label}</p>
        {sub && <p className="text-[10px] opacity-60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminChatPage() {
  const socket = useAdminSocket();

  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadChatIds, setUnreadChatIds] = useState(new Set());
  const [section, setSection] = useState('active');       // active | chatted | closed
  const [userFilter, setUserFilter] = useState('all');
  const [search, setSearch] = useState('');

  const scrollRef  = useRef(null);
  const prevChatId = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => { fetchChats(); }, []);

  // ── socket events ──
  useEffect(() => {
    if (!socket) return;

    const onNewRequest = (chat) => {
      setChats((prev) => {
        const exists = prev.some((c) => c._id === chat._id);
        return exists ? prev.map((c) => (c._id === chat._id ? chat : c)) : [chat, ...prev];
      });
      toast.info('🔔 New live agent request', { autoClose: 4000 });
    };

    const onListUpdate = (updated) => {
      setChats((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
      setSelectedChat((prev) => prev?._id === updated._id ? { ...prev, ...updated } : prev);
    };

    const onNewMessage = (message) => {
      const cid = message.chatId?._id ?? message.chatId;
      if (cid === selectedChat?._id) setMessages((prev) => [...prev, message]);
      else setUnreadChatIds((prev) => new Set([...prev, cid]));
    };

    const onSessionStarted = (sysMsg) => {
      const cid = sysMsg.chatId?._id ?? sysMsg.chatId;
      if (cid === selectedChat?._id) {
        setMessages((prev) => [...prev, sysMsg]);
        setSelectedChat((prev) => prev ? { ...prev, status: 'LIVE_AGENT' } : prev);
      }
    };

    const onChatClosed = (sysMsg) => {
      const cid = sysMsg.chatId?._id ?? sysMsg.chatId;
      if (cid === selectedChat?._id) {
        setMessages((prev) => [...prev, sysMsg]);
        // Status update will come via chat_list_update — selectedChat stays in sync
      }
    };

    const onIncoming = ({ chatId }) => {
      if (chatId !== selectedChat?._id) setUnreadChatIds((prev) => new Set([...prev, chatId]));
    };

    socket.on('new_support_request', onNewRequest);
    socket.on('chat_list_update', onListUpdate);
    socket.on('new_message', onNewMessage);
    socket.on('session_started', onSessionStarted);
    socket.on('chat_closed', onChatClosed);
    socket.on('incoming_message', onIncoming);

    return () => {
      socket.off('new_support_request', onNewRequest);
      socket.off('chat_list_update', onListUpdate);
      socket.off('new_message', onNewMessage);
      socket.off('session_started', onSessionStarted);
      socket.off('chat_closed', onChatClosed);
      socket.off('incoming_message', onIncoming);
    };
  }, [socket, selectedChat]);

  // ── helpers ──
  const fetchChats = async () => {
    try {
      setLoading(true);
      const res = await getAllChatsAdmin();
      if (res.success) setChats(res.data);
    } catch { toast.error('Failed to load chats'); }
    finally { setLoading(false); }
  };

  const selectChat = useCallback(async (chat) => {
    if (prevChatId.current && socket) socket.emit('leave_chat', { chatId: prevChatId.current });
    setSelectedChat(chat);
    setMessages([]);
    prevChatId.current = chat._id;
    setUnreadChatIds((prev) => { const n = new Set(prev); n.delete(chat._id); return n; });
    if (socket) socket.emit('join_chat', { chatId: chat._id });
    setMsgLoading(true);
    try {
      const res = await getChatMessagesAdmin(chat._id);
      if (res.success) setMessages(res.data);
    } catch { toast.error('Failed to load messages'); }
    finally { setMsgLoading(false); }
  }, [socket]);

  const startConversation = () => {
    if (!socket || !selectedChat) return;
    socket.emit('start_conversation', { chatId: selectedChat._id });
    setSelectedChat((prev) => ({ ...prev, status: 'LIVE_AGENT' }));
    toast.success('Conversation started');
  };

  const closeChat = (type) => {
    if (!socket || !selectedChat) return;
    socket.emit('close_chat', { chatId: selectedChat._id, type });
    // Optimistic update — backend will send chat_list_update with the real status
    const newStatus = type === 'FIXED' ? 'FIXED' : 'CLOSED';
    setSelectedChat((prev) => ({ ...prev, status: newStatus }));
  };

  const sendMessage = () => {
    if (!input.trim() || !socket || !selectedChat) return;
    if (selectedChat.status !== 'LIVE_AGENT') { toast.warning('Start the conversation first'); return; }
    setSending(true);
    socket.emit('send_message', { chatId: selectedChat._id, content: input });
    setInput('');
    setSending(false);
  };

  const handleDelete = async (chatId) => {
    if (!confirm('Delete this conversation and all its messages? This cannot be undone.')) return;
    try {
      const res = await deleteChatAdmin(chatId);
      if (res.success) {
        setChats((prev) => prev.filter((c) => c._id !== chatId));
        if (selectedChat?._id === chatId) { setSelectedChat(null); setMessages([]); }
        toast.success('Conversation deleted');
      }
    } catch { toast.error('Failed to delete conversation'); }
  };

  // ── derived counts ──
  const activeChats  = chats.filter((c) => ACTIVE_STATUSES.includes(c.status));
  const chattedChats = chats.filter((c) => CHATTED_STATUSES.includes(c.status));
  const closedChats  = chats.filter((c) => CLOSED_STATUSES.includes(c.status));

  const guestCount      = activeChats.filter((c) => getUserType(c) === 'guest').length;
  const registeredCount = activeChats.filter((c) => getUserType(c) === 'registered').length;
  const paidCount       = activeChats.filter((c) => getUserType(c) === 'paid').length;
  const waitingCount    = chats.filter((c) => c.status === 'WAITING').length;

  // ── chat list for current section (+ user filter + search) ──
  const sectionChats = chats.filter((c) => sectionStatuses(section).includes(c.status));

  const filteredChats = sectionChats
    .filter((c) => section !== 'active' || userFilter === 'all' || getUserType(c) === userFilter)
    .filter((c) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.userId?.name?.toLowerCase().includes(q) ||
        c.userId?.email?.toLowerCase().includes(q) ||
        c.guestId?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const order = { WAITING: 0, LIVE_AGENT: 1, AI: 2, FIXED: 3, CLOSED: 4 };
      const oa = order[a.status] ?? 5, ob = order[b.status] ?? 5;
      if (oa !== ob) return oa - ob;
      return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
    });

  const isDeletable = section === 'chatted' || section === 'closed';
  const selectedUserType = selectedChat ? getUserType(selectedChat) : null;
  const isReadOnly = selectedChat && (selectedChat.status === 'FIXED' || selectedChat.status === 'CLOSED');

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 120px)' }}>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
        <StatCard label="Guest Users"      value={guestCount}      Icon={User}       color="border-gray-200 bg-gray-50 text-gray-700"         sub="Anonymous sessions" />
        <StatCard label="Registered Users" value={registeredCount} Icon={UserCheck}  color="border-blue-200 bg-blue-50 text-blue-700"          sub="Signed-in, no plan" />
        <StatCard label="Paid Users"       value={paidCount}       Icon={CreditCard} color="border-emerald-200 bg-emerald-50 text-emerald-700"  sub="Active plan holders" />
        <StatCard
          label="Waiting Now" value={waitingCount} Icon={Headset}
          color={waitingCount > 0 ? 'border-yellow-300 bg-yellow-50 text-yellow-700' : 'border-gray-200 bg-gray-50 text-gray-500'}
          sub="Need live agent"
        />
      </div>

      {/* Main Panel */}
      <div className="flex flex-1 overflow-hidden rounded-2xl border border-gray-200 shadow-sm bg-white min-h-0">

        {/* LEFT: Chat List */}
        <div className="w-72 shrink-0 border-r border-gray-100 flex flex-col">

          {/* Section tabs */}
          <div className="flex border-b border-gray-100 shrink-0">
            {SECTIONS.map(({ key, label, Icon }) => {
              const count = key === 'active' ? activeChats.length : key === 'chatted' ? chattedChats.length : closedChats.length;
              return (
                <button
                  key={key}
                  onClick={() => { setSection(key); setSelectedChat(null); setMessages([]); setUserFilter('all'); setSearch(''); }}
                  className={`flex-1 flex flex-col items-center py-2 px-1 text-[10px] font-semibold transition-colors border-b-2 ${
                    section === key ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Icon size={13} className="mb-0.5" />
                  {label}
                  {count > 0 && (
                    <span className={`mt-0.5 text-[9px] font-bold px-1.5 rounded-full ${
                      section === key ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-500'
                    }`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search + user-type filter (active section only) */}
          <div className="p-3 border-b border-gray-100 shrink-0 space-y-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
            {section === 'active' && (
              <div className="flex gap-1 flex-wrap">
                {USER_FILTERS.map(({ key, label, Icon }) => {
                  const cnt = key === 'all' ? activeChats.length : key === 'guest' ? guestCount : key === 'registered' ? registeredCount : paidCount;
                  return (
                    <button
                      key={key}
                      onClick={() => setUserFilter(key)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                        userFilter === key ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Icon size={10} />
                      {label}
                      <span className={`rounded-full px-1 text-[9px] font-bold ${
                        userFilter === key ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>{cnt}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {section !== 'active' && (
              <p className="text-[10px] text-gray-400">
                {section === 'chatted' ? 'Resolved conversations — hover to delete' : 'Closed sessions — hover to delete'}
              </p>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="animate-spin w-6 h-6 text-brand-blue mx-auto mb-2" />
                <p className="text-xs text-gray-400">Loading…</p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">
                  {section === 'chatted' ? 'No resolved conversations yet' :
                   section === 'closed'  ? 'No closed conversations yet' : 'No chats found'}
                </p>
              </div>
            ) : (
              filteredChats.map((c) => (
                <ChatListItem
                  key={c._id}
                  chat={c}
                  isSelected={selectedChat?._id === c._id}
                  onClick={() => selectChat(c)}
                  hasUnread={unreadChatIds.has(c._id)}
                  onDelete={handleDelete}
                  isDeletable={isDeletable}
                />
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Chat Thread */}
        {selectedChat ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Thread header */}
            <div className="px-5 py-3 border-b border-gray-100 shrink-0 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  selectedUserType === 'paid' ? 'bg-emerald-100' : selectedUserType === 'registered' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <User size={18} className={selectedUserType === 'paid' ? 'text-emerald-600' : selectedUserType === 'registered' ? 'text-blue-600' : 'text-gray-500'} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900">
                      {selectedChat.userId?.name || (selectedChat.guestId ? `Guest · ${selectedChat.guestId.slice(0, 8)}` : 'Guest User')}
                    </p>
                    {userTypePill(selectedUserType)}
                  </div>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                    {selectedChat.userId?.email || 'Anonymous'}
                    <span>·</span>{statusPill(selectedChat.status)}
                    {selectedUserType === 'paid' && (
                      <><span>·</span>
                      <span className="text-emerald-600 font-medium">
                        {selectedChat.userId?.planCredits?.reduce((a, c) => a + c.remainingArticles, 0)} articles remaining
                      </span></>
                    )}
                  </p>
                </div>
              </div>

              {/* Action buttons — only for active chats */}
              {!isReadOnly && (
                <div className="flex items-center gap-2">
                  {selectedChat.status === 'WAITING' && (
                    <button onClick={startConversation} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors">
                      <PlayCircle size={13} /> Start Conversation
                    </button>
                  )}
                  {selectedChat.status === 'LIVE_AGENT' && (
                    <>
                      <button onClick={() => closeChat('FIXED')} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                        <BadgeCheck size={13} /> Mark as Fixed
                      </button>
                      <button onClick={() => closeChat('CLOSE')} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300 transition-colors">
                        <XCircle size={13} /> Close Session
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Delete button for resolved/closed chats */}
              {isReadOnly && (
                <button
                  onClick={() => handleDelete(selectedChat._id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={13} /> Delete
                </button>
              )}
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50/50">
              {msgLoading ? (
                <div className="text-center pt-12"><Loader2 className="animate-spin w-6 h-6 text-brand-blue mx-auto" /></div>
              ) : messages.length === 0 ? (
                <div className="text-center pt-12 text-gray-400 text-sm">No messages yet</div>
              ) : (
                messages.map((msg, idx) => <MessageBubble key={msg._id ?? idx} msg={msg} />)
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100 shrink-0">
              {isReadOnly ? (
                <div className="text-center text-xs text-gray-400 py-2 flex items-center justify-center gap-1.5">
                  {selectedChat.status === 'FIXED'
                    ? <><CheckCheck size={13} className="text-blue-400" /> Issue has been fixed</>
                    : <><Archive size={13} className="text-gray-400" /> This conversation is closed</>}
                </div>
              ) : selectedChat.status !== 'LIVE_AGENT' ? (
                <div className="text-center text-xs text-gray-400 py-2">
                  {selectedChat.status === 'WAITING'
                    ? '⬆ Click "Start Conversation" to connect with this user'
                    : 'AI mode — agent controls appear when user requests live help'}
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a reply…"
                    className="flex-1 bg-gray-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                  <button onClick={sendMessage} disabled={!input.trim() || sending} className="bg-brand-blue text-white p-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    <Send size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
            <MessageSquare size={48} className="mb-3" />
            <p className="text-sm font-medium text-gray-400">Select a conversation</p>
            <p className="text-xs mt-1 text-gray-400">
              {section === 'active' && waitingCount > 0
                ? `${waitingCount} user${waitingCount > 1 ? 's' : ''} waiting for an agent`
                : section === 'chatted' ? `${chattedChats.length} resolved conversation${chattedChats.length !== 1 ? 's' : ''}`
                : section === 'closed'  ? `${closedChats.length} closed conversation${closedChats.length !== 1 ? 's' : ''}`
                : 'No active requests right now'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

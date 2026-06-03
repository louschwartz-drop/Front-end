'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAdminSocket } from '@/context/AdminSocketContext';
import {
  getAllSupportTicketsAdmin,
  getSupportTicketMessagesAdmin,
  deleteSupportTicketAdmin
} from '@/lib/api/admin/chat.api';
import {
  MessageSquare, Send, User, Users, CreditCard, UserCheck,
  Headset, Clock, Loader2, PlayCircle, BadgeCheck,
  Search, Trash2, Archive, ChevronLeft
} from 'lucide-react';
import { toast } from 'react-toastify';
import adminAuthStore from '@/store/adminAuthStore';

// ── User-type helpers ─────────────────────────────────────────────────────────
function getUserType(ticket) {
  if (!ticket.userId) return 'registered';
  return (ticket.userId?.planCredits?.length ?? 0) > 0 ? 'paid' : 'registered';
}

const USER_TYPE_META = {
  registered: { label: 'Registered', color: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500' },
  paid:       { label: 'Paid',       color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
};

function userTypePill(type) {
  const m = USER_TYPE_META[type] ?? USER_TYPE_META.registered;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full ${m.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

const STATUS_META = {
  open:   { label: 'Open',   color: 'bg-green-100 text-green-700 animate-pulse' },
  closed: { label: 'Closed', color: 'bg-red-100 text-red-600' },
};

function statusPill(status) {
  const m = STATUS_META[status] ?? STATUS_META.open;
  return <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full ${m.color}`}>{m.label}</span>;
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
const SECTIONS = [
  { key: 'active',  label: 'Active / New',       Icon: MessageSquare },
  { key: 'closed',  label: 'Closed / Resolved',  Icon: Archive },
];

const ACTIVE_STATUSES  = ['open'];
const CLOSED_STATUSES  = ['closed'];

function sectionStatuses(section) {
  if (section === 'active')  return ACTIVE_STATUSES;
  return CLOSED_STATUSES;
}

// ── User-type filter tabs (only for active section) ───────────────────────────
const USER_FILTERS = [
  { key: 'all',        label: 'All',        Icon: Users },
  { key: 'registered', label: 'Registered', Icon: UserCheck },
  { key: 'paid',       label: 'Paid',       Icon: CreditCard },
];

const formatContent = (content, isAgent) => {
  if (!content) return '';
  const urlRegex = /(\[[^\]]+\]\((?:https?:\/\/|\/)[^\s)]+\)|https?:\/\/[^\s]+?[^\s.,;?!()\]}\s](?=[.,;?!()\]}\s]|$))/g;
  const parts = content.split(urlRegex);

  return parts.map((part, i) => {
    if (!part) return null;

    const mdMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (mdMatch) {
      return (
        <a
          key={i}
          href={mdMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline font-semibold cursor-pointer ${isAgent ? 'text-blue-100' : 'text-brand-blue'}`}
        >
          {mdMatch[1]}
        </a>
      );
    }

    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline break-all ${isAgent ? 'text-blue-100 font-medium' : 'text-brand-blue'}`}
        >
          {part}
        </a>
      );
    }

    if (typeof part === 'string' && part.includes('**')) {
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((bp, bidx) => {
        if (bp.startsWith('**') && bp.endsWith('**')) {
          return <strong key={`${i}-${bidx}`} className="font-extrabold">{bp.slice(2, -2)}</strong>;
        }
        return bp;
      });
    }

    return part;
  });
};

const renderMessageContent = (content, isAgent) => {
  if (!content) return null;
  const lines = content.split('\n');
  return lines.map((line, i) => {
    const isBullet = line.trim().startsWith('- ');
    return (
      <div key={i} className={`${isBullet ? 'flex gap-2 ml-1 my-1' : 'mb-1 last:mb-0'}`}>
        {isBullet && <span className="shrink-0">•</span>}
        <span>{formatContent(isBullet ? line.trim().slice(2) : line, isAgent)}</span>
      </div>
    );
  });
};

// ── MessageBubble ─────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  if (msg.isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="bg-gray-100 text-gray-500 italic text-[10px] py-1 px-3 rounded-full">{msg.content}</span>
      </div>
    );
  }
  const isAgent = msg.sender === 'AGENT';
  return (
    <div className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] sm:max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
        isAgent
          ? 'bg-brand-blue text-white rounded-br-none'
          : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-bl-none'
      }`}>
        {!isAgent && (
          <p className="text-[9px] font-bold uppercase tracking-wide mb-0.5 opacity-60">
            User
          </p>
        )}
        {renderMessageContent(msg.content, isAgent)}
      </div>
    </div>
  );
}

// ── ChatListItem ──────────────────────────────────────────────────────────────
function ChatListItem({ chat, isSelected, onClick, hasUnread, onDelete, isDeletable }) {
  const userType   = getUserType(chat);
  const displayName  = chat.userId?.name  || 'User';
  const displayEmail = chat.userId?.email || 'Anonymous';

  return (
    <div className={`relative group border-b border-gray-100 ${isSelected ? 'bg-blue-50/75 border-l-2 border-l-brand-blue' : 'hover:bg-gray-50'} transition-colors`}>
      <button onClick={onClick} className="w-full text-left px-4 py-3 cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100`}>
              <User size={14} className="text-gray-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold text-brand-blue">{chat.ticketId}</span>
                <span className="text-[9px] bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">{chat.category}</span>
              </div>
              <p className="text-xs font-semibold text-gray-800 truncate mt-0.5">{displayName}</p>
              <p className="text-xs font-medium text-gray-500 truncate line-clamp-1">{chat.subject}</p>
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
        </div>
      </button>

      {/* Delete button — visible on hover for closed */}
      {isDeletable && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(chat._id); }}
          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 cursor-pointer"
          title="Delete Support Ticket"
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
    <div className={`rounded-xl border p-3 sm:p-4 flex items-center gap-3 ${color} shadow-sm`}>
      <div className="p-1.5 sm:p-2 rounded-lg bg-white/60 shrink-0"><Icon size={16} className="sm:w-[18px] sm:h-[18px]" /></div>
      <div className="min-w-0 flex-1">
        <p className="text-lg sm:text-2xl font-bold leading-none">{value}</p>
        <p className="text-[10px] sm:text-xs font-semibold mt-0.5 opacity-80 truncate">{label}</p>
        {sub && <p className="text-[9px] sm:text-[10px] opacity-60 mt-0.5 truncate">{sub}</p>}
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
  const [section, setSection] = useState('active');       // active | closed
  const [userFilter, setUserFilter] = useState('all');
  const [search, setSearch] = useState('');

  const scrollRef  = useRef(null);
  const prevChatId = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => { fetchChats(); }, []);

  useEffect(() => {
    if (socket) {
      const admin = adminAuthStore.getState().admin;
      const adminId = admin?._id || admin?.id;
      if (adminId) {
        socket.emit('join_admin', { adminId });
        socket.emit('join_admin_room');
      }
    }
  }, [socket]);

  // ── socket events ──
  useEffect(() => {
    if (!socket) return;

    const onNewRequest = (ticket) => {
      setChats((prev) => {
        const exists = prev.some((c) => c._id === ticket._id);
        return exists ? prev.map((c) => (c._id === ticket._id ? ticket : c)) : [ticket, ...prev];
      });
      toast.info(`🚨 New Support Ticket - ${ticket.ticketId}`, { autoClose: 4000 });
    };

    const onListUpdate = (updated) => {
      setChats((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
      setSelectedChat((prev) => prev?._id === updated._id ? { ...prev, ...updated } : prev);
    };

    const onNewMessage = (message) => {
      if (message.ticketId === selectedChat?._id) {
        setMessages((prev) => {
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
      } else {
        setUnreadChatIds((prev) => new Set([...prev, message.ticketId]));
      }
    };

    const onAgentAssigned = (data) => {
      setSelectedChat((prev) => {
        if (prev && prev._id === data.ticketId) {
          return { ...prev, agentId: data.agentId };
        }
        return prev;
      });
      if (selectedChat && selectedChat._id === data.ticketId) {
        setMessages((prev) => [
          ...prev,
          {
            _id: `sys-${Date.now()}`,
            content: `Agent ${data.agentName} has claimed this support ticket.`,
            sender: 'AGENT',
            isSystem: true,
            createdAt: new Date().toISOString(),
          }
        ]);
      }
    };

    const onTicketClosed = (data) => {
      setSelectedChat((prev) => {
        if (prev && prev._id === data.ticketId) {
          return { ...prev, status: 'closed' };
        }
        return prev;
      });
      if (selectedChat && selectedChat._id === data.ticketId) {
        setMessages((prev) => [
          ...prev,
          {
            _id: `sys-${Date.now()}`,
            content: `This ticket has been marked as resolved and closed.`,
            sender: 'AGENT',
            isSystem: true,
            createdAt: new Date().toISOString(),
          }
        ]);
      }
    };

    const onIncoming = ({ ticketId }) => {
      if (ticketId !== selectedChat?._id) setUnreadChatIds((prev) => new Set([...prev, ticketId]));
    };

    socket.on('new_support_request', onNewRequest);
    socket.on('chat_list_update', onListUpdate);
    socket.on('new_message', onNewMessage);
    socket.on('agent_assigned', onAgentAssigned);
    socket.on('ticket_closed', onTicketClosed);
    socket.on('incoming_message', onIncoming);
    socket.on('connect', fetchChats);

    return () => {
      socket.off('new_support_request', onNewRequest);
      socket.off('chat_list_update', onListUpdate);
      socket.off('new_message', onNewMessage);
      socket.off('agent_assigned', onAgentAssigned);
      socket.off('ticket_closed', onTicketClosed);
      socket.off('incoming_message', onIncoming);
      socket.off('connect', fetchChats);
    };
  }, [socket, selectedChat]);

  // ── helpers ──
  const fetchChats = async () => {
    try {
      setLoading(true);
      const res = await getAllSupportTicketsAdmin();
      if (res.success) setChats(res.data || []);
    } catch { toast.error('Failed to load tickets'); }
    finally { setLoading(false); }
  };

  const selectChat = useCallback(async (ticket) => {
    if (prevChatId.current && socket) socket.emit('leave_chat', { ticketId: prevChatId.current });
    setSelectedChat(ticket);
    setMessages([]);
    prevChatId.current = ticket._id;
    setUnreadChatIds((prev) => { const n = new Set(prev); n.delete(ticket._id); return n; });
    if (socket) socket.emit('join_chat', { ticketId: ticket._id });
    setMsgLoading(true);
    try {
      const res = await getSupportTicketMessagesAdmin(ticket._id);
      if (res.success) setMessages(res.data || []);
    } catch { toast.error('Failed to load messages'); }
    finally { setMsgLoading(false); }
  }, [socket]);

  const claimTicket = () => {
    if (!socket || !selectedChat) return;
    socket.emit('start_conversation', { ticketId: selectedChat._id });
    toast.success('Conversation started successfully');
  };

  const resolveTicket = () => {
    if (!socket || !selectedChat) return;
    socket.emit('close_chat', { ticketId: selectedChat._id });
    toast.success('Ticket closed and resolved');
  };

  const sendMessage = () => {
    if (!input.trim() || !socket || !selectedChat) return;
    if (!selectedChat.agentId) { toast.warning('Claim the support ticket first'); return; }
    
    // Client validations
    const hasHtml = /<\/?[a-z][\s\S]*>/i.test(input);
    if (hasHtml) {
      toast.error('HTML tags are not allowed in messages.');
      return;
    }
    if (input.length > 1000) {
      toast.error('Message is too long (max 1000 characters).');
      return;
    }

    setSending(true);
    socket.emit('send_message', { ticketId: selectedChat._id, content: input.trim() });
    setInput('');
    setSending(false);
  };

  const handleDelete = async (ticketId) => {
    if (!confirm('Delete this support ticket and all its message history? This cannot be undone.')) return;
    try {
      const res = await deleteSupportTicketAdmin(ticketId);
      if (res.success) {
        setChats((prev) => prev.filter((c) => c._id !== ticketId));
        if (selectedChat?._id === ticketId) { setSelectedChat(null); setMessages([]); }
        toast.success('Ticket deleted');
      }
    } catch { toast.error('Failed to delete support ticket'); }
  };

  // ── derived counts ──
  const activeChats = chats.filter((c) => ACTIVE_STATUSES.includes(c.status));
  const closedChats = chats.filter((c) => CLOSED_STATUSES.includes(c.status));

  const registeredCount = activeChats.filter((c) => getUserType(c) === 'registered').length;
  const paidCount       = activeChats.filter((c) => getUserType(c) === 'paid').length;
  const waitingCount    = activeChats.filter((c) => !c.agentId).length;

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
        c.ticketId?.toLowerCase().includes(q) ||
        c.subject?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      // Prioritize unassigned open tickets, then sort by lastMessageAt
      const hasAgentA = !!a.agentId, hasAgentB = !!b.agentId;
      if (hasAgentA !== hasAgentB) return hasAgentA ? 1 : -1;
      return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
    });

  const isDeletable = section === 'closed';
  const selectedUserType = selectedChat ? getUserType(selectedChat) : null;
  const isReadOnly = selectedChat && selectedChat.status === 'closed';

  return (
    <div className="flex flex-col gap-4 w-full h-[calc(100vh-96px)] sm:h-[calc(100vh-112px)] lg:h-[calc(100vh-128px)]">

      {/* Adaptive Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
        <StatCard label="Registered Users" value={registeredCount} Icon={UserCheck}  color="border-blue-200 bg-blue-50 text-blue-700"          sub="Open tickets, no paid plan" />
        <StatCard label="Paid Users"       value={paidCount}       Icon={CreditCard} color="border-emerald-200 bg-emerald-50 text-emerald-700"  sub="Open tickets from plan holders" />
        <StatCard
          label="Open Tickets" value={activeChats.length} Icon={Headset}
          color={activeChats.length > 0 ? 'border-yellow-300 bg-yellow-50 text-yellow-700' : 'border-gray-200 bg-gray-50 text-gray-500'}
          sub="Total open tickets in queue"
        />
      </div>

      {/* Main Responsive Split Panel */}
      <div className="flex flex-1 overflow-hidden rounded-2xl border border-gray-200 shadow-sm bg-white min-h-0 relative">

        {/* LEFT PANEL: Chat List */}
        <div className={`w-full md:w-72 shrink-0 border-r border-gray-100 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>

          {/* Section tabs */}
          <div className="flex border-b border-gray-100 shrink-0">
            {SECTIONS.map(({ key, label, Icon }) => {
              const count = key === 'active' ? activeChats.length : closedChats.length;
              return (
                <button
                  key={key}
                  onClick={() => { setSection(key); setSelectedChat(null); setMessages([]); setUserFilter('all'); setSearch(''); }}
                  className={`flex-1 flex flex-col items-center py-2 px-1 text-[10px] font-semibold transition-colors border-b-2 border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200 cursor-pointer ${
                    section === key ? '!border-brand-blue !text-brand-blue bg-blue-50/10' : ''
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
          <div className="p-3 border-b border-gray-100 shrink-0 space-y-2 bg-gray-50/35">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search ticket, name or subject…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
            {section === 'active' && (
              <div className="flex gap-1 flex-wrap">
                {USER_FILTERS.map(({ key, label, Icon }) => {
                  const cnt = key === 'all' ? activeChats.length : key === 'registered' ? registeredCount : paidCount;
                  return (
                    <button
                      key={key}
                      onClick={() => setUserFilter(key)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
                        userFilter === key ? 'bg-brand-blue text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
              <p className="text-[10px] text-gray-400 italic">
                Resolved tickets — hover over list item to delete
              </p>
            )}
          </div>

          {/* List Wrapper */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="animate-spin w-6 h-6 text-brand-blue mx-auto mb-2" />
                <p className="text-xs text-gray-400">Loading support tickets...</p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">
                  {section === 'closed' ? 'No resolved tickets' : 'No active tickets'}
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

        {/* RIGHT PANEL: Chat Thread */}
        {selectedChat ? (
          <div className={`flex-1 flex flex-col min-w-0 ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
            {/* Thread header */}
            <div className="px-4 py-3 border-b border-gray-100 shrink-0 flex items-center justify-between bg-white gap-2">
              <div className="flex items-center gap-3 min-w-0">
                {/* Back Button for Mobile View */}
                <button
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500 mr-0.5 cursor-pointer shrink-0 transition-colors"
                  title="Back to list"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>

                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  selectedUserType === 'paid' ? 'bg-emerald-100' : 'bg-blue-100'
                }`}>
                  <User size={18} className={selectedUserType === 'paid' ? 'text-emerald-600' : 'text-blue-600'} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900 truncate max-w-[120px] sm:max-w-[200px]">
                      {selectedChat.userId?.name || 'User'}
                    </p>
                    {userTypePill(selectedUserType)}
                  </div>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5 truncate">
                    <span className="truncate max-w-[120px] sm:max-w-[180px]">{selectedChat.userId?.email || 'Anonymous'}</span>
                    <span>·</span>{statusPill(selectedChat.status)}
                    <span>·</span><span className="font-semibold text-brand-blue">{selectedChat.ticketId}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons Panel */}
              {!isReadOnly && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {!selectedChat.agentId && (
                    <button onClick={claimTicket} className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white text-[10px] sm:text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors cursor-pointer shadow-sm">
                      <PlayCircle size={12} /> Start conversation
                    </button>
                  )}
                  {selectedChat.agentId && (
                    <button onClick={resolveTicket} className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white text-[10px] sm:text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer shadow-sm">
                      <BadgeCheck size={12} /> Close & Resolve
                    </button>
                  )}
                </div>
              )}

              {/* Delete button for resolved/closed chats */}
              {isReadOnly && (
                <button
                  onClick={() => handleDelete(selectedChat._id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-500 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 size={13} /> <span className="hidden sm:inline">Delete Ticket</span><span className="sm:hidden">Delete</span>
                </button>
              )}
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-gray-50/40">
              {!msgLoading && selectedChat && (
                <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl p-4 border border-blue-100/50 shadow-sm space-y-3 mb-4 text-left">
                  <div className="flex items-center gap-2 pb-2 border-b border-blue-100/50">
                    <div className="w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
                    <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest">Support Ticket Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Ticket Number</p>
                      <p className="font-extrabold text-brand-blue">{selectedChat.ticketId}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Issue Type</p>
                      <p className="font-bold text-gray-700">{selectedChat.category}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Subject</p>
                      <p className="font-bold text-gray-800 line-clamp-1">{selectedChat.subject}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">User</p>
                      <p className="font-bold text-gray-800">{selectedChat.userId?.name || 'User'}</p>
                    </div>
                  </div>
                </div>
              )}

              {msgLoading ? (
                <div className="text-center pt-12"><Loader2 className="animate-spin w-6 h-6 text-brand-blue mx-auto" /></div>
              ) : messages.length === 0 ? (
                <div className="text-center pt-12 text-gray-400 text-sm italic">No messages in ticket room.</div>
              ) : (
                messages.map((msg, idx) => <MessageBubble key={msg._id ?? idx} msg={msg} />)
              )}
            </div>

            {/* Input Form Panel */}
            <div className="p-3 sm:p-4 bg-white border-t border-gray-100 shrink-0">
              {isReadOnly ? (
                <div className="text-center text-xs text-gray-400 py-2 flex items-center justify-center gap-1.5">
                  <Archive size={13} className="text-gray-400" /> Support ticket has been marked as closed & resolved
                </div>
              ) : !selectedChat.agentId ? (
                <div className="text-center text-xs text-gray-400 py-2 font-medium italic">
                  ⬆ Click "Claim Ticket" above to assign yourself and write a response
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a support reply…"
                    className="flex-1 bg-gray-100 rounded-xl px-4 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-brand-blue/20 focus:bg-white transition-all text-gray-900"
                  />
                  <button onClick={sendMessage} disabled={!input.trim() || sending} className="bg-brand-blue text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer shrink-0">
                    <Send size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty Selection Placeholder */
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300 p-6 text-center">
            <MessageSquare size={44} className="mb-3 text-gray-200 animate-bounce" />
            <p className="text-sm font-bold text-gray-400">Select a support ticket</p>
            <p className="text-xs mt-1 text-gray-400 max-w-xs">
              {section === 'active' && waitingCount > 0
                ? `${waitingCount} ticket${waitingCount > 1 ? 's' : ''} currently unassigned in the queue`
                : section === 'closed' ? `${closedChats.length} resolved tickets`
                : 'No pending claims at this moment'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

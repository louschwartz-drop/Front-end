'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '@/context/SocketContext';
import { getOrCreateChat, getChatMessages, getChatHistory } from '@/lib/api/user/chat.api';
import userAuthStore from '@/store/userAuthStore';
import { useRouter } from 'next/navigation';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Headset,
  AlertCircle,
  Clock,
  Copy,
  Check,
  ChevronLeft,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import LoginModal from '../landingPage/LoginModal';

// ── constants ────────────────────────────────────────────────────────────────
const AGENT_TIMEOUT_MS = 5 * 60 * 1000; // match server-side value

// ── sub-components ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 rounded-tl-none">
        <div className="flex gap-1 items-center h-4">
          {[0, 0.2, 0.4].map((delay, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function WaitingBanner({ secondsLeft }) {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  return (
    <div className="flex justify-center py-1">
      <div className="flex items-center gap-2 bg-blue-50 text-blue-600 text-[11px] font-medium py-1.5 px-4 rounded-full">
        <Clock size={11} className="animate-pulse" />
        Waiting for agent…{' '}
        <span className="tabular-nums">
          {mins}:{secs.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}

function TimeoutBanner({ onRetry }) {
  return (
    <div className="flex justify-center py-1">
      <div className="bg-red-50 border border-red-100 text-red-600 text-[11px] rounded-xl px-3 py-2 text-center max-w-[85%]">
        <div className="flex items-center gap-1 mb-1 font-semibold">
          <AlertCircle size={11} /> Agent not available
        </div>
        <p className="text-red-500">
          No agent connected in time.{' '}
          <button
            onClick={onRetry}
            className="underline font-medium hover:text-red-700"
          >
            Try again
          </button>{' '}
          or ask the AI assistant below.
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  const [copied, setCopied] = useState(false);

  if (msg.isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="bg-gray-100 text-gray-500 italic text-[10px] py-1 px-3 rounded-full">
          {msg.content}
        </span>
      </div>
    );
  }

  const isUser = msg.sender === 'USER';

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatContent = (content) => {
    if (!content) return null;
    // Simple regex for URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline break-all ${isUser ? 'text-blue-100 font-medium' : 'text-primary'}`}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1`}>
      <div className={`flex items-start gap-2 max-w-[85%] group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div
          className={`p-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed relative ${isUser
            ? 'bg-primary text-white rounded-tr-none'
            : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'
            }`}
        >
          {formatContent(msg.content)}
        </div>

        <button
          onClick={handleCopy}
          className={`mt-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600`}
          title="Copy to clipboard"
        >
          {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
        </button>
      </div>
      <span className="text-[9px] text-gray-400 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const socket = useSocket();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chat, setChat] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // history state
  const [view, setView] = useState('chat'); // 'chat' | 'history-list' | 'history-detail'
  const [historyChats, setHistoryChats] = useState([]);
  const [selectedHistoryChat, setSelectedHistoryChat] = useState(null);
  const [historyMessages, setHistoryMessages] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  // agent-wait state
  const [isWaiting, setIsWaiting] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(AGENT_TIMEOUT_MS / 1000);

  const scrollRef = useRef(null);
  const countdownRef = useRef(null);
  const pendingActionRef = useRef(null);
  const isInitializingRef = useRef(false);
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // ── responsive detection ──
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Logged-in user info (reactive)
  const { user: currentUser, isAuthenticated } = userAuthStore();

  // ── react to auth changes ──
  useEffect(() => {
    // If user logs out
    if (!isAuthenticated && chat?.userId) {
      console.log("🔄 User logged out, switching to guest mode...");
      
      // 1. Cancel any active agent request
      if (isWaiting && socket && chat?._id) {
        socket.emit('cancel_agent_request', { chatId: chat._id });
        stopWaiting();
      }
      
      // 2. Reset states
      setTimedOut(false);
      setMessages([]);
      setChat(null);
      setView('chat');
      
      // 3. Generate a fresh guest ID on logout to ensure "new guest" behavior
      const newGuestId = Math.random().toString(36).substring(7);
      localStorage.setItem('chat_guest_id', newGuestId);
      initChat();
    }
    // If user logs in (or just loaded auth)
    else if (isAuthenticated && (!chat || chat.guestId)) {
      console.log("🔄 User logged in, migrating/syncing session...");
      initChat();
    }
  }, [isAuthenticated]);

  // ── click outside handler ──
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking inside the chat window
      if (containerRef.current && containerRef.current.contains(event.target)) return;
      
      // Don't close if login modal is open (so clicks on modal don't close the chat)
      if (isLoginModalOpen) return;

      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // ── scroll to bottom on new messages or view change back to chat ──
  useEffect(() => {
    if (view === 'chat' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isWaiting, view]);

  // ── init chat when widget opens ──
  useEffect(() => {
    if (isOpen && !chat) initChat();
  }, [isOpen]);

  // ── socket event listeners ──
  useEffect(() => {
    if (!chat || !socket) return;

    const joinRoom = () => {
      socket.emit('join_chat', { chatId: chat._id });
      console.log('💬 Socket joined/re-joined chat room:', chat._id);
    };

    // Join immediately
    joinRoom();

    // Re-join on every (re)connection
    socket.on('connect', joinRoom);

    const onNewMessage = (msg) => {
      setMessages((prev) => {
        // If it's a message from the user, check if we already have it optimistically
        if (msg.sender === 'USER') {
          const exists = prev.find(
            (m) => m.content === msg.content && m._id?.toString().startsWith('temp-')
          );
          if (exists) {
            // Replace the temp message with the real one from the server
            return prev.map((m) => (m._id === exists._id ? msg : m));
          }
        }
        // Otherwise, just append
        return [...prev, msg];
      });

      if (msg.sender === 'AI' || msg.sender === 'AGENT') {
        setIsTyping(false);
      }
    };

    const onStatusChange = ({ status }) => {
      setChat((prev) => ({ ...prev, status }));
    };

    const onSessionStarted = (sysMsg) => {
      // Agent connected – cancel waiting state
      stopWaiting();
      setMessages((prev) => [...prev, sysMsg]);
      setChat((prev) => ({ ...prev, status: 'LIVE_AGENT' }));
    };

    const onChatClosed = (sysMsg) => {
      setMessages((prev) => [...prev, sysMsg]);
      setChat((prev) => ({ ...prev, status: 'AI' }));
      stopWaiting();
    };

    const onAgentTimeout = (sysMsg) => {
      // Server confirmed the timeout – revert to AI
      stopWaiting();
      setTimedOut(true);
      setMessages((prev) => [...prev, sysMsg]);
      setChat((prev) => ({ ...prev, status: 'AI' }));
    };

    socket.on('new_message', onNewMessage);
    socket.on('status_change', onStatusChange);
    socket.on('session_started', onSessionStarted);
    socket.on('chat_closed', onChatClosed);
    socket.on('agent_timeout', onAgentTimeout);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('new_message', onNewMessage);
      socket.off('status_change', onStatusChange);
      socket.off('session_started', onSessionStarted);
      socket.off('chat_closed', onChatClosed);
      socket.off('agent_timeout', onAgentTimeout);
    };
  }, [chat, socket]);

  // ── helpers ──
  const stopWaiting = useCallback(() => {
    setIsWaiting(false);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setSecondsLeft(AGENT_TIMEOUT_MS / 1000);
  }, []);

  const startWaitingCountdown = useCallback((initialSeconds) => {
    setIsWaiting(true);
    setTimedOut(false);
    const startSecs = initialSeconds !== undefined ? initialSeconds : AGENT_TIMEOUT_MS / 1000;
    setSecondsLeft(startSecs);

    if (countdownRef.current) clearInterval(countdownRef.current);

    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          setIsWaiting(false);
          setTimedOut(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const initChat = async () => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    try {
      const user = userAuthStore.getState().user;
      let userId = user?._id || user?.id || null;
      let guestId = localStorage.getItem('chat_guest_id');

      if (!userId && !guestId) {
        guestId = Math.random().toString(36).substring(7);
        localStorage.setItem('chat_guest_id', guestId);
      }

      const res = await getOrCreateChat(userId, guestId);
      if (!res.success) {
        throw new Error(res.message || 'Unknown error');
      }

      setChat(res.data);

      const msgRes = await getChatMessages(res.data._id);
      if (msgRes.success) {
        setMessages(msgRes.data);
        if (msgRes.data.length < 30) setHasMore(false);
      }

      // Restore waiting UI if chat was already WAITING (e.g. page refresh)
      if (res.data.status === 'WAITING' && res.data.waitingStartedAt) {
        const startedAt = new Date(res.data.waitingStartedAt).getTime();
        const now = new Date().getTime();
        const elapsedSecs = Math.floor((now - startedAt) / 1000);
        const remainingSecs = (AGENT_TIMEOUT_MS / 1000) - elapsedSecs;

        if (remainingSecs > 0) {
          startWaitingCountdown(remainingSecs);
        } else {
          // Already timed out but server hasn't updated yet or we just synced
          setIsWaiting(false);
          setTimedOut(true);
        }
      }

      // Handle auto-trigger of live agent request if pending after login
      if (pendingActionRef.current === 'request_agent') {
        console.log("🚀 Auto-triggering live agent request after sync...");
        socket.emit('request_live_agent', { chatId: res.data._id });
        startWaitingCountdown();
        pendingActionRef.current = null;
      }
    } catch (err) {
      console.error('Failed to init chat:', err.message || err);
    } finally {
      isInitializingRef.current = false;
    }
  };

  const loadMoreMessages = async () => {
    if (!chat || !hasMore || isLoadingHistory) return;

    setIsLoadingHistory(true);
    try {
      const firstMsg = messages[0];
      const res = await getChatMessages(chat._id, 30, firstMsg?.createdAt);

      if (res.success) {
        if (res.data.length === 0) {
          setHasMore(false);
        } else {
          setMessages(prev => [...res.data, ...prev]);
          if (res.data.length < 30) setHasMore(false);
        }
      }
    } catch (err) {
      console.error("Failed to load more messages:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleScroll = (e) => {
    if (e.target.scrollTop === 0 && hasMore) {
      loadMoreMessages();
    }
  };

  const handleSend = () => {
    if (!input.trim() || !chat || !socket || isWaiting) return;

    const tempMsg = {
      _id: `temp-${Date.now()}`,
      content: input,
      sender: 'USER',
      createdAt: new Date().toISOString(),
      chatId: chat._id
    };

    // Optimistic Update
    setMessages((prev) => [...prev, tempMsg]);

    socket.emit('send_message', { chatId: chat._id, content: input });
    setInput('');

    // Show typing indicator only in AI mode
    if (chat.status === 'AI') setIsTyping(true);
  };

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const requestAgent = () => {
    if (!chat || !socket || isWaiting) return;

    // Use store state directly to avoid stale closure issues in async callbacks
    const latestUser = userAuthStore.getState().user;

    if (!latestUser) {
      pendingActionRef.current = 'request_agent';
      setIsLoginModalOpen(true);
      return;
    }

    socket.emit('request_live_agent', { chatId: chat._id });
    startWaitingCountdown();
  };

  const handleLoginSuccess = () => {
    console.log("👋 Login success, pending action:", pendingActionRef.current);
  };

  const cancelAgentRequest = () => {
    if (!chat || !socket) return;
    socket.emit('cancel_agent_request', { chatId: chat._id });
    stopWaiting();
  };

  const handleRetryAgent = () => {
    setTimedOut(false);
  };

  const fetchHistory = async () => {
    setView('history-list');
    setHistoryChats([]);
    setIsLoadingHistory(true);
    try {
      const res = await getChatHistory();
      if (res.success) setHistoryChats(res.data || []);
    } catch (err) {
      toast.error('Failed to load history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const openHistoryDetail = async (chat) => {
    setSelectedHistoryChat(chat);
    setHistoryMessages([]);
    setIsLoadingHistory(true);
    setView('history-detail');
    try {
      const res = await getChatMessages(chat._id);
      if (res.success) setHistoryMessages(res.data || []);
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── derived flags ──
  const isLive = chat?.status === 'LIVE_AGENT';
  const isAI = chat?.status === 'AI';
  const inputDisabled = isWaiting || isTyping || !chat || !socket;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className={`fixed z-[1000] flex flex-col items-end transition-all duration-300 ${isOpen && isMobile ? 'bottom-0 left-0 right-0' : isMobile ? 'bottom-3 right-3' : 'bottom-4 right-4'}`}>
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            ref={containerRef}
            key="chat-window"
            drag={!isMobile}
            dragMomentum={false}
            initial={isMobile ? { opacity: 0, y: 100 } : { opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { opacity: 0, y: 100 } : { opacity: 0, scale: 0.8, y: 20 }}
            className={`bg-white flex flex-col overflow-hidden touch-none ${isMobile 
              ? 'w-full rounded-none border-t border-gray-100' 
              : 'mb-4 w-80 sm:w-96 rounded-2xl shadow-2xl border border-gray-100'
            }`}
            style={{ height: isMobile ? 'calc(100vh - 64px)' : '520px' }}
          >
            {/* Header */}
            <div className={`p-4 flex items-center justify-between text-white shrink-0 transition-colors ${!isMobile ? 'cursor-move' : ''} ${view === 'history-detail' ? 'bg-blue-600' : 'bg-primary'}`}>
              <div className="flex items-center gap-2">
                {view !== 'chat' ? (
                  <button
                    onClick={() => view === 'history-detail' ? setView('history-list') : setView('chat')}
                    className="p-1 hover:bg-white/10 rounded-full mr-1"
                  >
                    <ChevronLeft size={20} />
                  </button>
                ) : (
                  <div className="bg-white/20 p-2 rounded-lg">
                    {isLive ? <Headset size={20} /> : <Bot size={20} />}
                  </div>
                )}
                <div>
                  {view === 'history-list' ? (
                    <h3 className="font-bold text-sm">Past Tickets</h3>
                  ) : view === 'history-detail' ? (
                    <>
                      <h3 className="font-bold text-sm">{selectedHistoryChat?.ticketId || 'Session History'}</h3>
                      <p className="text-[9px] text-white/70">
                        {new Date(selectedHistoryChat?.createdAt).toLocaleDateString()}
                      </p>
                    </>
                  ) : currentUser ? (
                    <>
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-sm leading-tight">{currentUser.name}</h3>
                        {view === 'chat' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchHistory();
                            }}
                            className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-white hover:bg-white/20 transition-colors flex items-center gap-1.5"
                          >
                            <Clock size={11} /> See History
                          </button>
                        )}
                      </div>
                      <p className="text-[9px] text-white/70 truncate max-w-[160px]">{currentUser.email}</p>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-sm">DropPR Support</h3>
                      {currentUser && view === 'chat' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchHistory();
                          }}
                          className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-white hover:bg-white/20 transition-colors flex items-center gap-1.5"
                        >
                          <Clock size={11} /> See History
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-[10px] text-white/80 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    {isLive
                      ? 'Live Agent • Connected'
                      : isWaiting
                        ? 'Connecting to Agent…'
                        : 'Online • AI Assistant'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/10 p-1 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* View Switching */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              {view === 'chat' && (
                <div
                  ref={scrollRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50"
                >
                  {isLoadingHistory && (
                    <div className="flex justify-center py-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {messages.map((msg, idx) => (
                    <MessageBubble key={msg._id ?? idx} msg={msg} />
                  ))}

                  {isWaiting && <WaitingBanner secondsLeft={secondsLeft} />}
                  {timedOut && !isWaiting && <TimeoutBanner onRetry={handleRetryAgent} />}
                  {isTyping && <TypingIndicator />}
                </div>
              )}

              {view === 'history-list' && (
                <div className="flex-1 overflow-y-auto bg-gray-50/50 flex flex-col">
                  {isLoadingHistory ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 transition-all">
                      <div className="relative">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <Bot size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary/40" />
                      </div>
                      <p className="mt-4 text-sm font-bold text-gray-400 animate-pulse">Fetching history...</p>
                    </div>
                  ) : historyChats.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center transition-all">
                      <div className="bg-gray-100 p-6 rounded-full mb-4">
                        <MessageCircle size={48} className="text-gray-300" />
                      </div>
                      <p className="text-sm font-bold text-gray-500">No support history found</p>
                      <p className="text-xs text-gray-400 mt-1">When you have past conversations, they'll appear here.</p>
                    </div>
                  ) : (
                    historyChats.map((h) => (
                      <button
                        key={h._id}
                        onClick={() => {
                          if (chat?._id === h._id) {
                            setView('chat');
                          } else {
                            openHistoryDetail(h);
                          }
                        }}
                        className="w-full text-left p-4 border-b border-gray-100 bg-white hover:bg-gray-50 transition-colors group flex items-start justify-between"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-extrabold text-primary tracking-tight">
                            {h.ticketId || `SESSION-${h._id?.slice(-6).toUpperCase()}`}
                          </span>
                          <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                            <Clock size={10} /> {new Date(h.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${h.status === 'LIVE_AGENT' ? 'bg-green-100 text-green-700' :
                            h.status === 'FIXED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                            }`}>{h.status}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {view === 'history-detail' && (
                <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-gray-50/50">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
                    {isLoadingHistory ? (
                      <div className="flex-1 flex flex-col items-center justify-center transition-all">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="mt-2 text-xs font-bold text-gray-400">Loading messages...</p>
                      </div>
                    ) : (
                      historyMessages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'} gap-1`}>
                          <div className={`group relative max-w-[85%] p-3 rounded-2xl text-sm shadow-sm transition-all ${msg.sender === 'USER' ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                            }`}>
                            <div className="flex justify-between items-center gap-3 mb-1">
                              <span className={`text-[9px] font-bold uppercase tracking-wider opacity-60 ${msg.sender === 'USER' ? 'text-white' : 'text-gray-400'}`}>
                                {msg.sender === 'AI' ? 'AI Assistant' : msg.sender === 'AGENT' ? 'Support Agent' : 'You'}
                              </span>
                              <button
                                onClick={() => copyToClipboard(msg.content, idx)}
                                className={`p-1 rounded hover:bg-black/5 transition-colors ${msg.sender === 'USER' ? 'text-white/60' : 'text-gray-300'}`}
                              >
                                {copiedId === idx ? <Check size={10} /> : <Copy size={10} />}
                              </button>
                            </div>
                            <p className="leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 bg-white border-t border-gray-100 text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                      <Clock size={10} /> Read-only ticket history
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer - Only in Chat View */}
            {view === 'chat' && (
              <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                {isAI && !isWaiting && !timedOut && (
                  <button
                    onClick={requestAgent}
                    className="w-full mb-3 text-[11px] text-primary font-medium hover:underline flex items-center justify-center gap-1 transition-opacity"
                  >
                    <Headset size={12} /> Connect to Live Agent
                  </button>
                )}

                {isWaiting && (
                  <button
                    onClick={cancelAgentRequest}
                    className="w-full mb-3 text-[11px] text-gray-400 hover:text-gray-600 font-medium flex items-center justify-center gap-1"
                  >
                    <X size={11} /> Cancel request
                  </button>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={
                      isWaiting
                        ? 'Waiting for agent…'
                        : isLive
                          ? 'Message agent…'
                          : 'Type your message…'
                    }
                    disabled={inputDisabled}
                    className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || inputDisabled}
                    className="bg-primary text-white p-2 rounded-xl hover:bg-brand-blue disabled:opacity-50 transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* Toggle button — Refined for Desktop and Mobile */
          <motion.button
            key="chat-toggle"
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            onClick={() => setIsOpen(true)}
            className={`flex items-center bg-primary text-white rounded-full shadow-lg hover:shadow-xl transition-all group ${isMobile ? 'p-2' : 'p-1 pr-4 gap-2'}`}
            aria-label="Open Support Chat"
          >
            <div className={`bg-white/10 rounded-full group-hover:bg-white/20 transition-colors ${isMobile ? 'p-1.5' : 'p-2'}`}>
              <MessageCircle size={isMobile ? 18 : 20} />
            </div>
            {!isMobile && <span className="font-bold text-xs whitespace-nowrap">Support</span>}
          </motion.button>
        )}
      </AnimatePresence>
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
        shouldRedirect={false}
      />
    </div>
  );
}

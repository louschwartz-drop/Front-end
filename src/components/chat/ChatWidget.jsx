'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket, useSocketRequest } from '@/context/SocketContext';
import {
  getOrCreateAIChat,
  migrateAIChat,
  createSupportTicket,
  getSupportTicketsList,
  getSupportTicketMessages,
  reopenSupportTicket,
  streamAIChatResponse
} from '@/lib/api/user/chat.api';
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
  Loader2,
  Sparkles,
  Plus,
  History,
  LifeBuoy,
  ChevronRight,
  User
} from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { toast } from 'react-toastify';
import LoginModal from '../landingPage/LoginModal';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';

// ── FAQ suggestions shown in AI Chat ──────────────────────────────────────────
const FAQ_SUGGESTIONS = [
  'What is Droppr.ai and how does it work?',
  'How do I create a campaign?',
  'What are the pricing plans?',
];

// ── Typing Indicator for Agent ────────────────────────────────────────────────
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

// ── Helpers ──────────────────────────────────────────────────────────────────
function stripMarkdownForCopy(content) {
  if (!content) return '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return content
    .replace(/\*\*(\[[^\]]+\]\([^)]+\))\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
      const fullUrl = url.startsWith('/') ? `${origin}${url}` : url;
      return `${text}: ${fullUrl}`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^\s*-\s/gm, '• ');
}

const formatContent = (content, isUser, onLinkClick) => {
  if (!content) return null;
  content = content.replace(/\*\*(\[[^\]]+\]\([^)]+\))\*\*/g, '$1');
  const urlRegex = /(\[[^\]]+\]\((?:https?:\/\/|\/)[^\s)]+\)|https?:\/\/[^\s]+?[^.,;?!()\]}\s](?=[.,;?!()\]}\s]|$))/g;
  const parts = content.split(urlRegex);

  return parts.map((part, i) => {
    if (!part) return null;
    const mdMatch = part.match(/^\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)$/);
    if (mdMatch) {
      const linkText = mdMatch[1];
      const href = mdMatch[2];
      const isInternal = href.startsWith('/');

      if (isInternal && onLinkClick) {
        return (
          <button
            key={i}
            onClick={() => onLinkClick(href)}
            className={`underline font-semibold cursor-pointer ${isUser ? 'text-blue-100' : 'text-primary'}`}
          >
            {linkText}
          </button>
        );
      }
      return (
        <a
          key={i}
          href={href}
          target={isInternal ? '_self' : '_blank'}
          rel="noopener noreferrer"
          className={`underline font-semibold cursor-pointer ${isUser ? 'text-blue-100' : 'text-primary'}`}
        >
          {linkText}
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
          className={`underline break-all ${isUser ? 'text-blue-100 font-medium' : 'text-primary'}`}
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
        if (bp === '**') return null;
        return bp;
      });
    }

    return part;
  });
};

const renderMessageContent = (content, isUser, onLinkClick) => {
  if (!content) return null;
  const lines = content.split('\n');
  return lines.map((line, i) => {
    const isBullet = line.trim().startsWith('- ');
    return (
      <div key={i} className={`${isBullet ? 'flex gap-2 ml-1 my-1' : 'mb-1 last:mb-0'}`}>
        {isBullet && <span className="shrink-0">•</span>}
        <span>{formatContent(isBullet ? line.trim().slice(2) : line, isUser, onLinkClick)}</span>
      </div>
    );
  });
};

function MessageBubble({ msg, onLinkClick }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.sender === 'USER';

  const handleCopy = () => {
    navigator.clipboard.writeText(stripMarkdownForCopy(msg.content));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1`}>
      <div className={`flex items-start gap-2 max-w-[85%] group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div
          className={`p-3 rounded-2xl text-sm leading-relaxed relative ${isUser
            ? 'bg-primary text-white rounded-tr-none'
            : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'
            }`}
        >
          {renderMessageContent(msg.content, isUser, onLinkClick)}
        </div>
        <button
          onClick={handleCopy}
          className="mt-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          title="Copy message"
        >
          {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
        </button>
      </div>
      <span className="text-[9px] text-gray-500 px-1 font-semibold opacity-90">
        {new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}

export default function ChatWidget() {
  const socket = useSocket();
  const requestSocket = useSocketRequest();
  const router = useRouter();
  const dragControls = useDragControls();

  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chat_widget_open') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chat_widget_open', isOpen ? 'true' : 'false');
    }
  }, [isOpen]);

  const [isDraggingIcon, setIsDraggingIcon] = useState(false);
  const processedMessageIds = useRef(new Set());
  const [isMobile, setIsMobile] = useState(false);

  // Navigation: 'home' | 'ai-chat' | 'create-ticket' | 'ticket-list' | 'ticket-room'
  const [view, setView] = useState('home');

  // AI Chat States
  const [aiChat, setAIChat] = useState(null);
  const [aiMessages, setAIMessages] = useState([]);
  const [aiInput, setAIInput] = useState('');
  const [aiStreaming, setAIStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');

  // Ticket States
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [ticketInput, setTicketInput] = useState('');
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Create Ticket Form States
  const [ticketCategory, setTicketCategory] = useState('General Question');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Modals & Redirects
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(null);

  const scrollRef = useRef(null);
  const containerRef = useRef(null);

  const { user: currentUser, isAuthenticated } = userAuthStore();

  // ── Responsive Detection ──
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ── Redirect after login ──
  useEffect(() => {
    if (isAuthenticated && pendingRedirect) {
      const href = pendingRedirect;
      setPendingRedirect(null);
      setIsLoginModalOpen(false);
      router.push(href);
    }
  }, [isAuthenticated, pendingRedirect, router]);

  // Helper to load logged-in user AI chat history
  const loadUserAIChat = useCallback(async () => {
    const userId = currentUser?._id || currentUser?.id;
    if (!userId) return;
    try {
      const res = await getOrCreateAIChat(userId);
      if (res.success && res.data) {
        setAIChat(res.data);
        localStorage.setItem('ai_chat_session', JSON.stringify(res.data));
        if (res.messages) {
          setAIMessages(res.messages);
          localStorage.setItem('ai_chat_messages', JSON.stringify(res.messages));
        }
      }
    } catch (err) {
      console.error('Failed to load user AI chat history:', err);
    }
  }, [currentUser]);

  // ── Handle Auth Status Transitions (Logout / Login) ──
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear AI chat session and guest cache on logout
      localStorage.removeItem('ai_chat_session');
      localStorage.removeItem('ai_chat_messages');
      localStorage.removeItem('chat_guest_id');

      setAIChat(null);
      setAIMessages([]);
      setTickets([]);
      setActiveTicket(null);
      setTicketMessages([]);
      setView('home');
    } else {
      // Load user ticket list
      loadTicketsList();
      // Load user AI chat session
      loadUserAIChat();
    }
  }, [isAuthenticated, loadUserAIChat]);

  // ── Load Cached AI Chat on Mount ──
  useEffect(() => {
    const cachedSession = localStorage.getItem('ai_chat_session');
    const cachedMessages = localStorage.getItem('ai_chat_messages');
    if (cachedSession) {
      try {
        setAIChat(JSON.parse(cachedSession));
      } catch (e) { }
    }
    if (cachedMessages) {
      try {
        setAIMessages(JSON.parse(cachedMessages));
      } catch (e) { }
    }
  }, []);

  // ── Sync AI Chat session with Database on entering AI chat view ──
  useEffect(() => {
    const syncSession = async () => {
      if (view !== 'ai-chat') return;
      const guestId = localStorage.getItem('chat_guest_id');
      const userId = currentUser?._id || currentUser?.id;

      try {
        const res = await getOrCreateAIChat(userId, guestId);
        if (res.success && res.data) {
          setAIChat(res.data);
          localStorage.setItem('ai_chat_session', JSON.stringify(res.data));
          if (res.messages) {
            setAIMessages(res.messages);
            localStorage.setItem('ai_chat_messages', JSON.stringify(res.messages));
          }
        }
      } catch (err) {
        console.error('Failed to sync AI chat session:', err);
      }
    };
    syncSession();
  }, [view, currentUser, isAuthenticated]);

  // ── Socket Connection & Background Sync ──
  useEffect(() => {
    if (isOpen) {
      requestSocket();
    }
  }, [isOpen, requestSocket]);

  // ── Handle incoming real-time messages & agent assignments ──
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (processedMessageIds.current.has(msg._id)) return;
      processedMessageIds.current.add(msg._id);

      // If user is in this ticket room, append message in real-time
      if (view === 'ticket-room' && activeTicket && msg.ticketId === activeTicket._id) {
        setTicketMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        // Keep scrolled to bottom
        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }, 50);
      } else {
        // Increment unread count for ticket in background (only if sent by AGENT)
        if (msg.sender === 'AGENT') {
          setTickets((prev) =>
            prev.map((t) => (t._id === msg.ticketId ? { ...t, unreadCount: (t.unreadCount || 0) + 1 } : t))
          );
        }
      }
    };

    const handleAgentAssigned = (data) => {
      if (activeTicket) {
        setActiveTicket((prev) => (prev ? { ...prev, agentId: data.agentId } : prev));
        // Push a system announcement to room messages
        setTicketMessages((prev) => [
          ...prev,
          {
            _id: `sys-${Date.now()}`,
            content: `Agent ${data.agentName} has joined the conversation.`,
            sender: 'AGENT',
            isSystem: true,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    };

    const handleTicketClosed = (data) => {
      if (activeTicket && activeTicket._id === data.ticketId) {
        setActiveTicket((prev) => {
          if (prev?.status === 'closed') return prev;

          setTicketMessages((prevMsgs) => {
            if (prevMsgs.some(m => m._id === `sys-closed-${data.ticketId}`)) return prevMsgs;
            return [
              ...prevMsgs,
              {
                _id: `sys-closed-${data.ticketId}`,
                content: `This ticket has been marked as resolved and closed. Thank you for contacting our support team!`,
                sender: 'AGENT',
                isSystem: true,
                createdAt: new Date().toISOString(),
              },
            ];
          });
          return { ...prev, status: 'closed' };
        });
      }
      loadTicketsList();
    };

    socket.on('new_message', handleNewMessage);
    socket.on('agent_assigned', handleAgentAssigned);
    socket.on('ticket_closed', handleTicketClosed);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('agent_assigned', handleAgentAssigned);
      socket.off('ticket_closed', handleTicketClosed);
    };
  }, [socket, view, activeTicket]);

  // ── Click outside to close minimized ──
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && containerRef.current.contains(event.target)) return;
      // Ignore clicks inside any Radix UI portal (Select dropdown, Popper, etc.)
      if (event.target.closest && (
        event.target.closest('[data-radix-popper-content-wrapper]') ||
        event.target.closest('[data-radix-select-content]') ||
        event.target.closest('[role="listbox"]') ||
        event.target.closest('[role="option"]') ||
        event.target.closest('[data-state="open"]')
      )) return;
      if (isLoginModalOpen) return;
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isLoginModalOpen]);

  // ── Scroll to bottom on updates ──
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [view, aiMessages, ticketMessages, streamingMessage]);

  // ── Fetch Tickets ──
  const loadTicketsList = async () => {
    if (!isAuthenticated) return;
    setLoadingTickets(true);
    try {
      const res = await getSupportTicketsList();
      if (res.success) {
        setTickets(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load tickets list:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  // ── Enter Ticket Message Room ──
  const enterTicketRoom = async (ticket) => {
    setActiveTicket(ticket);
    setView('ticket-room');
    setLoadingMessages(true);
    setTicketMessages([]);
    try {
      const res = await getSupportTicketMessages(ticket._id);
      if (res.success) {
        setTicketMessages(res.data || []);
        // Reset unread count locally for this ticket
        setTickets((prev) => prev.map((t) => (t._id === ticket._id ? { ...t, unreadCount: 0 } : t)));
      }
      // Join ticket room on socket
      if (socket) {
        socket.emit('join_chat', { ticketId: ticket._id, userId: currentUser?._id || currentUser?.id });
      }
    } catch (err) {
      toast.error('Failed to load ticket messages.');
    } finally {
      setLoadingMessages(false);
    }
  };

  // ── Leave Ticket Room ──
  const leaveTicketRoom = () => {
    if (socket && activeTicket) {
      socket.emit('leave_chat', { ticketId: activeTicket._id });
    }
    setActiveTicket(null);
    setTicketMessages([]);
    setView('ticket-list');
    loadTicketsList();
  };

  // ── Reopen Support Ticket ──
  const handleReopenTicket = async () => {
    if (!activeTicket) return;
    try {
      const res = await reopenSupportTicket(activeTicket._id);
      if (res.success) {
        toast.success('Ticket reopened successfully.');
        setActiveTicket(res.data);
        // Sync socket room
        if (socket) {
          socket.emit('join_chat', { ticketId: activeTicket._id, userId: currentUser?._id || currentUser?.id });
        }
      }
    } catch (err) {
      toast.error('Failed to reopen ticket.');
    }
  };

  // ── Send Ticket Message (Human-to-Human) ──
  const handleSendTicketMessage = () => {
    if (!ticketInput.trim() || !activeTicket || !socket) return;

    // Local validations
    const hasHtml = /<\/?[a-z][\s\S]*>/i.test(ticketInput);
    if (hasHtml) {
      toast.error('HTML tags are not allowed in messages.');
      return;
    }
    if (ticketInput.length > 1000) {
      toast.error('Message is too long (max 1000 characters).');
      return;
    }

    // Emit socket event
    socket.emit('send_message', {
      ticketId: activeTicket._id,
      userId: currentUser?._id || currentUser?.id,
      content: ticketInput.trim(),
    });

    setTicketInput('');
  };

  // ── Submit Ticket Creation Form ──
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    if (!ticketSubject.trim() || !ticketDescription.trim()) {
      toast.error('Subject and Description are required.');
      return;
    }

    // Client-side validations
    const hasHtml = /<\/?[a-z][\s\S]*>/i.test(ticketDescription);
    if (hasHtml) {
      toast.error('HTML is not allowed in descriptions.');
      return;
    }
    if (ticketSubject.length > 100) {
      toast.error('Subject must be less than 100 characters.');
      return;
    }
    if (ticketDescription.length > 1000) {
      toast.error('Description must be less than 1000 characters.');
      return;
    }

    setSubmittingTicket(true);
    try {
      const res = await createSupportTicket(
        ticketSubject.trim(),
        ticketCategory,
        ticketDescription.trim()
      );
      if (res.success && res.data) {
        toast.success('Support ticket created successfully!');
        // Clear form
        setTicketSubject('');
        setTicketDescription('');
        // Instantly join the room for this ticket
        enterTicketRoom(res.data);
      }
    } catch (err) {
      toast.error('Failed to create ticket. Please try again.');
    } finally {
      setSubmittingTicket(false);
    }
  };

  // ── Handle AI Assistant Streaming (SSE) ──
  const handleSendAIMessage = async (textToSend) => {
    const text = textToSend || aiInput;
    if (!text.trim() || aiStreaming) return;

    // Validation
    const hasHtml = /<\/?[a-z][\s\S]*>/i.test(text);
    if (hasHtml) {
      toast.error('HTML tags are not allowed in messages.');
      return;
    }
    if (text.length > 1000) {
      toast.error('Message is too long (max 1000 characters).');
      return;
    }

    const userMsg = {
      _id: `temp-${Date.now()}`,
      content: text,
      sender: 'USER',
      createdAt: new Date().toISOString(),
    };

    const newMessages = [...aiMessages, userMsg];
    setAIMessages(newMessages);
    localStorage.setItem('ai_chat_messages', JSON.stringify(newMessages));

    setAIInput('');
    setAIStreaming(true);
    setStreamingMessage('');

    let guestId = localStorage.getItem('chat_guest_id');
    if (!currentUser && !guestId) {
      guestId = Math.random().toString(36).substring(7);
      localStorage.setItem('chat_guest_id', guestId);
    }

    try {
      const response = await streamAIChatResponse(
        aiChat?._id || 'new',
        text,
        currentUser?._id || currentUser?.id || undefined,
        currentUser ? undefined : guestId
      );

      if (!response.ok) throw new Error('Stream failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalAIContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6).trim();
          if (!dataStr || dataStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.type === 'chat_info') {
              setAIChat(parsed.chat);
              localStorage.setItem('ai_chat_session', JSON.stringify(parsed.chat));
            } else if (parsed.type === 'chunk') {
              finalAIContent += parsed.content;
              setStreamingMessage(finalAIContent);
            } else if (parsed.type === 'error') {
              toast.error(parsed.message);
            }
          } catch (err) {
            // partial chunk — ignore
          }
        }
      }

      // Stream complete — commit final AI message
      const finalAIMsg = {
        _id: `ai-${Date.now()}`,
        content: finalAIContent,
        sender: 'AI',
        createdAt: new Date().toISOString(),
      };
      const finalMessages = [...newMessages, finalAIMsg];
      setAIMessages(finalMessages);
      localStorage.setItem('ai_chat_messages', JSON.stringify(finalMessages));
      setStreamingMessage('');
    } catch (err) {
      toast.error('AI streaming error. Please try again.');
    } finally {
      setAIStreaming(false);
    }
  };


  // Suggest link handler (redirects or opens login modal)
  const handleChatLinkClick = useCallback(
    (href) => {
      const isProtected = href.startsWith('/user/') || href.startsWith('/admin/');
      if (isProtected && !isAuthenticated) {
        setPendingRedirect(href);
        setIsLoginModalOpen(true);
      } else {
        router.push(href);
      }
    },
    [isAuthenticated, router]
  );

  // Escalate to support ticket from AI chat
  const handleEscalateToTicket = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    const openTicket = tickets.find((t) => t.status === 'open');
    if (openTicket) {
      enterTicketRoom(openTicket);
      toast.info("You already have an active support ticket. We've opened it for you.");
      return;
    }
    // Prefill description with last message
    const lastUserMessage = [...aiMessages].reverse().find((m) => m.sender === 'USER');
    if (lastUserMessage) {
      setTicketDescription(lastUserMessage.content);
    }
    setView('create-ticket');
  };

  const totalUnreadCount = tickets.reduce((acc, t) => acc + (t.unreadCount || 0), 0);
  const hasOpenTicket = tickets.some((t) => t.status === 'open');

  return (
    <div
      className={`fixed z-[1000] flex flex-col items-end transition-all duration-300 ${isOpen && isMobile
          ? 'bottom-0 left-0 right-0'
          : isMobile
            ? 'bottom-3 right-3'
            : 'bottom-4 right-4'
        }`}
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            ref={containerRef}
            key="chat-window"
            initial={isMobile ? { opacity: 0, y: 100 } : { opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { opacity: 0, y: 100 } : { opacity: 0, scale: 0.8, y: 20 }}
            className={`bg-white flex flex-col overflow-hidden shadow-2xl border border-gray-100 ${isMobile ? 'w-full h-full rounded-none border-t' : 'mb-4 w-80 sm:w-96 rounded-2xl'
              }`}
            style={{ height: isMobile ? 'calc(100vh - 64px)' : '560px' }}
          >
            {/* Header */}
            <div className="p-4 bg-primary text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {view !== 'home' && (
                  <button
                    onClick={() => {
                      if (view === 'ticket-room') {
                        leaveTicketRoom();
                      } else {
                        setView('home');
                      }
                    }}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors mr-1"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <div>
                  <h3 className="font-extrabold text-sm flex items-center gap-1.5 leading-none">
                    <LifeBuoy size={16} /> Droppr.ai Support
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAuthenticated && tickets.length > 0 && view !== 'ticket-list' && (
                  <button
                    onClick={() => {
                      if (view === 'ticket-room') {
                        leaveTicketRoom();
                      }
                      loadTicketsList();
                      setView('ticket-list');
                    }}
                    className="hover:underline text-[11px] font-extrabold text-white px-1.5 py-1 relative whitespace-nowrap shrink-0"
                    title="Tickets History"
                  >
                    Ticket History
                    {totalUnreadCount > 0 && (
                      <span className="absolute top-0.5 -right-0.5 bg-red-500 w-1.5 h-1.5 rounded-full ring-1 ring-primary animate-pulse" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/10 p-1.5 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* View Container */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-gray-50/50">
              {/* VIEW: HOME */}
              {view === 'home' && (
                <div className="p-6 space-y-6 overflow-y-auto flex-1 flex flex-col justify-center">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <LifeBuoy size={32} className="animate-spin-slow" />
                    </div>
                    <h2 className="text-xl font-extrabold text-gray-800">How can we help?</h2>
                    <p className="text-xs text-gray-400">
                      Welcome to Droppr Support. Choose a method below.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* AI Chat Button */}
                    <button
                      onClick={() => setView('ai-chat')}
                      className="w-full p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between text-left hover:border-primary hover:shadow-md transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                          <Bot size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">Chat with AI Assistant</p>
                          <p className="text-[10px] text-gray-400">Instant answers to FAQ & pricing</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                    </button>

                    {/* Create Ticket Button */}
                    {!hasOpenTicket ? (
                      <button
                        onClick={() => {
                          if (!isAuthenticated) {
                            setIsLoginModalOpen(true);
                          } else {
                            setView('create-ticket');
                          }
                        }}
                        className="w-full p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between text-left hover:border-primary hover:shadow-md transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <Plus size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800">Create Support Ticket</p>
                            <p className="text-[10px] text-gray-400">Escalate to human support agents</p>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const openTicket = tickets.find((t) => t.status === 'open');
                          if (openTicket) {
                            enterTicketRoom(openTicket);
                          }
                        }}
                        className="w-full p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between text-left hover:border-primary hover:shadow-md transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-50 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                            <LifeBuoy size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800">View Active Ticket</p>
                            <p className="text-[10px] text-gray-400">You have an ongoing support conversation</p>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                      </button>
                    )}

                    {/* View Ticket History */}
                    {isAuthenticated && (
                      <button
                        onClick={() => {
                          loadTicketsList();
                          setView('ticket-list');
                        }}
                        className="w-full p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between text-left hover:border-primary hover:shadow-md transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <History size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800">My Support Tickets</p>
                            <p className="text-[10px] text-gray-400">View and track past replies</p>
                          </div>
                        </div>
                        {totalUnreadCount > 0 ? (
                          <span className="bg-red-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                            {totalUnreadCount}
                          </span>
                        ) : (
                          <ChevronRight size={16} className="text-gray-400" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* VIEW: AI CHAT */}
              {view === 'ai-chat' && (
                <div className="flex-1 flex flex-col min-h-0 bg-white">
                  <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50"
                  >
                    {aiMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                        <div className="bg-blue-50 text-primary p-3 rounded-full">
                          <Sparkles size={24} className="animate-pulse" />
                        </div>
                        <p className="text-xs text-gray-500 font-bold">Ask Droppr AI any question!</p>
                        <div className="flex flex-col gap-2 w-full max-w-xs mx-auto">
                          {FAQ_SUGGESTIONS.map((q) => (
                            <button
                              key={q}
                              onClick={() => handleSendAIMessage(q)}
                              className="text-left px-4 py-2.5 bg-white border border-gray-200 hover:border-primary hover:bg-blue-50/20 text-xs text-gray-700 font-semibold rounded-xl transition-all"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {aiMessages.map((msg, idx) => (
                      <MessageBubble key={msg._id || idx} msg={msg} onLinkClick={handleChatLinkClick} />
                    ))}

                    {streamingMessage && (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] p-3 rounded-2xl bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none text-sm leading-relaxed">
                          {renderMessageContent(streamingMessage, false, handleChatLinkClick)}
                        </div>
                      </div>
                    )}

                    {aiStreaming && !streamingMessage && <TypingIndicator />}
                  </div>

                  {/* AI input footer */}
                  <div className="p-4 bg-white border-t border-gray-100 flex flex-col gap-3 shrink-0">
                    <button
                      onClick={handleEscalateToTicket}
                      className="text-[11px] text-primary font-bold hover:underline flex items-center justify-center gap-1"
                    >
                      <Headset size={12} /> Connect to Human Agent
                    </button>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aiInput}
                        onChange={(e) => setAIInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendAIMessage()}
                        placeholder="Ask AI Assistant..."
                        disabled={aiStreaming}
                        className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-60 transition-opacity"
                      />
                      <button
                        onClick={() => handleSendAIMessage()}
                        disabled={!aiInput.trim() || aiStreaming}
                        className="bg-primary text-white p-2.5 rounded-xl hover:bg-brand-blue disabled:opacity-50 transition-colors"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW: CREATE TICKET FORM */}
              {view === 'create-ticket' && (
                <form
                  onSubmit={handleSubmitTicket}
                  className="flex-1 flex flex-col min-h-0 bg-white p-6 space-y-4 overflow-y-auto"
                >
                  <h3 className="font-extrabold text-base text-gray-800">Submit Support Ticket</h3>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Category</label>
                    <Select
                      value={ticketCategory}
                      onValueChange={(val) => setTicketCategory(val)}
                    >
                      <SelectTrigger className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 h-[38px] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-100 rounded-xl shadow-lg z-[1200]">
                        {['General Question', 'Payment/Billing', 'Campaign Issue', 'Technical Bug', 'Other Issue'].map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-xs font-semibold text-gray-700">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Subject</label>
                    <input
                      type="text"
                      maxLength={100}
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Brief summary of your issue"
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="text-right text-[10px] text-gray-400 px-1">
                      {ticketSubject.length}/100 characters
                    </div>
                  </div>

                  <div className="space-y-1 flex-1 flex flex-col">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Description</label>
                    <textarea
                      maxLength={1000}
                      value={ticketDescription}
                      onChange={(e) => setTicketDescription(e.target.value)}
                      placeholder="Please provide full details..."
                      required
                      rows={5}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none flex-1"
                    />
                    <div className="text-right text-[10px] text-gray-400 px-1 mt-0.5">
                      {ticketDescription.length}/1000 characters
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingTicket}
                    className="w-full bg-primary hover:bg-brand-blue text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors disabled:opacity-60"
                  >
                    {submittingTicket ? <Loader2 size={16} className="animate-spin" /> : 'Submit Support Request'}
                  </button>
                </form>
              )}

              {/* VIEW: TICKETS LIST */}
              {view === 'ticket-list' && (
                <div className="flex-1 bg-white flex flex-col min-h-0">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Support Tickets History</span>
                    {!hasOpenTicket && (
                      <button
                        onClick={() => setView('create-ticket')}
                        className="text-[10px] text-primary font-extrabold flex items-center gap-1 hover:underline"
                      >
                        <Plus size={12} /> New Ticket
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                    {loadingTickets ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="mt-2 text-xs font-bold text-gray-400">Loading tickets...</p>
                      </div>
                    ) : tickets.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <p className="text-xs text-gray-400 font-medium">No support tickets found.</p>
                      </div>
                    ) : (
                      tickets.map((t) => (
                        <button
                          key={t._id}
                          onClick={() => enterTicketRoom(t)}
                          className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-start justify-between gap-4 group"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-primary group-hover:underline">
                                {t.ticketId}
                              </span>
                              <span className="text-[10px] bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">
                                {t.category}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-gray-700 line-clamp-1">{t.subject}</p>
                            <p className="text-[9px] text-gray-400">
                              Updated {new Date(t.lastMessageAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span
                              className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${t.status === 'open' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500'
                                }`}
                            >
                              {t.status}
                            </span>
                            {t.unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                {t.unreadCount} new
                              </span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* VIEW: TICKET MESSAGE ROOM */}
              {view === 'ticket-room' && (
                <div className="flex-1 flex flex-col min-h-0 bg-white">
                  {/* Room status banner */}
                  <div className="p-3 bg-blue-50/50 border-b border-gray-100 flex items-center justify-between text-xs shrink-0 px-4">
                    <span className="font-bold text-gray-600">Ticket: {activeTicket?.ticketId}</span>
                    <span className="text-gray-400">•</span>
                    <span className="font-semibold text-gray-500">{activeTicket?.category}</span>
                  </div>

                  {/* Messages scrollarea */}
                  <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50"
                  >
                    {!loadingMessages && activeTicket && activeTicket.status === 'open' && (
                      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl p-4 border border-blue-100/50 shadow-sm space-y-3 mb-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-blue-100/50">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Active Support Ticket</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Ticket Number</p>
                            <p className="font-extrabold text-primary">{activeTicket.ticketId}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Issue Type</p>
                            <p className="font-bold text-gray-700">{activeTicket.category}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Subject</p>
                            <p className="font-bold text-gray-800 line-clamp-1">{activeTicket.subject}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">User</p>
                            <p className="font-bold text-gray-800">{currentUser?.name || 'User'}</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-blue-100/50 text-xs text-blue-700 font-semibold leading-relaxed">
                          Thanks, our support agent will connect with you as soon as possible.
                        </div>
                      </div>
                    )}

                    {loadingMessages ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      </div>
                    ) : (
                      ticketMessages.map((msg) => (
                        <MessageBubble key={msg._id} msg={msg} onLinkClick={handleChatLinkClick} />
                      ))
                    )}

                    {isAgentTyping && <TypingIndicator />}
                  </div>

                  {/* Message submission footer */}
                  <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                    {activeTicket?.status === 'closed' ? (
                      <div className="text-center py-2">
                        <p className="text-xs text-gray-400 font-semibold">
                          This support ticket has been closed and resolved.
                        </p>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={ticketInput}
                          onChange={(e) => setTicketInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendTicketMessage()}
                          placeholder="Type reply to agent..."
                          className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                        <button
                          onClick={handleSendTicketMessage}
                          disabled={!ticketInput.trim() || !socket?.connected}
                          className="bg-primary text-white p-2.5 rounded-xl hover:bg-brand-blue disabled:opacity-50 transition-colors"
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Minimized button showing unread count */
          <motion.button
            key="chat-toggle"
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            onClick={async () => {
              setIsOpen(true);
              if (isAuthenticated) {
                try {
                  const res = await getSupportTicketsList();
                  if (res.success && res.data) {
                    setTickets(res.data || []);
                    const unreadTicket = res.data.find((t) => t.unreadCount > 0 && t.status === 'open');
                    if (unreadTicket) {
                      enterTicketRoom(unreadTicket);
                    }
                  }
                } catch (err) {
                  console.error('Failed to load tickets list on open:', err);
                }
              }
            }}
            className={`flex items-center bg-primary text-white rounded-full shadow-lg hover:shadow-xl transition-all relative group ${isMobile ? 'p-2' : 'p-1 pr-4 gap-2'
              }`}
            aria-label="Open Support Widget"
          >
            <div
              className={`bg-white/10 rounded-full group-hover:bg-white/20 transition-colors ${isMobile ? 'p-1.5' : 'p-2'
                }`}
            >
              <MessageCircle size={isMobile ? 18 : 20} />
            </div>
            {!isMobile && <span className="font-extrabold text-xs whitespace-nowrap">Support</span>}

            {/* Glowing unread count badge */}
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow animate-pulse">
                {totalUnreadCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleTicketsList}
        shouldRedirect={false}
      />
    </div>
  );

  // Fallback function for LoginModal success action
  function handleTicketsList() {
    loadTicketsList();
  }
}

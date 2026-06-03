"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import api from "@/lib/api/axios";
import ReactMarkdown from "react-markdown";
import Tooltip from "@/components/ui/Tooltip";
import {
  Send,
  Plus,
  Trash2,
  MessageSquare,
  Copy,
  Check,
  Search,
  X,
  History,
  Edit2,
  FolderPlus,
  Folder,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Mic,
  Square
} from "lucide-react";


// --- Components ---

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
};

const ScrollingWaveform = ({ stream }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const historyRef = useRef(new Array(180).fill(2)); // Increased history for slower scroll
  const frameCountRef = useRef(0);

  useEffect(() => {
    if (!stream) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const width = canvas.width;
      const height = canvas.height;

      analyser.getByteFrequencyData(dataArray);

      // Slow down the scroll by only updating every 2 frames
      frameCountRef.current++;
      if (frameCountRef.current % 2 === 0) {
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const average = sum / bufferLength;
        const threshold = 15;
        const cleanValue = Math.max(0, average - threshold);

        historyRef.current.shift();
        historyRef.current.push(Math.max(2, cleanValue * 1.8));
      }

      ctx.clearRect(0, 0, width, height);

      // Draw Center String Line
      ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Draw Waveform Bars
      const barWidth = width / historyRef.current.length;
      ctx.fillStyle = "#3b82f6";

      historyRef.current.forEach((val, i) => {
        const x = i * barWidth;
        const barHeight = val;
        ctx.fillRect(x, (height / 2) - (barHeight / 2), barWidth - 1, barHeight);
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      audioContext.close();
    };
  }, [stream]);

  return <canvas ref={canvasRef} width={800} height={40} className="w-full h-full" />;
};

// --- Main Page ---

export default function DropprGPTPage() {
  const [chats, setChats] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentChatId, setCurrentChatId] = useState("new");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  // Advanced Features State
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isFolderDeleteModalOpen, setIsFolderDeleteModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [isChatDeleteModalOpen, setIsChatDeleteModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimeoutRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const maxHeight = 160; // Max height to prevent taking too much vertical space
      const scrollHeight = textarea.scrollHeight;
      if (scrollHeight > maxHeight) {
        textarea.style.height = `${maxHeight}px`;
        textarea.style.overflowY = "auto";
      } else {
        textarea.style.height = `${Math.max(scrollHeight, 52)}px`;
        textarea.style.overflowY = "hidden";
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  useEffect(() => {
    fetchChats();
    fetchFolders();
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const fetchChats = async () => {
    try {
      const res = await api.get(`/user/droppr-gpt/chats`);
      if (res.data.success) {
        setChats(res.data.chats);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  const fetchFolders = async () => {
    try {
      const res = await api.get(`/user/droppr-gpt/folders`);
      if (res.data.success) {
        setFolders(res.data.folders);
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  };

  const fetchMessages = async (chatId) => {
    if (chatId === "new") {
      setMessages([]);
      return;
    }
    try {
      setIsLoading(true);
      const res = await api.get(`/user/droppr-gpt/chats/${chatId}/messages`);
      if (res.data.success) {
        setMessages(res.data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChat = (chatId) => {
    if (isStreaming) {
      toast.warn("Please wait for the current response to finish.");
      return;
    }
    setCurrentChatId(chatId);
    fetchMessages(chatId);
    setStreamingMessage("");
    setShowHistory(false);
  };

  const handleNewChat = () => {
    if (isStreaming) {
      toast.warn("Please wait for the current response to finish.");
      return;
    }
    const dailyChatCount = chats.filter(c => {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      return new Date(c.createdAt) >= startOfToday;
    }).length;

    if (dailyChatCount >= 10) {
      toast.error("You have reached the maximum daily limit of 10 chats. Please delete some chats first.");
      return;
    }

    setCurrentChatId("new");
    setMessages([]);
    setStreamingMessage("");
    setShowHistory(false);
  };

  const confirmDeleteChat = (e, chat) => {
    e.stopPropagation();
    if (isStreaming) {
      toast.warn("Cannot delete chat while a response is streaming.");
      return;
    }
    setChatToDelete(chat);
    setIsChatDeleteModalOpen(true);
  };

  const handleDeleteChat = async () => {
    if (!chatToDelete) return;
    setIsProcessing(true);
    try {
      const res = await api.delete(`/user/droppr-gpt/chats/${chatToDelete._id}`);
      if (res.data.success) {
        setChats(chats.filter(c => c._id !== chatToDelete._id));
        if (currentChatId === chatToDelete._id) {
          setCurrentChatId("new");
          setMessages([]);
        }
        setIsChatDeleteModalOpen(false);
        setChatToDelete(null);
        toast.success("Chat deleted");
      }
    } catch (error) {
      toast.error("Failed to delete chat");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAllChats = async () => {
    setIsProcessing(true);
    try {
      const res = await api.delete(`/user/droppr-gpt/chats`);
      if (res.data.success) {
        setChats([]);
        handleNewChat();
        toast.success("All chats deleted");
        setIsModalOpen(false);
      }
    } catch (error) {
      toast.error("Failed to delete all chats");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateTitle = async (chatId) => {
    if (!editTitle.trim()) return setEditingChatId(null);
    try {
      const res = await api.patch(`/user/droppr-gpt/chats/${chatId}`, { title: editTitle });
      if (res.data.success) {
        setChats(chats.map(c => c._id === chatId ? { ...c, title: editTitle } : c));
        setEditingChatId(null);
        toast.success("Title updated");
      }
    } catch (error) {
      toast.error("Failed to update title");
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await api.post(`/user/droppr-gpt/folders`, { name: newFolderName });
      if (res.data.success) {
        setFolders([res.data.folder, ...folders]);
        setIsNewFolderModalOpen(false);
        setNewFolderName("");
        toast.success("Folder created");
      }
    } catch (error) {
      toast.error("Failed to create folder");
    }
  };

  const handleUpdateFolderName = async (folderId) => {
    if (!editFolderName.trim()) return setEditingFolderId(null);
    try {
      const res = await api.patch(`/user/droppr-gpt/folders/${folderId}`, { name: editFolderName });
      if (res.data.success) {
        setFolders(folders.map(f => f._id === folderId ? { ...f, name: editFolderName } : f));
        setEditingFolderId(null);
        toast.success("Folder renamed");
      }
    } catch (error) {
      toast.error("Failed to rename folder");
    }
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;
    setIsProcessing(true);
    try {
      const res = await api.delete(`/user/droppr-gpt/folders/${folderToDelete._id}`);
      if (res.data.success) {
        setFolders(folders.filter(f => f._id !== folderToDelete._id));
        setChats(chats.filter(c => c.folderId !== folderToDelete._id));
        setIsFolderDeleteModalOpen(false);
        setFolderToDelete(null);
        toast.success("Folder and its chats deleted");
      }
    } catch (error) {
      toast.error("Failed to delete folder");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMoveToFolder = async (chatId, folderId) => {
    try {
      const res = await api.patch(`/user/droppr-gpt/chats/${chatId}`, { folderId });
      if (res.data.success) {
        setChats(chats.map(c => c._id === chatId ? { ...c, folderId } : c));
        if (folderId) setExpandedFolders({ ...expandedFolders, [folderId]: true });
        toast.success("Chat moved");
      }
    } catch (error) {
      toast.error("Failed to move chat");
    }
  };

  const handleSendMessage = async (overrideInput) => {
    const textToSend = typeof overrideInput === "string" ? overrideInput : input;
    if (!textToSend.trim() || isStreaming || isTranscribing) return;

    // Frontend validation
    const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(textToSend);
    const codePatterns = [
      /function\s+\w*\s*\(/i,
      /class\s+\w+/i,
      /import\s+.*\s+from/i,
      /const\s+\w+\s*=/i,
      /let\s+\w+\s*=/i,
      /var\s+\w+\s*=/i,
      /def\s+\w+\s*\(/i,
      /struct\s+\w+/i,
      /include\s+<.*>/i,
      /package\s+\w+/i,
      /public\s+class\s+\w+/i,
      /on\w+\s*=/i,
      /javascript:/i
    ];
    const isCode = codePatterns.some(p => p.test(textToSend));
    const isTooLong = textToSend.length > 4000;

    const userMsg = { sender: "USER", content: textToSend, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "52px";
    }

    setIsStreaming(true);
    setStreamingMessage("");

    if (hasHtmlTags || isCode || isTooLong) {
      // Simulate AI response stream
      let refusalText = "";
      if (isTooLong) {
        refusalText = "I'm sorry, but I can only process messages up to 4000 characters. Please shorten your message.";
      } else if (hasHtmlTags) {
        refusalText = "I'm sorry, but I can only answer questions related to press releases, blogs, public relations strategies, and the Droppr.ai platform. HTML input is not permitted.";
      } else {
        refusalText = "I'm sorry, but I can only answer questions related to press releases, blogs, public relations strategies, and the Droppr.ai platform. Programming code input is not permitted.";
      }

      const words = refusalText.split(" ");
      let currentText = "";
      for (const word of words) {
        currentText += word + " ";
        setStreamingMessage(currentText);
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      setMessages(prev => [...prev, { sender: "AI", content: refusalText, createdAt: new Date().toISOString() }]);
      setStreamingMessage("");
      setIsStreaming(false);
      return;
    }

    // Read token the same way the axios interceptor does
    let token = null;
    if (typeof window !== "undefined") {
      try {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          const { state } = JSON.parse(authStorage);
          token = state?.token ?? null;
        }
      } catch (e) {
        console.error("Error reading auth token for stream:", e);
      }
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/user/droppr-gpt/chat/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ chatId: currentChatId, message: textToSend }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to send message");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullAIContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.slice(6).trim();
          if (!dataStr || dataStr === "[DONE]") continue;

          try {
            const data = JSON.parse(dataStr);
            if (data.type === "chunk") {
              fullAIContent += data.content;
              setStreamingMessage(fullAIContent);
            } else if (data.type === "chat_info") {
              setCurrentChatId(data.chat._id);
              setChats(prev => [data.chat, ...prev]);
            }
          } catch (_) {
            // partial chunk — ignore
          }
        }
      }

      setMessages(prev => [...prev, { sender: "AI", content: fullAIContent, createdAt: new Date().toISOString() }]);
      setStreamingMessage("");
    } catch (error) {
      console.error("Streaming error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsStreaming(false);
      fetchChats();
    }
  };


  // --- Voice Recording ---

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Microphone recording is not supported in this browser or requires HTTPS.");
        return;
      }
      const mimeType = ['audio/webm', 'audio/ogg', 'audio/mp4'].find(type => MediaRecorder.isTypeSupported(type));
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        if (chunks.length === 0) {
          toast.error("No audio data captured");
          return;
        }
        const blob = new Blob(chunks, { type: mimeType });
        await handleTranscription(blob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setAudioStream(stream);
      setIsRecording(true);
      setRecordingSeconds(0);

      // Start Timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      // Max 2 min recording
      recordingTimeoutRef.current = setTimeout(() => {
        if (recorder.state === "recording") {
          stopRecording();
          toast.info("Recording reached 2 minute limit");
        }
      }, 120000);

    } catch (error) {
      console.error("Recording error:", error);
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        toast.error("Microphone access is blocked. Please enable microphone permissions in your browser's site settings to use voice input.");
      } else {
        toast.error("Microphone access denied or not supported.");
      }
    }
  };

  const stopRecording = () => {
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      }
    }
  };

  const handleTranscription = async (blob) => {
    setIsTranscribing(true);
    const formData = new FormData();
    formData.append("audio", blob, "recording.wav");

    try {
      const res = await api.post("/user/droppr-gpt/voice-to-text", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data.success) {
        const text = res.data.text?.trim();
        if (!text || text.toLowerCase() === "you" || text.toLowerCase() === "thank you") {
          toast.warn("Speech not recognized clearly. Please try again.");
          return;
        }
        // Append to previous text
        setInput(prev => prev ? (prev.endsWith(" ") ? prev + text : prev + " " + text) : text);
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
      }
    } catch (error) {
      toast.error("Failed to transcribe voice");
    } finally {
      setIsTranscribing(false);
    }
  };

  const filteredFolders = folders.filter(folder => {
    const folderMatches = folder.name.toLowerCase().includes(searchQuery.toLowerCase());
    const hasMatchingChat = chats.some(c => c.folderId === folder._id && c.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return folderMatches || hasMatchingChat;
  });

  const getSearchChatsForFolder = (folder) => {
    const folderMatches = folder.name.toLowerCase().includes(searchQuery.toLowerCase());
    return chats.filter(c => c.folderId === folder._id && (folderMatches || c.title.toLowerCase().includes(searchQuery.toLowerCase())));
  };

  // --- Helpers ---

  const handleCopy = async (text, index) => {
    try {
      const element = document.getElementById(`msg-content-${index}`);
      if (element) {
        // We clone the element to remove the copy/share buttons or anything else if they ever get rendered inside it
        // but timestamps are outside.
        const htmlContent = element.innerHTML;
        const plainText = element.innerText;

        const blobHtml = new Blob([htmlContent], { type: "text/html" });
        const blobText = new Blob([plainText], { type: "text/plain" });

        const data = [new ClipboardItem({
          "text/html": blobHtml,
          "text/plain": blobText
        })];

        await navigator.clipboard.write(data);
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Rich copy failed, falling back to plain text:", err);
      navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const suggestionPrompts = [
    "Write a press release for my new AI product",
    "How can DropPR.ai help my brand authority?",
    "Generate 5 content ideas for a tech startup",
    "Analyze the current trends in digital PR"
  ];

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  // Drag and Drop
  const onDragStart = (e, chatId) => {
    e.dataTransfer.setData("chatId", chatId);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (e, folderId) => {
    const chatId = e.dataTransfer.getData("chatId");
    handleMoveToFolder(chatId, folderId);
  };

  const renderChatItem = (chat) => {
    const isEditing = editingChatId === chat._id;
    return (
      <div
        key={chat._id}
        draggable
        onDragStart={(e) => onDragStart(e, chat._id)}
        onClick={() => handleSelectChat(chat._id)}
        className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${currentChatId === chat._id
          ? "bg-blue-50/50 text-blue-700 border border-blue-50"
          : "hover:bg-gray-50 text-gray-600"
          }`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden flex-1">
          <MessageSquare size={16} className={`flex-shrink-0 ${currentChatId === chat._id ? "text-blue-600" : "text-gray-400"}`} />
          {isEditing ? (
            <input
              autoFocus
              className="bg-white border border-blue-300 rounded px-2 py-0.5 text-xs w-full focus:outline-none"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={() => handleUpdateTitle(chat._id)}
              onKeyDown={(e) => e.key === "Enter" && handleUpdateTitle(chat._id)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-[13px] font-medium truncate">{chat.title}</span>
          )}
        </div>
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={(e) => { e.stopPropagation(); setEditingChatId(chat._id); setEditTitle(chat.title); }}
            className="p-1.5 hover:text-blue-600 rounded-lg"
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={(e) => confirmDeleteChat(e, chat)}
            className="p-1.5 hover:text-red-500 rounded-lg"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100dvh-64px)] md:h-[calc(100dvh-80px)] bg-white overflow-hidden relative -mx-3 -mt-3 -mb-3 sm:-mx-6 sm:-mt-6 sm:-mb-6">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-white z-30">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-gray-900 text-lg">Drop PR GPT</h2>
          </div>
          <Tooltip text="View history" position="left">
            <button onClick={() => setShowHistory(true)} className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">
              <History size={20} />
            </button>
          </Tooltip>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-white scroll-smooth custom-scrollbar">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Loader2 size={36} className="animate-spin text-blue-600 mb-2" />
              <p className="text-sm font-medium">Loading chat history...</p>
            </div>
          ) : messages.length === 0 && !isStreaming ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto px-4">
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                How can I help you today?
              </h1>
              <p className="text-gray-500 mb-8 text-sm md:text-base">Your elite AI partner for journalistic excellence.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 w-full">
                {suggestionPrompts.map((prompt, i) => (
                  <button key={i} onClick={() => handleSendMessage(prompt)} className="p-3 md:p-4 text-left border border-gray-100 rounded-xl hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 group bg-gray-50/50">
                    <p className="text-[11px] md:text-sm font-medium text-gray-700 group-hover:text-blue-600">{prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === "USER" ? "justify-end" : "justify-start"}`}>
                  <div className={`relative group max-w-[92%] md:max-w-[85%]`}>
                    <div
                      id={`msg-content-${idx}`}
                      className={`p-4 rounded-2xl ${msg.sender === "USER" ? "bg-blue-600 text-white shadow-sm rounded-tr-none" : "bg-gray-100 text-gray-800 border border-gray-200 rounded-tl-none shadow-sm"}`}
                    >
                      {msg.sender === "USER" ? <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p> : <div className="prose prose-sm max-w-none prose-blue text-gray-800 leading-relaxed text-[13px]"><ReactMarkdown>{msg.content}</ReactMarkdown></div>}
                    </div>

                    <span className={`text-[10px] block mt-1 px-1 ${msg.sender === "USER" ? "text-gray-400 text-right" : "text-gray-400"}`}>
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <button onClick={() => handleCopy(msg.content, idx)} className={`absolute top-0 ${msg.sender === "USER" ? "-left-8" : "-right-8"} p-1.5 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all rounded-lg`}>
                      {copiedIndex === idx ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              ))}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="p-4 rounded-2xl bg-gray-100 text-gray-800 border border-gray-200 max-w-[92%] md:max-w-[85%] shadow-sm rounded-tl-none">
                    {streamingMessage ? <div className="prose prose-sm max-w-none prose-blue text-gray-800 leading-relaxed text-[13px]"><ReactMarkdown>{streamingMessage}</ReactMarkdown></div> : <div className="flex gap-1 py-1"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" /><div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" /><div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" /></div>}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 p-4 md:p-6 pb-2 md:pb-4 bg-white border-t border-gray-50">
          {(() => {
            const dailyChatCount = chats.filter(c => {
              const startOfToday = new Date();
              startOfToday.setHours(0, 0, 0, 0);
              return new Date(c.createdAt) >= startOfToday;
            }).length;

            const dailyMessageCount = messages.filter(m => {
              const startOfToday = new Date();
              startOfToday.setHours(0, 0, 0, 0);
              return m.sender === "USER" && (!m.createdAt || new Date(m.createdAt) >= startOfToday);
            }).length;

            const isDailyChatLimitReached = currentChatId === "new" && dailyChatCount >= 10;
            const isDailyMessageLimitReached = currentChatId !== "new" && dailyMessageCount >= 25;
            const isInputDisabled = isStreaming || isTranscribing || isDailyChatLimitReached || isDailyMessageLimitReached;

            const getPlaceholderText = () => {
              if (isTranscribing) return "Transcribing voice...";
              if (isStreaming) return "Wait for response...";
              if (isDailyChatLimitReached) return "Daily chat limit reached (Max 10). Delete a chat.";
              if (isDailyMessageLimitReached) return "Daily message limit reached (Max 25). Try tomorrow.";
              return "Message Drop PR GPT...";
            };

            // Touch comment to clear Next.js compile cache
            return (
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="max-w-4xl mx-auto w-full flex flex-col gap-1.5">
                <div className="relative w-full flex items-center">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isInputDisabled}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && !isInputDisabled && input.length <= 4000 && (e.preventDefault(), handleSendMessage())}
                    placeholder={getPlaceholderText()}
                    className={`w-full bg-gray-50 border border-blue-100 rounded-2xl py-3.5 pl-4 pr-24 focus:ring-1 focus:ring-blue-500 focus:border-blue-400 outline-none resize-none min-h-[52px] max-h-[160px] text-sm transition-all overflow-hidden gpt-input-scrollbar placeholder:text-[11px] md:placeholder:text-sm ${isRecording ? "opacity-0 invisible h-[52px]" : ""} ${isInputDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    rows="1"
                  />

                  {isRecording && (
                    <div className="absolute inset-0 bg-blue-50/50 rounded-2xl flex items-center pl-4 pr-16 gap-4 animate-in fade-in duration-300">
                      <span className="text-blue-600 font-mono font-bold text-xs min-w-[75px]">
                        {formatTime(recordingSeconds)} / 2:00
                      </span>
                      <div className="flex-1 h-10 overflow-hidden rounded-lg bg-white/50 border border-blue-100 relative pr-4">
                        <ScrollingWaveform stream={audioStream} />
                      </div>
                    </div>
                  )}

                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
                    {isTranscribing ? (
                      <div className="p-2 text-blue-600">
                        <Loader2 size={18} className="animate-spin" />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isStreaming || isDailyChatLimitReached || isDailyMessageLimitReached}
                        className={`p-2 rounded-xl transition-all ${isRecording ? "bg-red-500 text-white shadow-lg animate-pulse" : "text-gray-400 hover:bg-gray-100 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"}`}
                        title={isRecording ? "Stop Recording" : "Voice Message"}
                      >
                        {isRecording ? <Square size={16} fill="currentColor" /> : <Mic size={18} />}
                      </button>
                    )}
                    {!isRecording && (
                      <button
                        type="submit"
                        disabled={!input.trim() || isInputDisabled || input.length > 4000}
                        className={`p-2 rounded-xl transition-all ${input.trim() && !isInputDisabled && input.length <= 4000 ? "bg-blue-600 text-white shadow-md hover:scale-105" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                      >
                        <Send size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {input.length > 0 && !isRecording && (
                  <div className="flex justify-end px-2">
                    <span className={`text-[10px] font-mono ${input.length > 4000 ? "text-red-500 font-bold animate-pulse" : "text-gray-400"}`}>
                      {input.length}/4000
                    </span>
                  </div>
                )}
              </form>
            );
          })()}
          <p className="text-[8px] md:text-[10px] text-center text-gray-400 mt-2">Drop PR GPT can make mistakes. Check important info.</p>
        </div>

        {/* Mobile History Drawer */}
        {showHistory && (
          <div className="absolute inset-0 z-40 md:hidden bg-white animate-in slide-in-from-right duration-300">
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-50 bg-white">
                <h3 className="font-bold text-gray-900 text-sm">Recent Chats</h3>
                <Tooltip text="Close history" position="left">
                  <button onClick={() => setShowHistory(false)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
                    <X size={20} />
                  </button>
                </Tooltip>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="flex gap-2 mb-4">
                  <div className="w-full">
                    <Tooltip text="Start a new chat" position="bottom">
                      <button onClick={handleNewChat} className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all text-sm">
                        <Plus size={16} /> New Chat
                      </button>
                    </Tooltip>
                  </div>
                </div>
                <div className="space-y-1">
                  {searchQuery ? (
                    <div className="mb-2 space-y-2">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold px-2 mb-2">Search Results</p>
                      {chats.filter(c => !c.folderId && c.title.toLowerCase().includes(searchQuery.toLowerCase())).map(renderChatItem)}
                      {filteredFolders.map(folder => (
                        <div key={folder._id} className="mb-1">
                          <div className="flex items-center gap-2 text-gray-600 p-2 rounded-lg bg-gray-50/50">
                            <Folder size={14} className="text-blue-500 flex-shrink-0" />
                            <span className="text-[13px] font-semibold truncate">{folder.name}</span>
                          </div>
                          <div className="pl-4 mt-1 space-y-1">
                            {getSearchChatsForFolder(folder).map(renderChatItem)}
                          </div>
                        </div>
                      ))}
                      {chats.filter(c => !c.folderId && c.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && filteredFolders.length === 0 && (
                        <p className="text-center text-gray-400 py-4 text-xs">No chats found</p>
                      )}
                    </div>
                  ) : (
                    <>
                      {chats.filter(c => !c.folderId).map(renderChatItem)}
                      {folders.map(folder => (
                        <div key={folder._id} className="mb-1">
                          <div onClick={() => toggleFolder(folder._id)} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <div className="flex items-center gap-2 text-gray-600 flex-1 overflow-hidden">
                              {expandedFolders[folder._id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              <Folder size={14} className="text-blue-500 flex-shrink-0" />
                              <span className="text-[13px] font-semibold truncate">{folder.name}</span>
                            </div>
                          </div>
                          {expandedFolders[folder._id] && (
                            <div className="pl-4 mt-1 space-y-1">
                              {chats.filter(c => c.folderId === folder._id).map(renderChatItem)}
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className={`hidden md:block md:relative md:w-64 lg:w-72 xl:w-80 border-l border-gray-100 bg-white h-full overflow-hidden`}>
        <div className="flex flex-col h-full bg-white">
          <div className="p-4 border-b border-gray-50">
            <div className="flex gap-2">
              <div className="flex-1">
                <Tooltip text="Start a new chat" position="bottom">
                  <button onClick={handleNewChat} className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all text-sm">
                    <Plus size={16} /> New Chat
                  </button>
                </Tooltip>
              </div>
              <Tooltip text="Create new folder" position="bottom">
                <button onClick={() => setIsNewFolderModalOpen(true)} className="p-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-all">
                  <FolderPlus size={18} />
                </button>
              </Tooltip>
            </div>
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm outline-none" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-white custom-scrollbar">
            {searchQuery ? (
              <div className="mb-2 space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold px-2 mb-2">Search Results</p>
                {chats.filter(c => !c.folderId && c.title.toLowerCase().includes(searchQuery.toLowerCase())).map(renderChatItem)}
                {filteredFolders.map(folder => (
                  <div key={folder._id} className="mb-1">
                    <div className="flex items-center gap-2 text-gray-600 p-2 rounded-lg bg-gray-50/50">
                      <Folder size={14} className="text-blue-500 flex-shrink-0" />
                      <span className="text-[13px] font-semibold truncate">{folder.name}</span>
                    </div>
                    <div className="pl-4 mt-1 space-y-1">
                      {getSearchChatsForFolder(folder).map(renderChatItem)}
                    </div>
                  </div>
                ))}
                {chats.filter(c => !c.folderId && c.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && filteredFolders.length === 0 && (
                  <p className="text-center text-gray-400 py-4 text-xs">No results found for "{searchQuery}"</p>
                )}
              </div>
            ) : (
              <>
                <div onDragOver={onDragOver} onDrop={(e) => onDrop(e, null)} className="mb-2 p-2 rounded-lg border border-dashed border-transparent hover:border-gray-200 transition-all">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold px-2 mb-1">Recent</p>
                  {chats.filter(c => !c.folderId).map(renderChatItem)}
                </div>

                {folders.map(folder => {
                  const isEditing = editingFolderId === folder._id;
                  return (
                    <div key={folder._id} onDragOver={onDragOver} onDrop={(e) => onDrop(e, folder._id)} className="mb-1">
                      <div onClick={() => toggleFolder(folder._id)} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer group">
                        <div className="flex items-center gap-2 text-gray-600 flex-1 overflow-hidden">
                          {expandedFolders[folder._id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          <Folder size={14} className="text-blue-500 flex-shrink-0" />
                          {isEditing ? (
                            <input
                              autoFocus
                              className="bg-white border border-blue-300 rounded px-2 py-0.5 text-xs w-full focus:outline-none"
                              value={editFolderName}
                              onChange={(e) => setEditFolderName(e.target.value)}
                              onBlur={() => handleUpdateFolderName(folder._id)}
                              onKeyDown={(e) => e.key === "Enter" && handleUpdateFolderName(folder._id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className="text-[13px] font-semibold truncate">{folder.name}</span>
                          )}
                        </div>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isStreaming) {
                                toast.warn("Please wait for the current response to finish.");
                                return;
                              }
                              setEditingFolderId(folder._id);
                              setEditFolderName(folder.name);
                            }}
                            className="p-1 hover:text-blue-600"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isStreaming) {
                                toast.warn("Please wait for the current response to finish.");
                                return;
                              }
                              setFolderToDelete(folder);
                              setIsFolderDeleteModalOpen(true);
                            }}
                            className="p-1 hover:text-red-500"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      {expandedFolders[folder._id] && (
                        <div className="pl-4 mt-1 space-y-1">
                          {chats.filter(c => c.folderId === folder._id).map(renderChatItem)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <div className="p-3 border-t border-gray-50 bg-white">
            <button
              onClick={() => {
                if (isStreaming) {
                  toast.warn("Please wait for the current response to finish.");
                  return;
                }
                setIsModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 text-gray-400 hover:text-red-500 text-xs font-medium transition-all"
            >
              <Trash2 size={13} /> Clear all history
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Clear Chat History" footer={(
        <>
          <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600">Cancel</button>
          <button onClick={handleDeleteAllChats} disabled={isProcessing} className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 flex items-center gap-2">
            {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
            Clear Chats
          </button>
        </>
      )}>
        <div className="text-center">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto"><AlertTriangle size={24} /></div>
          <p className="text-gray-600 text-sm">Delete all conversations? Folders will be kept.</p>
        </div>
      </Modal>

      <Modal isOpen={isFolderDeleteModalOpen} onClose={() => setIsFolderDeleteModalOpen(false)} title="Delete Folder" footer={(
        <>
          <button onClick={() => setIsFolderDeleteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600">Cancel</button>
          <button onClick={handleDeleteFolder} disabled={isProcessing} className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 flex items-center gap-2">
            {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
            Delete All
          </button>
        </>
      )}>
        <div className="text-center">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto"><AlertTriangle size={24} /></div>
          <p className="text-gray-600 text-sm font-bold mb-2">Delete "{folderToDelete?.name}"?</p>
          <p className="text-gray-500 text-xs">All chats inside will be permanently removed.</p>
        </div>
      </Modal>

      <Modal isOpen={isChatDeleteModalOpen} onClose={() => setIsChatDeleteModalOpen(false)} title="Delete Chat" footer={(
        <>
          <button onClick={() => setIsChatDeleteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600">Cancel</button>
          <button onClick={handleDeleteChat} disabled={isProcessing} className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 flex items-center gap-2">
            {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
            Delete
          </button>
        </>
      )}>
        <div className="text-center">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto"><AlertTriangle size={24} /></div>
          <p className="text-gray-600 text-sm font-bold mb-2">Delete chat "{chatToDelete?.title}"?</p>
          <p className="text-gray-500 text-xs font-medium">This conversation will be permanently deleted.</p>
        </div>
      </Modal>

      <Modal isOpen={isNewFolderModalOpen} onClose={() => setIsNewFolderModalOpen(false)} title="Create New Folder" footer={(
        <>
          <button onClick={() => setIsNewFolderModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600">Cancel</button>
          <button onClick={handleCreateFolder} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700">Create Folder</button>
        </>
      )}>
        <input autoFocus className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500" placeholder="Folder name..." value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()} />
      </Modal>
    </div>
  );
}

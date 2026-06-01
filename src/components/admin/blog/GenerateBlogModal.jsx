"use client";

import { useState, useEffect, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Loader2, Send, Bot, User } from "lucide-react";
import { adminBlogService } from "@/lib/api/admin/blogs";
import { toast } from "react-toastify";

export default function GenerateBlogModal({ isOpen, onClose, onGenerateSuccess, initialContent = null }) {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    // Initial message from AI
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            if (initialContent) {
                setMessages([
                    {
                        role: "assistant",
                        content: "I've loaded your article. How would you like to improve it? I can adjust the tone, expand sections, or optimize for different keywords."
                    }
                ]);
            } else {
                setMessages([
                    {
                        role: "assistant",
                        content: "Hello! I'm Drop PR GPT. Tell me about the blog post you want to create today. Include the topic, category, and any brands to mention."
                    }
                ]);
            }
        }
    }, [isOpen, initialContent]);

    // Auto scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim() || loading) return;

        const userPrompt = inputValue.trim();
        setMessages(prev => [...prev, { role: "user", content: userPrompt }]);
        setInputValue("");
        setLoading(true);

        try {
            // Simulated "thinking" message
            setMessages(prev => [...prev, { role: "assistant", content: "...", isThinking: true }]);

            const type = initialContent ? "improve-content" : "generate-content";
            const response = await adminBlogService.generateBlogContent(
                userPrompt, 
                "AI Content", 
                type, 
                initialContent
            );

            if (response.success) {
                setMessages(prev => {
                    const last = [...prev];
                    last[last.length - 1] = { 
                        role: "assistant", 
                        content: initialContent 
                            ? "I've applied those improvements for you. Check the editor!" 
                            : "Your full article has been generated and populated in the form. What else can I help with?"
                    };
                    return last;
                });
                onGenerateSuccess(response.data);
            } else {
                throw new Error(response.message || "Failed");
            }
        } catch (error) {
            setMessages(prev => {
                const last = [...prev];
                last[last.length - 1] = { 
                    role: "assistant", 
                    content: "I'm sorry, I encountered an error while processing that. Please try again." 
                };
                return last;
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[800px] max-h-[90vh] h-[90vh] sm:h-[650px] p-0 border-none bg-white rounded-2xl sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
                <DialogHeader className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
                    <DialogTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <Sparkles className="text-white" size={20} />
                        </div>
                        <div>
                            <span className="block text-xs uppercase tracking-widest text-primary font-black">Droppr GPT</span>
                            <span className="text-lg font-black text-gray-900 tracking-tight">AI Writing Partner</span>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 sm:space-y-8 no-scrollbar min-h-0"
                >
                    {messages.map((msg, idx) => (
                        <div 
                            key={idx} 
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                        >
                            <div className={`flex gap-3 sm:gap-4 max-w-[90%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${
                                    msg.role === "user" ? "bg-gray-100 text-gray-500" : "bg-primary/10 text-primary"
                                }`}>
                                    {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                                </div>
                                <div className={`p-5 rounded-[2rem] text-sm font-bold leading-relaxed shadow-sm ${
                                    msg.role === "user" 
                                        ? "bg-gray-900 text-white rounded-tr-none" 
                                        : "bg-gray-50 text-gray-700 rounded-tl-none border border-gray-100"
                                }`}>
                                    {msg.isThinking ? (
                                        <div className="flex gap-1 py-1">
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    ) : (
                                        <div className="whitespace-pre-wrap">{msg.content}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/50 shrink-0">
                    <div className="relative group">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Type your prompt here..."
                            className="w-full h-[60px] pl-6 pr-16 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-gray-700 resize-none shadow-sm"
                            disabled={loading}
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!inputValue.trim() || loading}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

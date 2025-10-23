'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Chat } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X } from 'lucide-react';

interface ChatWidgetProps {
  recipientId: string;
  recipientName: string;
}

export default function ChatWidget({ recipientId, recipientName }: ChatWidgetProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<(Chat & { sender_name?: string })[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, recipientId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    if (!user) return;

    const mockMessages: (Chat & { sender_name?: string })[] = [
      {
        id: '1',
        sender_id: recipientId,
        receiver_id: user.id,
        message: 'Hello! How can I help you?',
        is_read: true,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        sender_name: recipientName
      }
    ];

    setMessages(mockMessages);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;

    setIsTyping(true);
    const newMsg: Chat & { sender_name?: string } = {
      id: Math.random().toString(36).substring(7),
      sender_id: user.id,
      receiver_id: recipientId,
      message: newMessage.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
      sender_name: 'You'
    };

    setMessages([...messages, newMsg]);
    setNewMessage('');
    setIsTyping(false);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
        <CardTitle className="text-lg">{recipientName}</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white/20"
        >
          <X className="w-5 h-5" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96 p-4" ref={scrollRef}>
          <div className="space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      message.sender_id === user?.id
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm break-words">{message.message}</p>
                    <p className={`text-xs mt-1 ${message.sender_id === user?.id ? 'text-emerald-100' : 'text-gray-500'}`}>
                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isTyping}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isTyping || !newMessage.trim()}
            className="bg-gradient-to-r from-emerald-600 to-teal-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

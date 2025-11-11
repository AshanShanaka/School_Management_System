"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import Image from "next/image";

interface Contact {
  id: string;
  name: string;
  surname: string;
  role: string;
  email?: string;
  username?: string;
  subjects?: string[];
  className?: string;
  childName?: string;
  studentNames?: string[];
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  isRead: boolean;
  isSentByMe: boolean;
}

interface Conversation {
  partnerId: string;
  partner: Contact;
  lastMessage: {
    content: string;
    createdAt: string;
    isFromMe: boolean;
  };
  unreadCount: number;
}

const MessagesPage = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    fetchContacts();
  }, []);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id);
      markMessagesAsRead(selectedContact.id);
    }
  }, [selectedContact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/messages");
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/messages/contacts");
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  const fetchMessages = async (contactId: string) => {
    try {
      const response = await fetch(`/api/messages?conversationId=${contactId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const markMessagesAsRead = async (senderId: string) => {
    try {
      await fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId })
      });
      
      // Update conversations to reflect read status
      setConversations(prev => 
        prev.map(conv => 
          conv.partnerId === senderId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const sendMessage = async () => {
    if (!selectedContact || !newMessage.trim()) return;

    setSending(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedContact.id,
          content: newMessage.trim()
        })
      });

      if (response.ok) {
        const sentMessage = await response.json();
        setMessages(prev => [...prev, { ...sentMessage, isSentByMe: true }]);
        setNewMessage("");
        
        // Update conversations
        fetchConversations();
        
        toast.success("Message sent!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const startNewConversation = (contact: Contact) => {
    setSelectedContact(contact);
    setShowNewMessageModal(false);
    setMessages([]);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "teacher": return "/teacher.png";
      case "student": return "/student.png";
      case "parent": return "/parent.png";
      default: return "/profile.png";
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      teacher: "bg-blue-100 text-blue-800",
      student: "bg-green-100 text-green-800",
      parent: "bg-purple-100 text-purple-800"
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading messages...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md flex-1 m-4 mt-0 h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
        <button
          onClick={() => setShowNewMessageModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Image src="/message.png" alt="New Message" width={16} height={16} />
          New Message
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Conversations</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Image src="/message.png" alt="No messages" width={48} height={48} className="mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm">Start a new conversation</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.partnerId}
                  onClick={() => setSelectedContact(conversation.partner)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedContact?.id === conversation.partnerId ? "bg-blue-50 border-blue-200" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Image 
                      src={getRoleIcon(conversation.partner.role)} 
                      alt={conversation.partner.role} 
                      width={40} 
                      height={40}
                      className="rounded-full" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 truncate">
                          {conversation.partner.name} {conversation.partner.surname}
                        </h4>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadge(conversation.partner.role)}`}>
                          {conversation.partner.role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {conversation.lastMessage.isFromMe ? "You: " : ""}
                        {conversation.lastMessage.content}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(conversation.lastMessage.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <Image 
                    src={getRoleIcon(selectedContact.role)} 
                    alt={selectedContact.role} 
                    width={40} 
                    height={40}
                    className="rounded-full" 
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedContact.name} {selectedContact.surname}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadge(selectedContact.role)}`}>
                        {selectedContact.role}
                      </span>
                      {selectedContact.subjects && (
                        <span className="text-xs text-gray-600">
                          Subjects: {selectedContact.subjects.join(", ")}
                        </span>
                      )}
                      {selectedContact.className && (
                        <span className="text-xs text-gray-600">
                          Class: {selectedContact.className}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isSentByMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isSentByMe
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.isSentByMe ? "text-blue-100" : "text-gray-500"
                      }`}>
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Image src="/message.png" alt="Select conversation" width={64} height={64} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-gray-500 mb-2">Select a conversation</h3>
                <p className="text-gray-400">Choose a conversation from the sidebar or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Start New Conversation</h3>
              <button
                onClick={() => setShowNewMessageModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Image src="/close.png" alt="Close" width={20} height={20} />
              </button>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {contacts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No contacts available</p>
              ) : (
                contacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => startNewConversation(contact)}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer rounded-lg"
                  >
                    <Image 
                      src={getRoleIcon(contact.role)} 
                      alt={contact.role} 
                      width={32} 
                      height={32}
                      className="rounded-full" 
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {contact.name} {contact.surname}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadge(contact.role)}`}>
                          {contact.role}
                        </span>
                        {contact.subjects && (
                          <span className="text-xs text-gray-600">
                            {contact.subjects.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;

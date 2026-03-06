import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiAPI } from '../services/api';
import { Bot, Send, Sparkles, User } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m GovIntel AI, your budget intelligence assistant. I can help you analyze budgets, detect anomalies, and provide insights. How can I assist you today?'
    }
  ]);
  const [input, setInput] = useState('');

  const chatMutation = useMutation({
    mutationFn: ({ message, history }) => aiAPI.chat(message, history),
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.data.message
      }]);
    },
    onError: (error) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    }
  });

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    // Send to AI
    const conversationHistory = messages.map(m => ({
      role: m.role,
      content: m.content
    }));
    
    chatMutation.mutate({
      message: userMessage,
      history: conversationHistory
    });
  };

  const suggestedQueries = [
    'Show me a summary of the current budget status',
    'Which departments have the highest spending?',
    'Identify budgets at risk of fund lapse',
    'What are the top anomalies detected this month?',
    'Analyze the spending trend of the Health department',
    'Compare budget utilization across all departments'
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-gray-600 mt-1">Chat with AI for budget insights and analysis</p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col card overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-primary text-white' 
                  : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
              }`}>
                {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              {/* Message Bubble */}
              <div className={`flex-1 max-w-[80%] ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}>
                <div className={`inline-block px-4 py-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {chatMutation.isPending && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <LoadingSpinner size="sm" />
              </div>
            </div>
          )}
        </div>

        {/* Suggested Queries (show only at start) */}
        {messages.length === 1 && (
          <div className="p-6 border-t">
            <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Suggested Questions
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestedQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInput(query);
                    setTimeout(() => handleSend(), 100);
                  }}
                  className="text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-6 border-t">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !chatMutation.isPending && handleSend()}
              placeholder="Ask me anything about budgets..."
              disabled={chatMutation.isPending}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || chatMutation.isPending}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;

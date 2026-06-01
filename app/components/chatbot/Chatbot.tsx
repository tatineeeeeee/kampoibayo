"use client";

import { X, Minimize2, MessageCircle } from "lucide-react";
import { ChatbotProps } from "./types";
import { FAQ_DATABASE } from "./faqDatabase";
import { useChatbot } from "../../hooks/useChatbot";
import { ChatMessage, TypingIndicator } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

export default function Chatbot({ onOpenStateChange }: ChatbotProps = {}) {

  const {
    isOpen,
    isMinimized,
    messages,
    inputText,
    isTyping,
    showQuickQuestions,
    setIsMinimized,
    setInputText,
    setShowQuickQuestions,
    setChatbotOpen,
    handleSendMessage,
    handleKeyPress,
    handleQuickQuestion,
    quickQuestions,
    messagesEndRef,
  } = useChatbot({ onOpenStateChange });

  if (!isOpen) {
    return (
      <button
        onClick={() => setChatbotOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-primary hover:bg-primary/90 text-primary-foreground h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group border border-primary/80"
        aria-label="Open chat"
      >
        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
        {/* Online status indicator */}
        <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full animate-pulse"></span>
        {/* Help tooltip - hide on mobile */}
        <div className="hidden sm:block absolute bottom-full right-0 mb-2 px-3 py-1 bg-popover border border-border text-popover-foreground text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-lg">
          Need help? Ask me anything!
        </div>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 transition-all duration-300
      ${isMinimized ? "w-72 sm:w-80" : "w-full sm:w-96"}
      ${isMinimized ? "" : "max-w-[calc(100vw-2rem)] sm:max-w-none"}
      ${isMinimized ? "" : "left-4 sm:left-auto"}`}
    >
      {/* Chat Window */}
      <div
        className={`bg-card rounded-2xl shadow-2xl border border-border flex flex-col transition-all duration-300
        ${isMinimized ? "h-14 sm:h-16" : "h-[70vh] sm:h-[600px] max-h-[600px]"}
        overflow-hidden`}
      >
        {/* Header */}
        <div
          className={`bg-card flex items-center justify-between text-foreground transition-all duration-300
          ${
            isMinimized
              ? "h-full p-2 sm:p-3 rounded-2xl"
              : "p-3 sm:p-4 rounded-t-2xl border-b border-border"
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div
                className={`bg-primary/20 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform
                ${
                  isMinimized
                    ? "w-6 h-6 sm:w-8 sm:h-8"
                    : "w-8 h-8 sm:w-10 sm:h-10"
                }`}
              >
                <MessageCircle
                  className={`text-primary ${
                    isMinimized
                      ? "w-3 h-3 sm:w-4 sm:h-4"
                      : "w-4 h-4 sm:w-5 sm:h-5"
                  }`}
                />
              </div>
              <span
                className={`absolute bg-green-500 rounded-full
                ${
                  isMinimized
                    ? "bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5"
                    : "bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3"
                }`}
              ></span>
            </div>
            {!isMinimized && (
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-white text-sm sm:text-base truncate">
                  Kampo Ibayo Assistant
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  Ready • {FAQ_DATABASE.length}+ answers available
                </p>
              </div>
            )}
            {isMinimized && (
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white text-xs sm:text-sm truncate">
                  Assistant
                </h3>
                <p className="text-xs text-green-400 truncate">Ready</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-foreground hover:bg-muted p-1 sm:p-1.5 rounded-lg transition-colors"
              aria-label={isMinimized ? "Maximize" : "Minimize"}
            >
              <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setChatbotOpen(false)}
              className="text-foreground hover:bg-muted p-1 sm:p-1.5 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-background">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {isTyping && <TypingIndicator />}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions - Always Accessible */}
            {showQuickQuestions && (
              <div className="px-3 sm:px-4 py-2 sm:py-3 bg-card border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Quick Topics
                  </p>
                  <button
                    onClick={() => setShowQuickQuestions(false)}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Hide
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quickQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(question)}
                      className="text-xs bg-muted hover:bg-primary text-foreground hover:text-primary-foreground px-2.5 sm:px-3 py-2 rounded-lg transition-all duration-200 text-left hover:scale-105 border border-border hover:border-primary"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Show Quick Questions Toggle when hidden */}
            {!showQuickQuestions && (
              <div className="px-3 sm:px-4 py-2 bg-card border-t border-border">
                <button
                  onClick={() => setShowQuickQuestions(true)}
                  className="w-full text-xs text-primary hover:text-primary/80 transition-colors font-medium text-center py-1"
                >
                  Show Quick Topics
                </button>
              </div>
            )}

            {/* Input Area */}
            <ChatInput
              inputText={inputText}
              onInputChange={setInputText}
              onSend={handleSendMessage}
              onKeyPress={handleKeyPress}
              disabled={!inputText.trim()}
            />
          </>
        )}
      </div>
    </div>
  );
}

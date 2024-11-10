"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AvatarImage } from "@radix-ui/react-avatar";
import { Bot, Loader2, Send, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type Message = {
  user?: string;
  assistant?: string;
};

export default function ChatWindow({ user }: { user: any }) {
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = async () => {
    if (input.trim()) {
      setIsLoading(true);
      // Add user message immediately
      setChatHistory((prev) => [...prev, { user: input.trim() }]);

      try {
        const response = await fetch("http://localhost:8000/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: input }),
        });

        const data = await response.json();
        setChatHistory(data.chat_history);
      } catch (error) {
        console.error("Error:", error);
        setChatHistory((prev) => [
          ...prev,
          {
            assistant: "Sorry, there was an error processing your request.",
          },
        ]);
      } finally {
        setIsLoading(false);
        setInput("");
      }
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto h-[calc(100vh-82px)] border-zinc-700 shadow-xl flex flex-col bg-zinc-900">
      <CardContent className="flex-grow overflow-hidden p-6">
        <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-6">
            {chatHistory.map((message, index) => (
              <div key={index} className="space-y-6">
                {message.user && (
                  <div className="flex items-start justify-end">
                    <div className="flex items-start space-x-3 max-w-[80%]">
                      <div className="p-4 rounded-2xl bg-blue-600 text-white shadow-md">
                        <ReactMarkdown className="prose prose-invert">
                          {message.user}
                        </ReactMarkdown>
                      </div>
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={user?.image} alt="User" />
                        <AvatarFallback className="bg-blue-600 text-white">
                          <User size={20} />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                )}
                {message.assistant && (
                  <div className="flex items-start justify-start">
                    <div className="flex items-start space-x-3 max-w-[80%]">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-emerald-600 text-white">
                          <Bot size={20} />
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="p-4 rounded-2xl bg-zinc-800 shadow-md">
                          <ReactMarkdown
                            className="prose prose-invert max-w-none"
                            components={{
                              h2: ({ ...props }) => (
                                <h2
                                  className="text-lg font-bold mt-4 mb-2 text-zinc-200"
                                  {...props}
                                />
                              ),
                              h3: ({ ...props }) => (
                                <h3
                                  className="text-base font-semibold mt-3 mb-1 text-zinc-300"
                                  {...props}
                                />
                              ),
                              a: ({ ...props }) => (
                                <a
                                  className="text-blue-400 hover:text-blue-300 hover:underline"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  {...props}
                                />
                              ),
                              p: ({ ...props }) => (
                                <p className="mb-2 text-zinc-300" {...props} />
                              ),
                              ul: ({ ...props }) => (
                                <ul className="space-y-1 mb-4" {...props} />
                              ),
                              li: ({ ...props }) => (
                                <li className="text-zinc-300" {...props} />
                              ),
                              strong: ({ ...props }) => (
                                <strong
                                  className="font-semibold text-zinc-200"
                                  {...props}
                                />
                              ),
                              em: ({ ...props }) => (
                                <em className="text-zinc-400" {...props} />
                              ),
                            }}
                          >
                            {message.assistant}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading spinner */}
            {isLoading && (
              <div className="flex items-start justify-start">
                <div className="flex items-start space-x-3 max-w-[80%]">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-emerald-600 text-white">
                      <Bot size={20} />
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="p-4 rounded-2xl bg-zinc-800 shadow-md">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                        <span className="text-sm text-zinc-400">
                          Searching repositories...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 bg-zinc-800 border-t border-zinc-700">
        <form
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex w-full space-x-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search your starred repositories..."
            className="flex-grow text-white placeholder-zinc-400 bg-zinc-900 border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>Send</span>
                <Send size={16} />
              </div>
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

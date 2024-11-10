"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

type Message = {
  user?: string;
  assistant?: {
    message: {
      assistant: string;
    };
    raw_response: {
      model: string;
      created_at: string;
      total_duration: number;
      prompt_eval_count: number;
      eval_count: number;
    };
  };
};

export default function ChatWindow() {
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (input.trim()) {
      setIsLoading(true);

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
            assistant: {
              message: {
                assistant: "Sorry, there was an error processing your request.",
              },
              raw_response: {
                model: "error",
                created_at: new Date().toISOString(),
                total_duration: 0,
                prompt_eval_count: 0,
                eval_count: 0,
              },
            },
          },
        ]);
      } finally {
        setIsLoading(false);
        setInput("");
      }
    }
  };

  const getMetadata = (message: Message) => {
    if (!message.assistant) return null;
    const { model, total_duration, prompt_eval_count, eval_count } =
      message.assistant.raw_response;
    return {
      model,
      duration: (total_duration / 1e9).toFixed(2), // Convert nanoseconds to seconds
      totalTokens: prompt_eval_count + eval_count,
    };
  };

  return (
    <Card className="w-full max-w-4xl mx-auto h-[calc(100vh-200px)] border-black shadow-md flex flex-col bg-zinc-900">
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full p-2">
          {chatHistory.map((message, index) => (
            <div key={index} className="mb-4">
              {message.user && (
                <div className="flex items-start space-x-2 justify-end mb-2">
                  <div className="p-2 rounded-lg max-w-[80%] bg-primary text-primary-foreground">
                    <ReactMarkdown>{message.user}</ReactMarkdown>
                  </div>
                  <Avatar>
                    <AvatarFallback>
                      <User size={24} />
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              {message.assistant && (
                <div className="flex items-start space-x-2 justify-start">
                  <Avatar>
                    <AvatarFallback>
                      <Bot size={24} />
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 max-w-[80%]">
                    <div className="p-2 rounded-lg bg-muted">
                      <ReactMarkdown
                        components={{
                          h2: ({ node, ...props }) => (
                            <h2
                              className="text-lg font-bold mt-4 mb-2"
                              {...props}
                            />
                          ),
                          a: ({ node, ...props }) => (
                            <a
                              className="text-blue-500 hover:underline"
                              target="_blank"
                              rel="noopener noreferrer"
                              {...props}
                            />
                          ),
                          p: ({ node, ...props }) => (
                            <p className="mb-2" {...props} />
                          ),
                          li: ({ node, ...props }) => (
                            <li className="mb-2" {...props} />
                          ),
                          strong: ({ node, ...props }) => (
                            <strong className="font-semibold" {...props} />
                          ),
                          em: ({ node, ...props }) => (
                            <em className="text-gray-500" {...props} />
                          ),
                        }}
                      >
                        {message.assistant.message.assistant}
                      </ReactMarkdown>
                    </div>
                    {getMetadata(message) && (
                      <div className="text-xs text-gray-500 pl-2">
                        Model: {getMetadata(message)?.model} • Response time:{" "}
                        {getMetadata(message)?.duration}s • Tokens used:{" "}
                        {getMetadata(message)?.totalTokens}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex w-full space-x-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search your starred repositories..."
            className="flex-grow text-white placeholder-gray-400 bg-zinc-800 border-zinc-700"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
"use client";

import { useEffect, useRef, useState } from "react";

async function getToken() {
    try {
        const response = await fetch("/api/chat/token");
        const data = await response.json();
        if (!response.ok) return null;
        return data.token;
    } catch (error) {
        console.error("Failed to get chat token:", error);
        return null;
    }
}

interface EmbeddedChatProps {
    channelId: string;
}

export function EmbeddedChat({ channelId }: EmbeddedChatProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unmountFn: (() => void) | null = null;

        async function initChat() {
            try {
                setLoading(true);
                // Import dynamically to avoid SSR and to handle missing types
                const whopVanilla = await import("@whop/embedded-components-vanilla-js");
                const elements = await whopVanilla.loadWhopElements();

                if (!elements) {
                    throw new Error("Failed to load Whop elements");
                }

                const token = await getToken();
                if (!token) {
                    setError("Please sign in to join the chat");
                    setLoading(false);
                    return;
                }

                // Search for chat creation method on elements or the module
                // Different versions might have different names (createChat, createElement('chat'), etc)
                // @ts-ignore - bypassing missing type definitions
                const createChat = (elements as any).createChat || (whopVanilla as any).createChat;

                if (!createChat && (elements as any).createElement) {
                    // Try the generic createElement if it exists
                    try {
                        // @ts-ignore
                        const chat = (elements as any).createElement("chat", { channelId, token });
                        if (chat && containerRef.current) {
                            chat.mount(containerRef.current);
                            unmountFn = () => chat.unmount();
                            setLoading(false);
                            return;
                        }
                    } catch (e) {
                        console.log("createElement('chat') failed", e);
                    }
                }

                if (createChat && containerRef.current) {
                    const chat = createChat(containerRef.current, {
                        channelId: channelId,
                        token: token,
                        appearance: {
                            theme: "dark",
                            accentColor: "orange",
                        },
                    });
                    unmountFn = () => chat.unmount();
                } else {
                    console.error("Chat creation method not found in Whop SDK");
                    setError("Chat component not available in this SDK version.");
                }
                setLoading(false);
            } catch (err: any) {
                console.error("Chat init error:", err);
                setError("Failed to initialize chat");
                setLoading(false);
            }
        }

        initChat();

        return () => {
            if (unmountFn) unmountFn();
        };
    }, [channelId]);

    return (
        <div className="w-full h-full min-h-[500px] rounded-xl border border-[#303030] bg-[#0f0f0f] overflow-hidden flex flex-col items-center justify-center p-4">
            {loading && (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 text-sm">Loading chat...</p>
                </div>
            )}
            {error && (
                <div className="text-center">
                    <p className="text-gray-400 mb-4">{error}</p>
                    {error.includes("sign in") && (
                        <a
                            href="/api/auth/login"
                            className="px-4 py-2 bg-white text-black rounded-full font-medium text-sm hover:bg-gray-200"
                        >
                            Sign In
                        </a>
                    )}
                </div>
            )}
            <div ref={containerRef} className="w-full h-full" style={{ display: loading || error ? 'none' : 'block' }} />
        </div>
    );
}

"use client"

import { useState } from "react"
import { ThumbsUp, ThumbsDown } from "lucide-react"

interface VideoLikeButtonsProps {
    videoId: string
    initialLikeCount: number
    initialDislikeCount: number
    initialUserVote: string | null
}

export function VideoLikeButtons({ videoId, initialLikeCount, initialDislikeCount, initialUserVote }: VideoLikeButtonsProps) {
    const [likeCount, setLikeCount] = useState(initialLikeCount)
    const [dislikeCount, setDislikeCount] = useState(initialDislikeCount)
    const [userVote, setUserVote] = useState<string | null>(initialUserVote)
    const [loading, setLoading] = useState(false)

    async function handleVote(type: 'like' | 'dislike') {
        if (loading) return
        setLoading(true)

        try {
            const res = await fetch(`/api/videos/${videoId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type }),
            })

            if (!res.ok) return

            const data = await res.json()

            if (data.action === 'removed') {
                if (type === 'like') setLikeCount(c => c - 1)
                else setDislikeCount(c => c - 1)
                setUserVote(null)
            } else if (data.action === 'switched') {
                if (type === 'like') {
                    setLikeCount(c => c + 1)
                    setDislikeCount(c => c - 1)
                } else {
                    setLikeCount(c => c - 1)
                    setDislikeCount(c => c + 1)
                }
                setUserVote(type)
            } else if (data.action === 'added') {
                if (type === 'like') setLikeCount(c => c + 1)
                else setDislikeCount(c => c + 1)
                setUserVote(type)
            }
        } catch (err) {
            console.error('Failed to vote:', err)
        } finally {
            setLoading(false)
        }
    }

    function formatCount(n: number): string {
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
        return n.toString()
    }

    return (
        <div className="flex items-center bg-[#272727] rounded-full h-9">
            <button
                onClick={() => handleVote('like')}
                disabled={loading}
                className={`flex items-center gap-2 px-4 h-full hover:bg-[#3f3f3f] rounded-l-full border-r border-[#3f3f3f] transition-colors ${userVote === 'like' ? 'text-blue-400' : 'text-white'}`}
            >
                <ThumbsUp className="w-4 h-4" fill={userVote === 'like' ? 'currentColor' : 'none'} />
                <span className="text-sm font-bold">{formatCount(likeCount)}</span>
            </button>
            <button
                onClick={() => handleVote('dislike')}
                disabled={loading}
                className={`px-4 h-full hover:bg-[#3f3f3f] rounded-r-full transition-colors ${userVote === 'dislike' ? 'text-blue-400' : 'text-white'}`}
            >
                <ThumbsDown className="w-4 h-4" fill={userVote === 'dislike' ? 'currentColor' : 'none'} />
            </button>
        </div>
    )
}

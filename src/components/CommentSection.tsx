"use client"

import { useState, useEffect } from "react"
import { ThumbsUp, MessageSquare, ChevronDown, ChevronUp, Send } from "lucide-react"

interface Comment {
    id: string
    content: string
    created_at: string
    likeCount: number
    isLiked: boolean
    users: {
        id: string
        username: string
        avatar_url: string | null
    }
    replies: Comment[]
}

export function CommentSection({ videoId }: { videoId: string }) {
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState("")
    const [loading, setLoading] = useState(true)
    const [posting, setPosting] = useState(false)
    const [replyingTo, setReplyingTo] = useState<string | null>(null)
    const [replyContent, setReplyContent] = useState("")
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())

    useEffect(() => {
        fetchComments()
    }, [videoId])

    async function fetchComments() {
        try {
            const res = await fetch(`/api/comments?videoId=${videoId}`)
            const data = await res.json()
            setComments(data.comments || [])
        } catch (err) {
            console.error("Failed to fetch comments:", err)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmitComment(e: React.FormEvent) {
        e.preventDefault()
        if (!newComment.trim() || posting) return

        setPosting(true)
        try {
            const res = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoId, content: newComment }),
            })

            if (res.ok) {
                const data = await res.json()
                setComments((prev) => [data.comment, ...prev])
                setNewComment("")
            }
        } catch (err) {
            console.error("Failed to post comment:", err)
        } finally {
            setPosting(false)
        }
    }

    async function handleSubmitReply(parentId: string) {
        if (!replyContent.trim() || posting) return

        setPosting(true)
        try {
            const res = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoId, content: replyContent, parentId }),
            })

            if (res.ok) {
                const data = await res.json()
                setComments((prev) =>
                    prev.map((c) =>
                        c.id === parentId
                            ? { ...c, replies: [...c.replies, data.comment] }
                            : c
                    )
                )
                setReplyContent("")
                setReplyingTo(null)
                setExpandedReplies((prev) => new Set([...prev, parentId]))
            }
        } catch (err) {
            console.error("Failed to post reply:", err)
        } finally {
            setPosting(false)
        }
    }

    async function handleLikeComment(commentId: string, isReply: boolean, parentId?: string) {
        try {
            const res = await fetch(`/api/comments/${commentId}/like`, { method: "POST" })
            const data = await res.json()

            const updateLike = (c: Comment): Comment =>
                c.id === commentId
                    ? { ...c, isLiked: data.liked, likeCount: c.likeCount + (data.liked ? 1 : -1) }
                    : c

            if (isReply && parentId) {
                setComments((prev) =>
                    prev.map((c) =>
                        c.id === parentId
                            ? { ...c, replies: c.replies.map(updateLike) }
                            : c
                    )
                )
            } else {
                setComments((prev) => prev.map(updateLike))
            }
        } catch (err) {
            console.error("Failed to like comment:", err)
        }
    }

    function toggleReplies(commentId: string) {
        setExpandedReplies((prev) => {
            const next = new Set(prev)
            if (next.has(commentId)) next.delete(commentId)
            else next.add(commentId)
            return next
        })
    }

    function timeAgo(dateStr: string): string {
        const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
        if (seconds < 60) return "just now"
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
        return `${Math.floor(seconds / 604800)}w ago`
    }

    return (
        <div className="mt-6 space-y-6">
            <h2 className="text-xl font-bold">{comments.length} Comments</h2>

            {/* Comment Input */}
            <form onSubmit={handleSubmitComment} className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center text-sm font-bold">
                    Y
                </div>
                <div className="flex-1">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full bg-transparent border-b border-[#303030] focus:border-white pb-2 text-sm outline-none text-white placeholder-gray-500 transition-colors"
                    />
                    {newComment.trim() && (
                        <div className="flex justify-end gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => setNewComment("")}
                                className="px-4 py-1.5 text-sm rounded-full hover:bg-[#272727] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={posting}
                                className="px-4 py-1.5 text-sm bg-blue-500 rounded-full font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                            >
                                Comment
                            </button>
                        </div>
                    )}
                </div>
            </form>

            {/* Comments List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 animate-pulse">
                            <div className="w-10 h-10 rounded-full bg-[#272727]" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-24 bg-[#272727] rounded" />
                                <div className="h-4 w-full bg-[#272727] rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <div key={comment.id} className="space-y-2">
                            {/* Main Comment */}
                            <div className="flex gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#303030] flex-shrink-0 overflow-hidden">
                                    {comment.users?.avatar_url ? (
                                        <img src={comment.users.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-sm font-bold bg-purple-600">
                                            {(comment.users?.username || "U").charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[13px] font-medium">@{comment.users?.username || "user"}</span>
                                        <span className="text-xs text-gray-500">{timeAgo(comment.created_at)}</span>
                                    </div>
                                    <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">{comment.content}</p>
                                    <div className="flex items-center gap-4 mt-1">
                                        <button
                                            onClick={() => handleLikeComment(comment.id, false)}
                                            className={`flex items-center gap-1 text-xs hover:bg-[#272727] px-2 py-1 rounded-full transition-colors ${comment.isLiked ? "text-blue-400" : "text-gray-400"}`}
                                        >
                                            <ThumbsUp className="w-3.5 h-3.5" />
                                            {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setReplyingTo(replyingTo === comment.id ? null : comment.id)
                                                setReplyContent("")
                                            }}
                                            className="flex items-center gap-1 text-xs text-gray-400 hover:bg-[#272727] px-2 py-1 rounded-full transition-colors"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            Reply
                                        </button>
                                    </div>

                                    {/* Reply Input */}
                                    {replyingTo === comment.id && (
                                        <div className="flex gap-2 mt-3 items-center">
                                            <input
                                                type="text"
                                                value={replyContent}
                                                onChange={(e) => setReplyContent(e.target.value)}
                                                placeholder="Add a reply..."
                                                autoFocus
                                                className="flex-1 bg-transparent border-b border-[#303030] focus:border-white pb-1 text-sm outline-none text-white placeholder-gray-500 transition-colors"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleSubmitReply(comment.id)
                                                }}
                                            />
                                            <button
                                                onClick={() => handleSubmitReply(comment.id)}
                                                disabled={!replyContent.trim() || posting}
                                                className="p-1.5 text-blue-400 hover:bg-[#272727] rounded-full transition-colors disabled:opacity-30"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => { setReplyingTo(null); setReplyContent("") }}
                                                className="text-xs text-gray-400 hover:text-white px-2 py-1"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}

                                    {/* Replies Toggle */}
                                    {comment.replies.length > 0 && (
                                        <button
                                            onClick={() => toggleReplies(comment.id)}
                                            className="flex items-center gap-1 text-sm text-blue-400 font-medium mt-2 hover:bg-blue-400/10 px-2 py-1 rounded-full transition-colors"
                                        >
                                            {expandedReplies.has(comment.id) ? (
                                                <ChevronUp className="w-4 h-4" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4" />
                                            )}
                                            {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
                                        </button>
                                    )}

                                    {/* Replies List */}
                                    {expandedReplies.has(comment.id) && (
                                        <div className="ml-2 mt-2 space-y-3 border-l-2 border-[#272727] pl-4">
                                            {comment.replies.map((reply) => (
                                                <div key={reply.id} className="flex gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-[#303030] flex-shrink-0 overflow-hidden">
                                                        {reply.users?.avatar_url ? (
                                                            <img src={reply.users.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-teal-600">
                                                                {(reply.users?.username || "U").charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="text-xs font-medium">@{reply.users?.username || "user"}</span>
                                                            <span className="text-xs text-gray-500">{timeAgo(reply.created_at)}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">{reply.content}</p>
                                                        <button
                                                            onClick={() => handleLikeComment(reply.id, true, comment.id)}
                                                            className={`flex items-center gap-1 text-xs mt-1 hover:bg-[#272727] px-2 py-0.5 rounded-full transition-colors ${reply.isLiked ? "text-blue-400" : "text-gray-400"}`}
                                                        >
                                                            <ThumbsUp className="w-3 h-3" />
                                                            {reply.likeCount > 0 && <span>{reply.likeCount}</span>}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {comments.length === 0 && !loading && (
                        <p className="text-center text-gray-500 py-8 text-sm">No comments yet. Be the first!</p>
                    )}
                </div>
            )}
        </div>
    )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreatorOnboarding() {
    const router = useRouter()
    const [channelName, setChannelName] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!channelName.trim()) return

        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/creator/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelName: channelName.trim(),
                    description: description.trim(),
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to create channel')
            }

            router.push('/creator/dashboard')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0f0f0f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
        }}>
            <div style={{
                background: '#1a1a1a',
                borderRadius: '16px',
                padding: '3rem',
                maxWidth: '500px',
                width: '100%',
                border: '1px solid #333',
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, #ff4444, #ff6b00)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        fontSize: '28px',
                    }}>
                        🎬
                    </div>
                    <h1 style={{
                        color: '#fff',
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        margin: '0 0 0.5rem',
                    }}>
                        Create Your Channel
                    </h1>
                    <p style={{ color: '#aaa', fontSize: '0.95rem', margin: 0 }}>
                        Set up your creator channel to start uploading videos and growing your audience.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            color: '#ccc',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            marginBottom: '0.5rem',
                        }}>
                            Channel Name *
                        </label>
                        <input
                            type="text"
                            value={channelName}
                            onChange={(e) => setChannelName(e.target.value)}
                            placeholder="My Awesome Channel"
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                background: '#0f0f0f',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '1rem',
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            color: '#ccc',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            marginBottom: '0.5rem',
                        }}>
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Tell viewers what your channel is about..."
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                background: '#0f0f0f',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '1rem',
                                outline: 'none',
                                resize: 'vertical',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit',
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(255, 0, 0, 0.1)',
                            border: '1px solid rgba(255, 0, 0, 0.3)',
                            borderRadius: '8px',
                            padding: '0.75rem 1rem',
                            color: '#ff6b6b',
                            fontSize: '0.875rem',
                            marginBottom: '1.5rem',
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !channelName.trim()}
                        style={{
                            width: '100%',
                            padding: '0.875rem',
                            background: loading ? '#333' : 'linear-gradient(135deg, #ff4444, #ff6b00)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'opacity 0.2s',
                            opacity: !channelName.trim() ? 0.5 : 1,
                        }}
                    >
                        {loading ? 'Creating Channel...' : 'Create Channel'}
                    </button>
                </form>
            </div>
        </div>
    )
}

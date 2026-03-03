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
                maxWidth: '460px',
                width: '100%',
            }}>
                <h1 style={{
                    color: '#fff',
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    margin: '0 0 0.25rem',
                    fontFamily: 'inherit',
                }}>
                    Create your channel
                </h1>
                <p style={{
                    color: '#717171',
                    fontSize: '0.875rem',
                    margin: '0 0 2rem',
                    lineHeight: 1.5,
                }}>
                    You need a channel to upload videos and access Creator Studio.
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{
                            display: 'block',
                            color: '#aaa',
                            fontSize: '0.8125rem',
                            marginBottom: '0.375rem',
                        }}>
                            Channel name
                        </label>
                        <input
                            type="text"
                            value={channelName}
                            onChange={(e) => setChannelName(e.target.value)}
                            placeholder="e.g. Tech Reviews"
                            required
                            style={{
                                width: '100%',
                                padding: '0.625rem 0.75rem',
                                background: '#181818',
                                border: '1px solid #303030',
                                borderRadius: '4px',
                                color: '#fff',
                                fontSize: '0.9375rem',
                                outline: 'none',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit',
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3ea6ff'}
                            onBlur={(e) => e.target.style.borderColor = '#303030'}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            color: '#aaa',
                            fontSize: '0.8125rem',
                            marginBottom: '0.375rem',
                        }}>
                            Description <span style={{ color: '#555' }}>(optional)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is your channel about?"
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '0.625rem 0.75rem',
                                background: '#181818',
                                border: '1px solid #303030',
                                borderRadius: '4px',
                                color: '#fff',
                                fontSize: '0.9375rem',
                                outline: 'none',
                                resize: 'vertical',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit',
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3ea6ff'}
                            onBlur={(e) => e.target.style.borderColor = '#303030'}
                        />
                    </div>

                    {error && (
                        <p style={{
                            color: '#f44',
                            fontSize: '0.8125rem',
                            margin: '0 0 1rem',
                        }}>
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !channelName.trim()}
                        style={{
                            padding: '0.625rem 1.25rem',
                            background: '#3ea6ff',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#0f0f0f',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading || !channelName.trim() ? 0.5 : 1,
                            fontFamily: 'inherit',
                        }}
                    >
                        {loading ? 'Creating...' : 'Create channel'}
                    </button>
                </form>
            </div>
        </div>
    )
}

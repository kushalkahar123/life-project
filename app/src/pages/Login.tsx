import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #312e81 0%, #581c87 50%, #9d174d 100%)',
        padding: '1rem',
    } as React.CSSProperties,
    card: {
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(16px)',
        borderRadius: '1rem',
        padding: '2rem',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
    } as React.CSSProperties,
    title: {
        fontSize: '1.875rem',
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: '0.5rem',
    } as React.CSSProperties,
    subtitle: {
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginBottom: '2rem',
    } as React.CSSProperties,
    input: {
        width: '100%',
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        border: 'none',
        background: 'rgba(255,255,255,0.2)',
        color: '#fff',
        marginBottom: '1rem',
        fontSize: '1rem',
        outline: 'none',
    } as React.CSSProperties,
    button: {
        width: '100%',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: 'none',
        background: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)',
        color: '#fff',
        fontWeight: 600,
        fontSize: '1rem',
        cursor: 'pointer',
    } as React.CSSProperties,
    error: {
        color: '#fca5a5',
        fontSize: '0.875rem',
        marginBottom: '1rem',
    } as React.CSSProperties,
    switch: {
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginTop: '1.5rem',
    } as React.CSSProperties,
    link: {
        color: '#f472b6',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        textDecoration: 'underline',
    } as React.CSSProperties,
}

export function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signIn, signUp } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            if (isSignUp) {
                await signUp(email, password, name)
            } else {
                await signIn(email, password)
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>🌙 Life Project</h1>
                <p style={styles.subtitle}>Your journey to better habits starts here</p>

                <form onSubmit={handleSubmit}>
                    {isSignUp && (
                        <input
                            type="text"
                            placeholder="Your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={styles.input}
                            required
                        />
                    )}

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={styles.input}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={styles.input}
                        required
                        minLength={6}
                    />

                    {error && <p style={styles.error}>{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{ ...styles.button, opacity: loading ? 0.5 : 1 }}
                    >
                        {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
                    </button>
                </form>

                <p style={styles.switch}>
                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                    <button onClick={() => setIsSignUp(!isSignUp)} style={styles.link}>
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </p>
            </div>
        </div>
    )
}

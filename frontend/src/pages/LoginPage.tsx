import { useMemo, useState } from "react";
import { login } from "../utils/auth";
import "./App.css";

type Props = {
    onLoginSuccess: () => void;
};

export function LoginPage({ onLoginSuccess }: Props) {
    //set state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const canSubmit = useMemo(() => email.trim().length > 0 && password.length > 0, [email, password]);

    const handleSubmit = async (e: React.FormEvent) => {
        //keep entry
        e.preventDefault();
        setError(null);
        setLoading(true);

        // Call real backend authentication
        const res = await login(email.trim(), password);
        setLoading(false);

        //if failed
        if (!res.ok) {
            setError(res.message);
            return;
        }

        onLoginSuccess();
    };

    return (
    <div className="modal-overlay">
        <div className="modal">
        <div className="modal-logo">
            <div className="logo-icon">N</div>
            <h2 className="modal-title">Nextlink Merch Portal</h2>
        </div>

        <div className="modal-body">
            <p className="modal-subtitle">Sign in to place and track orders.</p>

            {error ? <div className="error-box">{error}</div> : null}

            <form onSubmit={handleSubmit} className="login-form">
            <label className="form-label">
                Email
                <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="name@company.com"
                />
            </label>

            <label className="form-label">
                Password
                <input
                className="input"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                />
            </label>

            <label className="login-checkbox-row">
                <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} />
                Show password
            </label>

            <button className="btn btn-primary" disabled={!canSubmit || loading} type="submit">
                {loading ? "Signing in..." : "Sign in"}
            </button>

            <div className="login-hint">
                Use: admin@nextlink.com / admin123 for admin access
            </div>
            </form>
        </div>
        </div>
    </div>
    );
}

// src/app/login/page.tsx
"use client";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 360,
          padding: 24,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
        }}
      >
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>Faculty Portal Login</h1>
        <button
          onClick={() => signIn("google", { callbackUrl: "/faculty" })}
          style={{
            width: "100%",
            background: "#2563eb",
            color: "#fff",
            padding: "12px 16px",
            borderRadius: 6,
            border: 0,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Continue with Google
        </button>
      </div>
    </main>
  );
}

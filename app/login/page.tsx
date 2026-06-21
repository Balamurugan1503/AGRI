import type { Metadata } from "next"
import { AuthLayout } from "@/components/auth/auth-layout"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Login - AgriForecast",
  description: "Sign in to your AgriForecast account.",
}

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome Back 🌱"
      subtitle="Sign in to AgriForecast to manage your farm insights & predictions"
    >
      <LoginForm />
    </AuthLayout>
  )
}
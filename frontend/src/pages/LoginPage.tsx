"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const mutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => login(email, password),
    onSuccess: () => {
      navigate("/dashboard")
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.code === "ERR_NETWORK"
          ? "Cannot connect to the server. Please check your internet and try again."
          : "Invalid email or password")
      setError(msg)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    mutation.mutate({ email, password })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-primary">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <CardTitle className="text-2xl">CuraMoney</CardTitle>
          <CardDescription>Sign in to your mill management account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/50 text-destructive text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@curamoney.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={mutation.isPending ? "opacity-70" : ""}
                disabled={mutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={mutation.isPending ? "opacity-70" : ""}
                disabled={mutation.isPending}
              />
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Sign in
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            Default credentials: admin@curamoney.com / admin123
          </p>
          <p className="text-sm">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
          <p className="text-sm">
            Forgot your password?{" "}
            <Link
              to="/forgot-password"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Reset with OTP
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

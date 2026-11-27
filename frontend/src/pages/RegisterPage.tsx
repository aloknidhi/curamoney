"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { authApi } from "@/services/apis"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Send, Mail, Phone } from "lucide-react"

type Step = "email" | "otp" | "done"

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [mobile, setMobile] = useState("")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Step 1: Send OTP
  const sendOtpMutation = useMutation({
    mutationFn: () => authApi.sendOtp({ email, purpose: "SIGNUP" }),
    onSuccess: () => {
      setSuccess("OTP sent to your email. Check your inbox.")
      setStep("otp")
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to send OTP")
    },
  })

  // Step 2: Verify OTP + create account
  const signupMutation = useMutation({
    mutationFn: () =>
      authApi.signup({ email, password, name, mobile, otp }),
    onSuccess: (response) => {
      const { user, token } = response.data.data
      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(user))
      navigate("/dashboard")
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Signup failed")
    },
  })

  const isPending = sendOtpMutation.isPending || signupMutation.isPending

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-primary">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            Join CuraMoney to manage your mill operations
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/50 text-destructive text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-md bg-green-100 border border-green-200 text-green-800 text-sm">
              {success}
            </div>
          )}

          {step === "email" && (
            <form onSubmit={(e) => { e.preventDefault(); sendOtpMutation.mutate() }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Mill Owner"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@curamoney.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isPending}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile (optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="pl-10"
                    disabled={isPending}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send OTP
              </Button>
            </form>
          )}

          {step === "otp" && (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                We sent a 6-digit code to <strong>{email}</strong>. Enter it below.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); signupMutation.mutate() }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP Code</Label>
                  <div className="relative">
                    <Send className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="otp"
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="pl-10 tracking-wider"
                      disabled={isPending}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isPending || otp.length !== 6}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Verify & Create Account
                </Button>
              </form>
              <Button
                onClick={() => setStep("email")}
                variant="outline"
                className="w-full"
                disabled={isPending}
              >
                Change email
              </Button>
            </>
          )}

          {step === "done" && (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-green-600">
                <span className="text-white font-bold text-sm">✓</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold">Account created</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Redirecting to dashboard...
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 text-center">
          <p className="text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

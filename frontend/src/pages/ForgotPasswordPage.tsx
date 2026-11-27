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
import { Mail, Send, Lock } from "lucide-react"

type Step = "send" | "reset"

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>("send")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const sendOtpMutation = useMutation({
    mutationFn: () => authApi.sendOtp({ email, purpose: "FORGOT_PASSWORD" }),
    onSuccess: () => {
      setSuccess("OTP sent to your email.")
      setStep("reset")
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to send OTP")
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: () =>
      authApi.resetPassword({ email, otp, newPassword }),
    onSuccess: () => {
      setSuccess("Password reset successfully. You can now sign in.")
      setTimeout(() => navigate("/login"), 1500)
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Password reset failed")
    },
  })

  const isPending = sendOtpMutation.isPending || resetPasswordMutation.isPending

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-primary">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            Reset your password with a one-time code
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

          {step === "send" && (
            <form onSubmit={(e) => { e.preventDefault(); sendOtpMutation.mutate() }} className="space-y-4">
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
              <Button type="submit" className="w-full" disabled={isPending || !email}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send OTP
              </Button>
            </form>
          )}

          {step === "reset" && (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                Enter the OTP and your new password below.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); resetPasswordMutation.mutate() }} className="space-y-4">
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
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10"
                      disabled={isPending}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isPending || otp.length !== 6 || newPassword.length < 6}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Reset Password
                </Button>
              </form>
              <Button
                onClick={() => setStep("send")}
                variant="outline"
                className="w-full"
                disabled={isPending}
              >
                Send another OTP
              </Button>
            </>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 text-center">
          <p className="text-sm">
            Remember your password?{" "}
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

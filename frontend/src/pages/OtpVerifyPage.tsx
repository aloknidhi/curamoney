"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
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
import { Send } from "lucide-react"
import { useNavigate } from "react-router-dom"

type Step = "send" | "verify" | "done"

export default function OtpVerifyPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>("send")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const sendOtpMutation = useMutation({
    mutationFn: () => authApi.sendOtp({ email, purpose: "LOGIN" }),
    onSuccess: () => {
      setSuccess("OTP sent. Enter the code below.")
      setStep("verify")
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to send OTP")
    },
  })

  const verifyOtpMutation = useMutation({
    mutationFn: () => authApi.verifyOtp({ email, otp, purpose: "LOGIN" }),
    onSuccess: () => {
      setSuccess("OTP verified successfully.")
      setStep("done")
      setTimeout(() => navigate("/login"), 1500)
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Invalid or expired OTP")
    },
  })

  const isPending = sendOtpMutation.isPending || verifyOtpMutation.isPending

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-primary">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <CardTitle className="text-2xl">Verify with OTP</CardTitle>
          <CardDescription>
            Sign in using a one-time code
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
                <Label htmlFor="email">Email or Mobile</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@curamoney.com or +91 98765 43210"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isPending || !email}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send OTP
              </Button>
            </form>
          )}

          {step === "verify" && (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                Enter the 6-digit code sent to <strong>{email}</strong>
              </p>
              <form onSubmit={(e) => { e.preventDefault(); verifyOtpMutation.mutate() }} className="space-y-4">
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
                  Verify OTP
                </Button>
              </form>
              <Button
                onClick={() => setStep("send")}
                variant="outline"
                className="w-full"
                disabled={isPending}
              >
                Resend / Change contact
              </Button>
            </>
          )}

          {step === "done" && (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-green-600">
                <span className="text-white font-bold text-sm">✓</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold">Verified</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Redirecting to sign in...
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 text-center">
          <p className="text-sm">
            Prefer password login?{" "}
            <Link
              to="/login"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Sign in with password
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

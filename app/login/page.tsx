"use client"

import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import * as z from "zod"
import { Sun, Moon, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useTRPC } from "@/trpc/client"

const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
})

type FormValues = z.infer<typeof formSchema>

export default function LoginPage() {
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const { toast } = useToast()
    const trpc = useTRPC()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    const loginMutation = useMutation(
        trpc.auth.login.mutationOptions({
            onSuccess: () => {
                toast({
                    title: "Login Successful",
                    description: "Redirecting to dashboard...",
                    variant: "success",
                })
                form.reset()
                router.push("/admin")
                router.refresh()
            },
            onError: (error) => {
                toast({
                    title: "Login Failed",
                    description: error.message || "Invalid credentials. Please try again.",
                    variant: "destructive",
                })
            },
        }),
    )

    const onSubmit = async (values: FormValues) => {
        loginMutation.mutate(values)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="absolute top-4 right-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                    className="rounded-full"
                >
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </div>
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <div className="flex items-center justify-center mb-4">
                        <Package className="h-10 w-10 text-orange-500" />
                    </div>
                    <h1 className="text-3xl font-bold">Admin Panel</h1>
                    <p className="text-muted-foreground mt-2">Sign in to access your dashboard</p>
                </div>
                <Card className="border-border shadow-lg">
                    {/* <CardHeader>
                        <CardTitle className="text-2xl">Login</CardTitle>
                        <CardDescription>Enter your credentials to continue</CardDescription>
                    </CardHeader> */}
                    <div className="mt-6">
                    </div>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    {...form.register("email")}
                                    required
                                    className="border-border"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    {...form.register("password")}
                                    required
                                    className="border-border"
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || loginMutation.isPending}>
                                {(form.formState.isSubmitting || loginMutation.isPending) ? "Signing in..." : "Sign In"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
}

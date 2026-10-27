"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios, { isAxiosError } from "axios";
import { api, API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState("admin@test.ru");
  const [password, setPassword] = useState("password");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await axios.get(`${API_URL}/sanctum/csrf-cookie`, {
        withCredentials: true,
      });

      const response = await api.post("/api/v1/login", { email, password });
      
      setUser(response.data.user);
      toast.success("Добро пожаловать, " + response.data.user.name);
      router.push("/");
      router.refresh();
    } catch (error: unknown) {
      console.error(error);
      let message = "Ошибка входа. Проверьте данные.";
      
      if (isAxiosError(error)) {
        message =
          error.response?.data?.message ||
          error.response?.data?.errors?.email?.[0] ||
          `Ошибка сервера: ${error.response?.status}`;
      }
      
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Декоративные градиенты */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent-to/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md p-8 bg-surface-1 ring-1 ring-white/[0.06] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] relative z-10">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-black font-bold text-xl">П</span>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Вход в систему</h1>
          <p className="text-text-secondary mt-1 text-sm">Пульт владельца</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-text-secondary">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="bg-surface-2 border-white/[0.06] focus-visible:border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-text-secondary">Пароль</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="bg-surface-2 border-white/[0.06] focus-visible:border-primary"
            />
          </div>
          <Button type="submit" className="w-full h-11 bg-gradient-accent text-black hover:opacity-90 font-medium" disabled={isLoading}>
            {isLoading ? "Загрузка..." : "Войти"}
          </Button>
        </form>
      </div>
    </div>
  );
}
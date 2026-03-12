import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormEvent, useCallback, useMemo } from "react";

export default function LoginPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<"email" | "reset">("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const canSubmitReset = useMemo(() => newPass.length >= 6 && newPass === newPass2, [newPass, newPass2]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({ message: "Falha no login" }));
        toast({ title: "Erro", description: msg.message || "Falha no login", variant: "destructive" });
      } else {
        window.location.assign("/");
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message || "Falha no login", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotEmail = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast({ title: "Erro", description: body?.message || "E-mail não encontrado", variant: "destructive" });
        return;
      }
      setForgotStep("reset");
      toast({ title: "E-mail localizado", description: "Defina sua nova senha." });
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message || "Falha ao verificar e-mail", variant: "destructive" });
    }
  }, [forgotEmail, toast]);

  const handleReset = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmitReset) {
      toast({ title: "Senha inválida", description: "As senhas devem coincidir e ter ao menos 6 caracteres.", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, password: newPass }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast({ title: "Erro", description: body?.message || "Falha ao redefinir senha", variant: "destructive" });
        return;
      }
      toast({ title: "Senha atualizada", description: "Sua senha foi redefinida. Realize o login." });
      setForgotOpen(false);
      setForgotStep("email");
      setNewPass("");
      setNewPass2("");
      setEmail(forgotEmail);
      setPassword("");
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message || "Falha ao redefinir senha", variant: "destructive" });
    }
  }, [forgotEmail, newPass, canSubmitReset, toast]);

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Side - Brand */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center p-12">
        {/* Car Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url('/login-bg.png')` 
          }}
        />
        
        {/* Yellow Overlay */}
        <div className="absolute inset-0 z-10 bg-primary/75" />
        
        <div className="absolute inset-0 z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-30"></div>
        
        <div className="relative z-20 max-w-lg">
          <div className="bg-black/25 backdrop-blur-sm rounded-xl p-6 text-center text-primary-foreground shadow-lg ring-1 ring-black/10">
            <div className="flex flex-col items-center gap-6 mb-6">
              <img src="/logo-vbm.png" alt="VBM Transfer Executivo" className="w-96 h-96 object-contain" />
              <h1 className="text-4xl font-display font-bold tracking-wide drop-shadow-lg">VBM Transfer Executivo</h1>
            </div>
            <h2 className="text-5xl font-display font-bold leading-tight mb-4 drop-shadow-lg">
              Gestão de Frota Premium.
            </h2>
            <p className="text-lg leading-relaxed text-primary-foreground/90">
              Gerencie motoristas, veículos e clientes premium com precisão e elegância. 
              O painel completo para serviços de transporte executivo.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <img src="/logo-vbm.png" alt="VBM Transfer Executivo" className="lg:hidden mx-auto mb-4 w-24 h-24 object-contain" />
            <h2 className="text-3xl font-bold font-display text-primary">Bem-vindo</h2>
            <p className="text-muted-foreground mt-2">Faça login para acessar seu painel.</p>
          </div>

          <Card className="border-none shadow-xl bg-card">
            <CardContent className="pt-6">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-medium shadow-lg hover:shadow-primary/25 transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
                <div className="mt-4 text-center space-y-1">
                  <a href="/register-setup" className="block text-sm text-primary hover:underline">
                    Primeiro Acesso? Cadastre sua senha
                  </a>
                  <Dialog open={forgotOpen} onOpenChange={(v) => { setForgotOpen(v); if (!v) setForgotStep("email"); }}>
                    <DialogTrigger asChild>
                      <button type="button" className="text-sm text-primary hover:underline">Esqueci minha senha</button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Recuperar senha</DialogTitle>
                      </DialogHeader>
                      {forgotStep === "email" ? (
                        <form className="space-y-4" onSubmit={handleForgotEmail}>
                          <div className="space-y-2">
                            <Label htmlFor="forgot-email">E-mail cadastrado</Label>
                            <Input
                              id="forgot-email"
                              type="email"
                              placeholder="seu@email.com"
                              value={forgotEmail}
                              onChange={(e) => setForgotEmail(e.target.value)}
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full">Continuar</Button>
                        </form>
                      ) : (
                        <form className="space-y-4" onSubmit={handleReset}>
                          <div className="space-y-1">
                            <Label>E-mail</Label>
                            <div className="text-sm">{forgotEmail}</div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-pass">Nova senha</Label>
                            <Input id="new-pass" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="mín. 6 caracteres" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-pass2">Confirmar senha</Label>
                            <Input id="new-pass2" type="password" value={newPass2} onChange={(e) => setNewPass2(e.target.value)} />
                          </div>
                          <Button type="submit" disabled={!canSubmitReset} className="w-full">Redefinir senha</Button>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </form>
              <div className="mt-6 text-center text-xs text-muted-foreground">
                <p>Use seu e-mail e senha cadastrados.</p>
                <p>Em caso de dúvida, contate o administrador.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

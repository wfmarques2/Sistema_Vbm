import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormEvent, useCallback, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";
import vbmLogoDarkUrl from "@assets/vbm-logo-1.png?url";
import vbmLogoLightUrl from "@assets/vbm-logo-2.png?url";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const { toast } = useToast();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { language, setLanguage, t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<"email" | "reset">("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const canSubmitReset = useMemo(() => newPass.length >= 6 && newPass === newPass2, [newPass, newPass2]);
  useEffect(() => {
    setMounted(true);
  }, []);
  const currentTheme = mounted ? (resolvedTheme || theme || "light") : "light";
  const desktopLogoUrl = vbmLogoDarkUrl;
  const mobileLogoUrl = currentTheme === "dark" ? vbmLogoDarkUrl : vbmLogoLightUrl;

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
        const msg = await res.json().catch(() => ({ message: t("login.loginErrorDescription") }));
        toast({ title: t("login.loginErrorTitle"), description: msg.message || t("login.loginErrorDescription"), variant: "destructive" });
      } else {
        const userRes = await fetch("/api/auth/user", { credentials: "include" }).catch(() => null);
        if (userRes?.ok) {
          const user = await userRes.json().catch(() => null);
          if (user?.role === "driver") {
            window.location.assign("/agenda");
            return;
          }
        }
        window.location.assign("/");
      }
    } catch (err: any) {
      toast({ title: t("login.loginErrorTitle"), description: err?.message || t("login.loginErrorDescription"), variant: "destructive" });
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
        toast({ title: t("login.loginErrorTitle"), description: body?.message || t("login.forgotCheckEmailError"), variant: "destructive" });
        return;
      }
      setForgotStep("reset");
      toast({ title: t("login.forgotEmailFoundTitle"), description: t("login.forgotEmailFoundDescription") });
    } catch (err: any) {
      toast({ title: t("login.loginErrorTitle"), description: err?.message || t("login.forgotCheckEmailError"), variant: "destructive" });
    }
  }, [forgotEmail, toast, t]);

  const handleReset = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmitReset) {
      toast({ title: t("login.forgotInvalidPasswordTitle"), description: t("login.forgotInvalidPasswordDescription"), variant: "destructive" });
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
        toast({ title: t("login.loginErrorTitle"), description: body?.message || t("login.forgotResetError"), variant: "destructive" });
        return;
      }
      toast({ title: t("login.forgotPasswordUpdatedTitle"), description: t("login.forgotPasswordUpdatedDescription") });
      setForgotOpen(false);
      setForgotStep("email");
      setNewPass("");
      setNewPass2("");
      setEmail(forgotEmail);
      setPassword("");
    } catch (err: any) {
      toast({ title: t("login.loginErrorTitle"), description: err?.message || t("login.forgotResetError"), variant: "destructive" });
    }
  }, [forgotEmail, newPass, canSubmitReset, toast, t]);

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
              <img src={desktopLogoUrl} alt="VBM Transfer Executivo" className="w-96 h-96 object-contain" />
              <h1 className="text-4xl font-display font-bold tracking-wide drop-shadow-lg">VBM Transfer Executivo</h1>
            </div>
            <h2 className="text-5xl font-display font-bold leading-tight mb-4 drop-shadow-lg">
              {t("login.heroTitle")}
            </h2>
            <p className="text-lg leading-relaxed text-primary-foreground/90">
              {t("login.heroSubtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="lg:hidden absolute top-4 right-4 flex items-center gap-2 rounded-lg border border-border/60 bg-card/80 px-3 py-2 backdrop-blur">
          {currentTheme === "dark" ? <Moon className="w-4 h-4 text-muted-foreground" /> : <Sun className="w-4 h-4 text-muted-foreground" />}
          <Switch
            checked={currentTheme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            className="data-[state=checked]:bg-primary"
          />
        </div>
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <img src={mobileLogoUrl} alt="VBM Transfer Executivo" className="lg:hidden mx-auto mb-4 w-24 h-24 object-contain" />
            <h2 className="text-3xl font-bold font-display text-primary">{t("login.welcome")}</h2>
            <p className="text-muted-foreground mt-2">{t("login.subtitle")}</p>
          </div>

          <Card className="border-none shadow-xl bg-card">
            <CardContent className="pt-6">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("login.email")}</Label>
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
                  <Label htmlFor="password">{t("login.password")}</Label>
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
                  {loading ? t("login.entering") : t("login.enter")}
                </Button>
                <div className="mt-4 text-center space-y-1">
                  <a href="/register-setup" className="block text-sm text-primary hover:underline">
                    {t("login.firstAccess")}
                  </a>
                  <Dialog open={forgotOpen} onOpenChange={(v) => { setForgotOpen(v); if (!v) setForgotStep("email"); }}>
                    <DialogTrigger asChild>
                      <button type="button" className="text-sm text-primary hover:underline">{t("login.forgotPassword")}</button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t("login.forgotTitle")}</DialogTitle>
                      </DialogHeader>
                      {forgotStep === "email" ? (
                        <form className="space-y-4" onSubmit={handleForgotEmail}>
                          <div className="space-y-2">
                            <Label htmlFor="forgot-email">{t("login.forgotRegisteredEmail")}</Label>
                            <Input
                              id="forgot-email"
                              type="email"
                              placeholder="seu@email.com"
                              value={forgotEmail}
                              onChange={(e) => setForgotEmail(e.target.value)}
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full">{t("login.forgotContinue")}</Button>
                        </form>
                      ) : (
                        <form className="space-y-4" onSubmit={handleReset}>
                          <div className="space-y-1">
                            <Label>E-mail</Label>
                            <div className="text-sm">{forgotEmail}</div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-pass">{t("login.forgotNewPassword")}</Label>
                            <Input id="new-pass" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder={t("login.forgotMinChars")} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-pass2">{t("login.forgotConfirmPassword")}</Label>
                            <Input id="new-pass2" type="password" value={newPass2} onChange={(e) => setNewPass2(e.target.value)} />
                          </div>
                          <Button type="submit" disabled={!canSubmitReset} className="w-full">{t("login.forgotResetAction")}</Button>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </form>
              <div className="mt-6 text-center text-xs text-muted-foreground">
                <p>{t("login.helpLine1")}</p>
                <p>{t("login.helpLine2")}</p>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-center">
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/80 px-3 py-2 backdrop-blur">
              <Label htmlFor="login-language" className="text-xs">{t("common.language")}</Label>
              <select
                id="login-language"
                className="bg-background border border-border rounded px-2 py-1 text-sm"
                value={language}
                onChange={(e) => setLanguage(e.target.value === "es" ? "es" : "pt-BR")}
              >
                <option value="pt-BR">{t("common.portuguese")}</option>
                <option value="es">{t("common.spanish")}</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

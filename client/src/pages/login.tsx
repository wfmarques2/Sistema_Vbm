import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Side - Brand */}
      <div className="hidden lg:flex w-1/2 bg-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="relative z-10 text-primary-foreground max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-display font-bold tracking-wide">Executive Transfer</h1>
          </div>
          <h2 className="text-5xl font-display font-bold leading-tight mb-6">
            Premium Fleet Management.
          </h2>
          <p className="text-lg opacity-80 leading-relaxed">
            Manage your drivers, vehicles, and premium clients with precision and elegance. 
            The comprehensive dashboard for executive transport services.
          </p>
        </div>
      </div>

      {/* Right Side - Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold font-display text-primary">Welcome Back</h2>
            <p className="text-muted-foreground mt-2">Please sign in to access your dashboard.</p>
          </div>

          <Card className="border-none shadow-xl bg-card">
            <CardContent className="pt-6">
              <Button 
                className="w-full h-12 text-lg font-medium shadow-lg hover:shadow-primary/25 transition-all duration-300" 
                onClick={() => window.location.href = "/api/login"}
              >
                Sign In with Replit
              </Button>
              <div className="mt-6 text-center text-xs text-muted-foreground">
                <p>Secure authentication powered by Replit Auth.</p>
                <p>Access restricted to authorized personnel only.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

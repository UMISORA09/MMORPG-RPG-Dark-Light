import { useState } from 'react';
import { useLocation } from 'wouter';
import { useLogin, useGetMe, getGetMeQueryKey, useGetCharacters, getGetCharactersQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { Swords } from 'lucide-react';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const login = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    login.mutate(
      { data: { username, password } },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          const characters = await queryClient.fetchQuery({ 
            queryKey: getGetCharactersQueryKey(),
            queryFn: async () => {
              const { getCharacters } = await import('@workspace/api-client-react');
              return getCharacters();
            }
          });
          
          if (characters && characters.length > 0) {
            setLocation('/game');
          } else {
            setLocation('/select-class');
          }
        },
        onError: (error: any) => {
          toast({
            variant: 'destructive',
            title: 'Đăng nhập thất bại',
            description: error?.message || 'Tên đăng nhập hoặc mật khẩu không đúng',
          });
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-b from-background via-background to-card px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary via-secondary to-accent mb-6 pulse-glow">
            <Swords className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            CHIẾN LONG BÍ SỬ
          </h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-semibold">
            2.5D Real-time Action MMORPG
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-card border border-card-border rounded-xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground font-medium">
                Tên đăng nhập
              </Label>
              <Input
                id="username"
                data-testid="input-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                className="h-12 bg-muted border-border"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Mật khẩu
              </Label>
              <Input
                id="password"
                data-testid="input-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="h-12 bg-muted border-border"
                required
              />
            </div>

            <Button
              type="submit"
              data-testid="button-login"
              className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold text-base shadow-lg"
              disabled={login.isPending}
            >
              {login.isPending ? 'Đang đăng nhập...' : '🔑 ĐĂNG NHẬP'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Hoặc trải nghiệm ngay</span>
            </div>
          </div>

          <Button
            type="button"
            onClick={async () => {
              const randNum = Math.floor(1000 + Math.random() * 9000);
              const guestUser = `HiepSi_${randNum}`;
              const guestPass = `pass_${randNum}`;
              try {
                const res = await fetch('/api/auth/register', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ username: guestUser, password: guestPass }),
                });
                if (res.ok) {
                  await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
                  toast({
                    title: '⚡ Chào Mừng Đến Với Chiến Long Bí Sử!',
                    description: `Khởi tạo nhân vật khách: ${guestUser}`,
                  });
                  setLocation('/select-class');
                } else {
                  // If username already taken, try simple login
                  login.mutate(
                    { data: { username: guestUser, password: guestPass } },
                    {
                      onSuccess: () => setLocation('/game'),
                    }
                  );
                }
              } catch (e) {
                toast({ variant: 'destructive', title: 'Lỗi khởi tạo khách' });
              }
            }}
            className="w-full h-12 bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-bold text-base shadow-lg shadow-orange-500/25 animate-pulse"
          >
            ⚡ VÀO CHƠI NGAY (QUICK PLAY)
          </Button>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Chưa có tài khoản?{' '}
              <Link 
                href="/register" 
                data-testid="link-register"
                className="text-secondary font-semibold hover:text-secondary/80"
              >
                Đăng ký tài khoản mới
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

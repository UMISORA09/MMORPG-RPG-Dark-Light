import { useState } from 'react';
import { useLocation } from 'wouter';
import { useRegister, getGetMeQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { Swords } from 'lucide-react';

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const register = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username.length < 3 || username.length > 20) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Tên đăng nhập phải từ 3-20 ký tự',
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Mật khẩu phải có ít nhất 6 ký tự',
      });
      return;
    }
    
    register.mutate(
      { data: { username, password } },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({
            title: 'Đăng ký thành công',
            description: 'Chào mừng đến với Chiến Trường!',
          });
          setLocation('/select-class');
        },
        onError: (error: any) => {
          toast({
            variant: 'destructive',
            title: 'Đăng ký thất bại',
            description: error?.message || 'Tên đăng nhập đã tồn tại',
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
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            CHIẾN TRƯỜNG
          </h1>
          <p className="text-muted-foreground text-sm uppercase tracking-wider">
            Dark Fantasy MMORPG
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-card border border-card-border rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-center mb-6 text-foreground">
            Tạo tài khoản mới
          </h2>
          
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
                placeholder="3-20 ký tự"
                className="h-12 bg-muted border-border"
                required
                minLength={3}
                maxLength={20}
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
                placeholder="Ít nhất 6 ký tự"
                className="h-12 bg-muted border-border"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              data-testid="button-register"
              className="w-full h-12 bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-secondary-foreground font-semibold text-base"
              disabled={register.isPending}
            >
              {register.isPending ? 'Đang tạo tài khoản...' : 'ĐĂNG KÝ'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Đã có tài khoản?{' '}
              <Link 
                href="/" 
                data-testid="link-login"
                className="text-primary font-semibold hover:text-primary/80"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

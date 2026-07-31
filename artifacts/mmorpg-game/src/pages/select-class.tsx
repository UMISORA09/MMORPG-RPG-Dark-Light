import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGetClasses, getGetClassesQueryKey, useCreateCharacter, getGetCharactersQueryKey, useGetMe, getGetMeQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ClassSprite } from '@/components/ClassSprite';
import type { CharacterClass } from '@workspace/api-client-react';

export default function SelectClassPage() {
  const [, setLocation] = useLocation();
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(null);
  const [characterName, setCharacterName] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: user, isLoading: userLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: classes, isLoading: classesLoading } = useGetClasses({ query: { queryKey: getGetClassesQueryKey() } });
  const createCharacter = useCreateCharacter();

  useEffect(() => {
    if (!userLoading && !user) {
      setLocation('/');
    }
  }, [user, userLoading, setLocation]);

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClass) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng chọn một lớp nhân vật',
      });
      return;
    }
    
    if (characterName.length < 2 || characterName.length > 20) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Tên nhân vật phải từ 2-20 ký tự',
      });
      return;
    }
    
    createCharacter.mutate(
      { data: { name: characterName, classId: selectedClass.id } },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: getGetCharactersQueryKey() });
          toast({
            title: 'Tạo nhân vật thành công',
            description: `Chào mừng ${characterName} - ${selectedClass.name}!`,
          });
          setLocation('/game');
        },
        onError: (error: any) => {
          toast({
            variant: 'destructive',
            title: 'Tạo nhân vật thất bại',
            description: error?.message || 'Đã có lỗi xảy ra',
          });
        },
      }
    );
  };

  if (classesLoading || userLoading) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-b from-background to-card px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            CHỌN LỚP NHÂN VẬT
          </h1>
          <p className="text-muted-foreground text-sm">
            Chọn lớp nhân vật và bắt đầu hành trình
          </p>
        </div>

        {/* Class Selection */}
        <div className="space-y-3 mb-6">
          {classes?.map((charClass) => (
            <button
              key={charClass.id}
              data-testid={`button-class-${charClass.id}`}
              onClick={() => setSelectedClass(charClass)}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                selectedClass?.id === charClass.id
                  ? 'border-primary bg-primary/10 shadow-lg'
                  : 'border-card-border bg-card hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 flex-shrink-0">
                  <ClassSprite classId={charClass.id} className="w-full h-full" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {charClass.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {charClass.description}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                      HP: {charClass.baseHp}
                    </span>
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                      ATK: {charClass.baseAtk}
                    </span>
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                      DEF: {charClass.baseDef}
                    </span>
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                      SPD: {charClass.baseSpd}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Character Name Input */}
        {selectedClass && (
          <form onSubmit={handleCreateCharacter} className="bg-card border border-card-border rounded-xl p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="characterName" className="text-foreground font-medium">
                Tên nhân vật
              </Label>
              <Input
                id="characterName"
                data-testid="input-character-name"
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Nhập tên nhân vật (2-20 ký tự)"
                className="h-12 bg-muted border-border"
                required
                minLength={2}
                maxLength={20}
              />
            </div>

            <Button
              type="submit"
              data-testid="button-create-character"
              className="w-full h-12 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground font-semibold"
              disabled={createCharacter.isPending}
            >
              {createCharacter.isPending ? 'Đang tạo nhân vật...' : 'TẠO NHÂN VẬT'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ModeratorAuth } from '@/components/layout/moderator-auth';
import { Button } from '@/components/ui/button';

export function AppHeader() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <header className='sticky top-0 z-50 border-b bg-card/60 backdrop-blur'>
      <div className='mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Comments</h1>
          <p className='text-sm text-muted-foreground'>
            SPA with WebSocket, CAPTCHA, and attachments
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setDark((value) => !value)}
            title='Toggle theme'
          >
            {dark ? <Sun /> : <Moon />}
          </Button>
          <ModeratorAuth />
        </div>
      </div>
    </header>
  );
}

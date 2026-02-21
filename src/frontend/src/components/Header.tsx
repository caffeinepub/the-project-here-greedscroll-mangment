import { Wallet, Moon, Sun, Rocket } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onPublish?: () => void;
  isPublishing?: boolean;
}

function Header({ onPublish, isPublishing = false }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-chart-1 to-chart-2">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">XRP Portfolio Monitor</h1>
              <p className="text-sm text-muted-foreground">Real-time XRPL tracking</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onPublish && (
              <Button
                onClick={onPublish}
                disabled={isPublishing}
                className="gap-2"
              >
                {isPublishing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Publish
                  </>
                )}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-full"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;

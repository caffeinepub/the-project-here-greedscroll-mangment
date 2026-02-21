import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TokenList from '@/components/TokenList';
import TokenMetrics from '@/components/TokenMetrics';
import WalletHoldings from '@/components/WalletHoldings';
import TokenConfigDialog from '@/components/TokenConfigDialog';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export type ViewState = 'tokens' | 'metrics' | 'holdings';

export interface Token {
  currency: string;
  issuer: string;
  balance: string;
  limit?: string;
  account?: string;
}

function Dashboard() {
  const [currentView, setCurrentView] = useState<ViewState>('tokens');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
    setCurrentView('metrics');
  };

  const handleWalletSelect = (wallet: string) => {
    setSelectedWallet(wallet);
    setCurrentView('holdings');
  };

  const handleBack = () => {
    if (currentView === 'holdings') {
      setCurrentView('metrics');
      setSelectedWallet(null);
    } else if (currentView === 'metrics') {
      setCurrentView('tokens');
      setSelectedToken(null);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    
    try {
      // Simulate deployment process
      // In a real scenario, this would trigger a deployment pipeline
      // via a webhook, CI/CD system, or backend canister method
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Application published successfully!', {
        description: 'Your changes are now live.',
        duration: 5000,
      });
    } catch (error) {
      toast.error('Publication failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        duration: 5000,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleConfigChange = () => {
    // Trigger refresh of token list when configuration changes
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header 
        onPublish={handlePublish} 
        isPublishing={isPublishing}
        onOpenSettings={() => setConfigDialogOpen(true)}
      />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {currentView !== 'tokens' && (
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-6 -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}

        <Card className="border-border/50 shadow-lg">
          {currentView === 'tokens' && (
            <TokenList 
              onTokenSelect={handleTokenSelect}
              refreshTrigger={refreshTrigger}
            />
          )}
          
          {currentView === 'metrics' && selectedToken && (
            <TokenMetrics 
              token={selectedToken} 
              onWalletSelect={handleWalletSelect}
            />
          )}
          
          {currentView === 'holdings' && selectedWallet && (
            <WalletHoldings 
              walletAddress={selectedWallet}
            />
          )}
        </Card>
      </main>

      <Footer />
      
      <TokenConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        onConfigChange={handleConfigChange}
      />
    </div>
  );
}

export default Dashboard;

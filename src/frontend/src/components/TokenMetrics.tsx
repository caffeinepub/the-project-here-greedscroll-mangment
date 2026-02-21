import { useEffect, useState } from 'react';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Wallet, TrendingUp, Users, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Token } from '@/pages/Dashboard';
import { fetchAccountLines, validateXRPLAddress } from '@/lib/xrpl';

interface TokenMetricsProps {
  token: Token;
  onWalletSelect: (wallet: string) => void;
}

interface WalletHolding {
  address: string;
  name: string;
  balance: string;
}

interface WalletError {
  wallet: string;
  address: string;
  error: string;
}

const WALLETS = [
  { address: 'rdRvw4pKmEtSnz3cjXBL6HLJJmejtkoQ4', name: 'GreedyJEW Issuer' },
  { address: 'rw3DPxgusRrvdsbXSjHdXD14ogkNidTTRx', name: 'Project Dev Wallet' }
];

function TokenMetrics({ token, onWalletSelect }: TokenMetricsProps) {
  const [holdings, setHoldings] = useState<WalletHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletErrors, setWalletErrors] = useState<WalletError[]>([]);

  const loadHoldings = async () => {
    console.log(`[TokenMetrics] Loading holdings for token: ${token.currency} (${token.issuer})`);
    
    try {
      setLoading(true);
      setWalletErrors([]);
      
      const walletHoldings: WalletHolding[] = [];
      const errors: WalletError[] = [];
      
      for (const wallet of WALLETS) {
        if (!validateXRPLAddress(wallet.address)) {
          const errorMsg = `Invalid XRPL address format`;
          console.error(`[TokenMetrics] Invalid address for ${wallet.name}:`, wallet.address);
          errors.push({
            wallet: wallet.name,
            address: wallet.address,
            error: errorMsg
          });
          continue;
        }
        
        console.log(`[TokenMetrics] Checking ${wallet.name} for ${token.currency}`);
        
        try {
          const lines = await fetchAccountLines(wallet.address);
          console.log(`[TokenMetrics] Retrieved ${lines.length} trust lines for ${wallet.name}`);
          
          // In trust lines, the 'account' field is the issuer
          const matchingLine = lines.find(
            line => line.currency === token.currency && line.account === token.issuer
          );
          
          if (matchingLine) {
            console.log(`[TokenMetrics] Found matching line in ${wallet.name}:`, matchingLine);
            walletHoldings.push({
              address: wallet.address,
              name: wallet.name,
              balance: matchingLine.balance
            });
          } else {
            console.log(`[TokenMetrics] No matching line found in ${wallet.name}`);
          }
        } catch (walletError) {
          const errorMsg = walletError instanceof Error ? walletError.message : 'Unknown error';
          console.error(`[TokenMetrics] Failed to fetch data for ${wallet.name}:`, walletError);
          errors.push({
            wallet: wallet.name,
            address: wallet.address,
            error: errorMsg
          });
        }
      }
      
      console.log(`[TokenMetrics] Total holdings found: ${walletHoldings.length}`);
      setHoldings(walletHoldings);
      setWalletErrors(errors);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load holdings';
      console.error('[TokenMetrics] Error loading holdings:', err);
      setWalletErrors([{
        wallet: 'System',
        address: 'N/A',
        error: errorMsg
      }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHoldings();
  }, [token]);

  const totalBalance = holdings.reduce((sum, h) => sum + parseFloat(h.balance), 0);

  if (loading) {
    return (
      <>
        <CardHeader>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </>
    );
  }

  if (walletErrors.length > 0 && holdings.length === 0) {
    return (
      <>
        <CardHeader>
          <CardTitle>{token.currency}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Holdings</AlertTitle>
            <AlertDescription className="space-y-3 mt-2">
              <p className="font-semibold">Failed to load wallet holdings:</p>
              <div className="space-y-2">
                {walletErrors.map((err, idx) => (
                  <div key={idx} className="p-2 bg-destructive/10 rounded border border-destructive/20">
                    <p className="font-semibold text-sm">{err.wallet}: {err.error}</p>
                    <p className="text-xs font-mono mt-1 opacity-70">{err.address}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-destructive/10 rounded-md border border-destructive/20">
                <p className="text-sm font-semibold mb-2">Troubleshooting:</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Verify wallet addresses are valid XRPL addresses</li>
                  <li>Check XRPL server connectivity</li>
                  <li>View browser console (F12) for detailed logs</li>
                </ul>
              </div>
              
              <Button 
                onClick={loadHoldings} 
                variant="outline" 
                size="sm"
                className="mt-3"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Loading
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </>
    );
  }

  return (
    <>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-3xl mb-2">{token.currency}</CardTitle>
            <CardDescription className="font-mono text-xs">
              {token.issuer}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Users className="h-3 w-3 mr-1" />
            {holdings.length} Wallets
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {walletErrors.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Partial Data</AlertTitle>
            <AlertDescription>
              <p className="text-sm mb-2">Some wallets failed to load:</p>
              <ul className="text-xs space-y-1">
                {walletErrors.map((err, idx) => (
                  <li key={idx}>• {err.wallet}: {err.error}</li>
                ))}
              </ul>
              <Button 
                onClick={loadHoldings} 
                variant="outline" 
                size="sm"
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-chart-1/10 to-chart-2/10 border border-chart-1/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            Total Holdings
          </div>
          <p className="text-4xl font-bold">{totalBalance.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Across {holdings.length} wallet{holdings.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
            Wallet Breakdown
          </h3>
          
          {holdings.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No holdings found for this token in the monitored wallets.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {holdings.map((holding, index) => (
                <button
                  key={`${holding.address}-${index}`}
                  onClick={() => onWalletSelect(holding.address)}
                  className="w-full p-4 rounded-lg border border-border/50 hover:border-chart-2 hover:bg-accent/50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Wallet className="h-4 w-4 text-chart-2" />
                        <p className="font-semibold">{holding.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {holding.address}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold">{parseFloat(holding.balance).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {((parseFloat(holding.balance) / totalBalance) * 100).toFixed(1)}% of total
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </>
  );
}

export default TokenMetrics;

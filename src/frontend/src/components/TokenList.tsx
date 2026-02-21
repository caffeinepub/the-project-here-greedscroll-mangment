import { useEffect, useState } from 'react';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingUp, Coins, AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Token } from '@/pages/Dashboard';
import { fetchAccountLines, validateXRPLAddress } from '@/lib/xrpl';
import { loadTokenConfig, isTokenWhitelisted, hexToString } from '@/lib/tokenConfig';

interface TokenListProps {
  onTokenSelect: (token: Token) => void;
  refreshTrigger?: number;
}

const WALLETS = [
  { address: 'rdRvw4pKmEtSnz3cjXBL6HLJJmejtkoQ4', name: 'GreedyJEW Issuer' },
  { address: 'rw3DPxgusRrvdsbXSjHdXD14ogkNidTTRx', name: 'Project Dev Wallet' }
];

interface WalletError {
  wallet: string;
  address: string;
  error: string;
}

function TokenList({ onTokenSelect, refreshTrigger }: TokenListProps) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletErrors, setWalletErrors] = useState<WalletError[]>([]);

  const loadTokens = async () => {
    console.log('[TokenList] ========================================');
    console.log('[TokenList] Starting to load tokens from wallets:', WALLETS);
    
    try {
      setLoading(true);
      setWalletErrors([]);
      
      // Load token whitelist
      const tokenConfig = loadTokenConfig();
      console.log('[TokenList] ========================================');
      console.log('[TokenList] Loaded token whitelist configuration:');
      console.log('[TokenList] Total tokens in whitelist:', tokenConfig.length);
      tokenConfig.forEach((token, idx) => {
        console.log(`[TokenList] Whitelist[${idx}]:`, {
          currency: token.currency,
          issuer: token.issuer,
          customName: token.customName
        });
      });
      console.log('[TokenList] ========================================');
      
      const allTokens: Token[] = [];
      const errors: WalletError[] = [];
      
      // Validate addresses first
      for (const wallet of WALLETS) {
        if (!validateXRPLAddress(wallet.address)) {
          const errorMsg = `Invalid XRPL address format. Address must start with 'r' and be 25-35 characters long.`;
          console.error(`[TokenList] Invalid address for ${wallet.name}:`, wallet.address);
          errors.push({
            wallet: wallet.name,
            address: wallet.address,
            error: errorMsg
          });
        }
      }
      
      // Fetch data from valid addresses
      for (const wallet of WALLETS) {
        if (!validateXRPLAddress(wallet.address)) {
          continue; // Skip invalid addresses
        }
        
        console.log(`[TokenList] ========================================`);
        console.log(`[TokenList] Fetching trust lines for ${wallet.name} (${wallet.address})`);
        
        try {
          const lines = await fetchAccountLines(wallet.address);
          console.log(`[TokenList] Retrieved ${lines.length} trust lines for ${wallet.name}`);
          console.log(`[TokenList] Raw trust line data from XRPL API:`);
          
          // Log each trust line in detail
          lines.forEach((line, idx) => {
            console.log(`[TokenList] Trust Line [${idx}]:`, {
              currency: line.currency,
              currencyType: typeof line.currency,
              currencyLength: line.currency.length,
              isHex: /^[0-9A-F]{40}$/i.test(line.currency),
              account: line.account,
              balance: line.balance,
              limit: line.limit
            });
            
            // Try to decode if it's hex
            if (line.currency.length === 40 && /^[0-9A-F]{40}$/i.test(line.currency)) {
              const decoded = hexToString(line.currency);
              console.log(`[TokenList]   -> Hex decoded: "${decoded}"`);
            }
          });
          
          console.log(`[TokenList] ========================================`);
          console.log(`[TokenList] Starting whitelist filtering for ${wallet.name}...`);
          
          // Filter trust lines based on whitelist
          const filteredLines = lines.filter(line => {
            const currencyToCheck = line.currency;
            const issuerToCheck = line.account;
            
            console.log(`[TokenList] Checking trust line:`, {
              currency: currencyToCheck,
              issuer: issuerToCheck
            });
            
            const isWhitelisted = isTokenWhitelisted(currencyToCheck, issuerToCheck);
            
            console.log(`[TokenList]   -> Whitelisted: ${isWhitelisted}`);
            
            if (!isWhitelisted) {
              console.log(`[TokenList]   -> FILTERED OUT (not in whitelist)`);
            } else {
              console.log(`[TokenList]   -> ✓ MATCHED - Including in results`);
            }
            
            return isWhitelisted;
          });
          
          console.log(`[TokenList] ========================================`);
          console.log(`[TokenList] Filtering complete for ${wallet.name}:`);
          console.log(`[TokenList]   Total trust lines: ${lines.length}`);
          console.log(`[TokenList]   Whitelisted tokens: ${filteredLines.length}`);
          
          const tokensWithAccount: Token[] = filteredLines.map(line => {
            // Decode hex currency codes for display
            let displayCurrency = line.currency;
            if (line.currency.length === 40 && /^[0-9A-F]{40}$/i.test(line.currency)) {
              displayCurrency = hexToString(line.currency);
            }
            
            return {
              currency: displayCurrency,
              issuer: line.account, // The 'account' field in trust line is the issuer
              balance: line.balance,
              limit: line.limit,
              account: wallet.name
            };
          });
          
          allTokens.push(...tokensWithAccount);
        } catch (walletError) {
          const errorMsg = walletError instanceof Error ? walletError.message : 'Unknown error';
          console.error(`[TokenList] Failed to fetch data for ${wallet.name}:`, walletError);
          errors.push({
            wallet: wallet.name,
            address: wallet.address,
            error: errorMsg
          });
        }
      }
      
      console.log(`[TokenList] ========================================`);
      console.log(`[TokenList] FINAL RESULTS:`);
      console.log(`[TokenList] Total whitelisted tokens loaded: ${allTokens.length}`);
      console.log(`[TokenList] Errors encountered: ${errors.length}`);
      console.log(`[TokenList] ========================================`);
      
      setTokens(allTokens);
      setWalletErrors(errors);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load tokens';
      console.error('[TokenList] Error loading tokens:', err);
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
    loadTokens();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Token Portfolio
          </CardTitle>
          <CardDescription>Loading your XRPL tokens...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </>
    );
  }

  if (walletErrors.length > 0 && tokens.length === 0) {
    return (
      <>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Token Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Tokens</AlertTitle>
            <AlertDescription className="space-y-3 mt-2">
              <p className="font-semibold">Failed to load wallet data:</p>
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
                  <li>Check that wallet addresses are valid XRPL addresses (start with 'r', 25-35 characters)</li>
                  <li>Verify the XRPL server is accessible</li>
                  <li>Open browser console (F12) for detailed error logs</li>
                </ul>
              </div>
              
              <Button 
                onClick={loadTokens} 
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
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Token Portfolio
        </CardTitle>
        <CardDescription>
          {tokens.length > 0 ? (
            <>
              Tracking {tokens.length} token{tokens.length !== 1 ? 's' : ''} across {WALLETS.length} wallets
              {walletErrors.length > 0 && (
                <span className="text-destructive ml-2">
                  ({walletErrors.length} wallet{walletErrors.length > 1 ? 's' : ''} failed)
                </span>
              )}
            </>
          ) : (
            'No whitelisted tokens found'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {walletErrors.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Partial Data Load</AlertTitle>
            <AlertDescription>
              <p className="mb-2">Some wallets failed to load:</p>
              <ul className="text-sm space-y-1">
                {walletErrors.map((err, idx) => (
                  <li key={idx} className="font-mono text-xs">
                    • {err.wallet}: {err.error}
                  </li>
                ))}
              </ul>
              <Button 
                onClick={loadTokens} 
                variant="outline" 
                size="sm"
                className="mt-3"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {tokens.length === 0 && walletErrors.length === 0 && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No Whitelisted Tokens Found</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                The monitored wallets don't have any trust lines matching your configured tokens.
              </p>
              <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                <p className="font-semibold mb-2">What to do:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Click the Settings button in the header to manage your token whitelist</li>
                  <li>Add the currency codes and issuer addresses of tokens you want to monitor</li>
                  <li>Make sure the tokens have trust lines set up in the monitored wallets</li>
                  <li>Check the browser console (F12) for detailed debugging information</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-3">
          {tokens.map((token, index) => (
            <button
              key={`${token.currency}-${token.issuer}-${index}`}
              onClick={() => onTokenSelect(token)}
              className="w-full p-4 rounded-lg border border-border/50 hover:border-chart-1 hover:bg-accent/50 transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg group-hover:text-chart-1 transition-colors">
                      {token.currency}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {token.account}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono truncate">
                    {token.issuer}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-xl font-bold">{parseFloat(token.balance).toFixed(2)}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    View Details
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </>
  );
}

export default TokenList;

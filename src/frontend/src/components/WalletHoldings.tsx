import { useEffect, useState } from 'react';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Wallet, Image, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { fetchAccountInfo, fetchAccountLines, fetchAccountNFTs, validateXRPLAddress, type AccountInfo, type TrustLine, type NFToken } from '@/lib/xrpl';

interface WalletHoldingsProps {
  walletAddress: string;
}

// Helper function to get wallet label
function getWalletLabel(address: string): string {
  const walletMap: Record<string, string> = {
    'rdRvw4pKmEtSnz3cjXBL6HLJJmejtkoQ4': 'GreedyJEW Issuer',
    'rw3DPxgusRrvdsbXSjHdXD14ogkNidTTRx': 'Project Dev Wallet'
  };
  
  return walletMap[address] || address;
}

function WalletHoldings({ walletAddress }: WalletHoldingsProps) {
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [trustLines, setTrustLines] = useState<TrustLine[]>([]);
  const [nfts, setNfts] = useState<NFToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const loadWalletData = async () => {
    console.log(`[WalletHoldings] Loading data for wallet: ${walletAddress}`);
    
    if (!validateXRPLAddress(walletAddress)) {
      const errorMsg = `Invalid XRPL address: "${walletAddress}". Valid addresses start with 'r' and are 25-35 characters long.`;
      console.error(`[WalletHoldings]`, errorMsg);
      setError(errorMsg);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[WalletHoldings] Fetching account info...`);
      const info = await fetchAccountInfo(walletAddress);
      setAccountInfo(info);
      console.log(`[WalletHoldings] Account info loaded`);
      
      console.log(`[WalletHoldings] Fetching trust lines...`);
      const lines = await fetchAccountLines(walletAddress);
      setTrustLines(lines);
      console.log(`[WalletHoldings] Trust lines loaded: ${lines.length}`);
      
      console.log(`[WalletHoldings] Fetching NFTs...`);
      const nftList = await fetchAccountNFTs(walletAddress);
      setNfts(nftList);
      console.log(`[WalletHoldings] NFTs loaded: ${nftList.length}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load wallet data';
      console.error('[WalletHoldings] Error loading wallet data:', err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, [walletAddress]);

  const walletLabel = getWalletLabel(walletAddress);

  if (loading) {
    return (
      <>
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </>
    );
  }

  if (error) {
    return (
      <>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Holdings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Wallet</AlertTitle>
            <AlertDescription className="space-y-3 mt-2">
              <p>{error}</p>
              <div className="text-sm bg-destructive/10 p-3 rounded space-y-1">
                <p className="font-semibold">{walletLabel}</p>
                <p className="font-mono text-xs">{walletAddress}</p>
              </div>
              
              <div className="mt-4 p-3 bg-destructive/10 rounded-md border border-destructive/20">
                <p className="text-sm font-semibold mb-2">Troubleshooting:</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Verify the wallet address is a valid XRPL address (starts with 'r', 25-35 characters)</li>
                  <li>Check that the XRPL server is accessible</li>
                  <li>Open browser console (F12) for detailed error logs</li>
                </ul>
              </div>
              
              <Button 
                onClick={loadWalletData} 
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

  const xrpBalance = accountInfo ? (parseInt(accountInfo.Balance) / 1_000_000).toFixed(2) : '0.00';

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          {walletLabel}
        </CardTitle>
        <CardDescription className="font-mono text-xs break-all">
          {walletAddress}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="nfts">
              NFTs
              {nfts.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {nfts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-chart-1/10 to-chart-2/10 border border-chart-1/20">
              <p className="text-sm text-muted-foreground mb-1">XRP Balance</p>
              <p className="text-3xl font-bold">{xrpBalance} XRP</p>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                Token Holdings ({trustLines.length})
              </h3>
              
              {trustLines.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No token trust lines found for this wallet.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {trustLines.map((line, index) => (
                    <div
                      key={`${line.currency}-${line.account}-${index}`}
                      className="p-3 rounded-lg border border-border/50 hover:border-chart-1/50 hover:bg-accent/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{line.currency}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {line.account}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{parseFloat(line.balance).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            Limit: {parseFloat(line.limit).toFixed(0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="nfts" className="space-y-4">
            {nfts.length === 0 ? (
              <Alert>
                <Image className="h-4 w-4" />
                <AlertTitle>No NFTs Found</AlertTitle>
                <AlertDescription>
                  This wallet doesn't currently hold any NFTs.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {nfts.map((nft) => (
                  <div
                    key={nft.NFTokenID}
                    className="p-4 rounded-lg border border-border/50 hover:border-chart-2/50 hover:bg-accent/30 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Image className="h-4 w-4 text-chart-2" />
                      <p className="font-semibold text-sm">NFT #{nft.nft_serial}</p>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono break-all mb-2">
                      {nft.NFTokenID}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Taxon: {nft.NFTokenTaxon}</span>
                      <Badge variant="outline" className="text-xs">
                        Flags: {nft.Flags}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </>
  );
}

export default WalletHoldings;

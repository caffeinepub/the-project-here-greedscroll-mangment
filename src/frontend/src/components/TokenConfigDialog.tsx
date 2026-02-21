import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pencil, Trash2, Plus, AlertCircle, Save, X } from 'lucide-react';
import {
  loadTokenConfig,
  addToken,
  removeToken,
  updateToken,
  TokenConfig,
} from '@/lib/tokenConfig';
import { toast } from 'sonner';

interface TokenConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigChange?: () => void;
}

function TokenConfigDialog({ open, onOpenChange, onConfigChange }: TokenConfigDialogProps) {
  const [tokens, setTokens] = useState<TokenConfig[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<TokenConfig>({
    currency: '',
    issuer: '',
    customName: '',
  });
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (open) {
      loadTokens();
    }
  }, [open]);

  const loadTokens = () => {
    const config = loadTokenConfig();
    setTokens(config);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingIndex(null);
    setFormData({ currency: '', issuer: '', customName: '' });
    setError('');
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setIsAdding(false);
    setFormData({ ...tokens[index] });
    setError('');
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingIndex(null);
    setFormData({ currency: '', issuer: '', customName: '' });
    setError('');
  };

  const handleSave = () => {
    try {
      setError('');

      if (!formData.currency.trim()) {
        setError('Currency code is required');
        return;
      }

      if (!formData.issuer.trim()) {
        setError('Issuer address is required');
        return;
      }

      if (editingIndex !== null) {
        // Update existing token
        const oldToken = tokens[editingIndex];
        updateToken(oldToken.currency, oldToken.issuer, formData);
        toast.success('Token updated successfully');
      } else {
        // Add new token
        addToken(formData);
        toast.success('Token added successfully');
      }

      loadTokens();
      handleCancel();
      onConfigChange?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save token';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDelete = (currency: string, issuer: string) => {
    try {
      removeToken(currency, issuer);
      loadTokens();
      toast.success('Token removed successfully');
      onConfigChange?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to remove token';
      toast.error(errorMsg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Token Configuration</DialogTitle>
          <DialogDescription>
            Manage which tokens to monitor on your dashboard. Only whitelisted tokens will be displayed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Add/Edit Form */}
          {(isAdding || editingIndex !== null) && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
              <h3 className="font-semibold text-sm">
                {editingIndex !== null ? 'Edit Token' : 'Add New Token'}
              </h3>
              
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency Code *</Label>
                  <Input
                    id="currency"
                    placeholder="e.g., GreedyJEW"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="issuer">Issuer Address *</Label>
                  <Input
                    id="issuer"
                    placeholder="e.g., rdRvw4pKmEtSnz3cjXBL6HLJJmejtkoQ4"
                    value={formData.issuer}
                    onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="customName">Custom Name (Optional)</Label>
                  <Input
                    id="customName"
                    placeholder="e.g., GreedyJEW Token"
                    value={formData.customName || ''}
                    onChange={(e) => setFormData({ ...formData, customName: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Token List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Monitored Tokens ({tokens.length})</h3>
              {!isAdding && editingIndex === null && (
                <Button onClick={handleAdd} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Token
                </Button>
              )}
            </div>

            {tokens.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No tokens configured. Add tokens to start monitoring them on your dashboard.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Currency</TableHead>
                      <TableHead>Issuer Address</TableHead>
                      <TableHead>Custom Name</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokens.map((token, index) => (
                      <TableRow key={`${token.currency}-${token.issuer}`}>
                        <TableCell className="font-medium">{token.currency}</TableCell>
                        <TableCell className="font-mono text-xs">{token.issuer}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {token.customName || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(index)}
                              disabled={isAdding || editingIndex !== null}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(token.currency, token.issuer)}
                              disabled={isAdding || editingIndex !== null}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TokenConfigDialog;

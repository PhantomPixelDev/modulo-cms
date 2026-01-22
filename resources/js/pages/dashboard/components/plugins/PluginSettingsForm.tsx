import { useState } from 'react';
import { router } from '@inertiajs/react';
import { 
  Save, 
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminToast } from '@/components/admin/AdminToastProvider';
import { ROUTE } from '../../routes';

interface Plugin {
  id: number;
  name: string;
  slug: string;
  version: string;
  description: string | null;
  settings: Record<string, any> | null;
  is_active: boolean;
}

interface PluginSettingsFormProps {
  plugin: Plugin;
  canEdit: boolean;
}

export function PluginSettingsForm({ plugin, canEdit }: PluginSettingsFormProps) {
  const { success: showSuccess, error: showError } = useAdminToast();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, any>>(plugin.settings || {});

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    if (!canEdit) return;
    setSaving(true);

    router.put(ROUTE.plugins.updateSettings(plugin.slug), { settings }, {
      preserveScroll: true,
      onSuccess: () => {
        showSuccess('Plugin settings updated successfully');
        setSaving(false);
      },
      onError: () => {
        showError('Failed to update plugin settings');
        setSaving(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8" 
          onClick={() => router.visit(ROUTE.plugins.index())}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">{plugin.name} Settings</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Manage specific settings for the {plugin.name} plugin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* This is a dynamic placeholder. In a real world scenario, 
                  plugins might define their own setting schemas. 
                  For now, we'll provide a simple key-value editor or 
                  a placeholder if no settings are defined. */}
              {Object.keys(settings).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center border-2 border-dashed rounded-lg">
                  <Cpu className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">This plugin has no configurable settings.</p>
                </div>
              ) : (
                Object.entries(settings).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="capitalize">{key.replace(/_/g, ' ')}</Label>
                    <Input 
                      id={key}
                      value={typeof value === 'string' ? value : JSON.stringify(value)}
                      onChange={(e) => handleChange(key, e.target.value)}
                      disabled={!canEdit}
                    />
                  </div>
                ))
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button 
                onClick={handleSave} 
                disabled={saving || !canEdit || Object.keys(settings).length === 0}
                className="gap-2"
              >
                {saving ? 'Saving...' : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plugin Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Version</span>
                <span className="font-medium">{plugin.version}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-medium ${plugin.is_active ? 'text-green-600' : 'text-yellow-600'}`}>
                  {plugin.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Slug</span>
                <code className="text-xs bg-muted px-1 rounded">{plugin.slug}</code>
              </div>
            </CardContent>
          </Card>

          {!plugin.is_active && (
            <Card className="bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/20">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Plugin Inactive</p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-500">
                      Settings may not take effect until the plugin is activated.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

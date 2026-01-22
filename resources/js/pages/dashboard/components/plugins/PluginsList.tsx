import { router } from '@inertiajs/react';
import { 
  Plus, 
  Settings, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  Package,
  User,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAdminToast } from '@/components/admin/AdminToastProvider';
import { ROUTE } from '../../routes';

interface Plugin {
  id: number;
  name: string;
  slug: string;
  version: string;
  description: string | null;
  author: string | null;
  is_active: boolean;
  settings: any;
  installed_at: string | null;
}

interface PluginsListProps {
  plugins: Plugin[];
  canEdit: boolean;
}

export function PluginsList({ plugins = [], canEdit }: PluginsListProps) {
  const { success: showSuccess, error: showError } = useAdminToast();

  const togglePlugin = (slug: string, isActive: boolean) => {
    if (!canEdit) return;

    const route = isActive 
      ? ROUTE.plugins.deactivate(slug) 
      : ROUTE.plugins.activate(slug);

    router.post(route, {}, {
      preserveScroll: true,
      onSuccess: () => {
        showSuccess(`Plugin ${isActive ? 'deactivated' : 'activated'} successfully`);
      },
      onError: () => {
        showError(`Failed to ${isActive ? 'deactivate' : 'activate'} plugin`);
      }
    });
  };

  const uninstallPlugin = (slug: string, name: string) => {
    if (!canEdit || !confirm(`Are you sure you want to uninstall "${name}"? This will remove all its settings from the database.`)) return;

    router.delete(ROUTE.plugins.destroy(slug), {
      preserveScroll: true,
      onSuccess: () => {
        showSuccess(`Plugin "${name}" uninstalled successfully`);
      },
      onError: () => {
        showError(`Failed to uninstall plugin "${name}"`);
      }
    });
  };

  if (plugins.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <Package className="h-10 w-10 text-muted-foreground mb-4" />
          <CardTitle className="mb-2">No plugins found</CardTitle>
          <CardDescription>
            Plugins allow you to extend the functionality of your CMS.
            Drop a plugin into the <code>plugins/</code> directory to get started.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {plugins.map((plugin) => (
        <Card key={plugin.slug} className={`flex flex-col ${plugin.is_active ? 'border-primary/20 bg-primary/5' : ''}`}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {plugin.name}
                  {plugin.is_active && (
                    <Badge variant="default" className="bg-primary/20 text-primary border-none text-[10px] h-4">
                      Active
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs flex items-center gap-1.5">
                  <span className="font-medium text-foreground/70">v{plugin.version}</span>
                  {plugin.author && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {plugin.author}
                      </span>
                    </>
                  )}
                </CardDescription>
              </div>
              <Switch 
                checked={plugin.is_active}
                onCheckedChange={() => togglePlugin(plugin.slug, plugin.is_active)}
                disabled={!canEdit}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-grow pb-4">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {plugin.description || 'No description provided.'}
            </p>
          </CardContent>
          <CardFooter className="pt-0 flex justify-between gap-2">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs gap-1.5" 
                disabled={!plugin.is_active}
                onClick={() => router.visit(ROUTE.plugins.settings(plugin.slug))}
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive" 
                onClick={() => uninstallPlugin(plugin.slug, plugin.name)}
                disabled={!canEdit}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Uninstall
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground">
              <Info className="h-3.5 w-3.5 mr-1" />
              Details
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

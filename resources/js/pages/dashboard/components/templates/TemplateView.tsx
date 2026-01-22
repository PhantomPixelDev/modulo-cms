import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function TemplateView({ template }: { template: any }) {
  if (!template) return null;

  return (
    <div className="space-y-4">
      <Card className="border-border/60 shadow-none">
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base font-semibold text-foreground/90">{template.name}</CardTitle>
            <Badge variant="outline" className="text-xs">{template.type}</Badge>
            {template.is_default ? <Badge variant="secondary" className="text-xs">Default</Badge> : null}
            {template.is_active ? <Badge className="text-xs">Active</Badge> : <Badge variant="outline" className="text-xs">Inactive</Badge>}
          </div>
          {template.description ? <p className="text-sm text-muted-foreground">{template.description}</p> : null}
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground/70">Slug:</span> {template.slug}
          </div>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap rounded-md border border-border/60 bg-muted/30 p-3 text-xs leading-relaxed">
            {template.content}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

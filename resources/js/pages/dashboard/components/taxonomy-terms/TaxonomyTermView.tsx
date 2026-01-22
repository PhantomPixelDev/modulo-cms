import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function TaxonomyTermView({ term }: { term: any }) {
  if (!term) return null;

  const taxonomyLabel = term.taxonomy?.label ?? term.taxonomy?.name ?? '';

  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base font-semibold text-foreground/90">{term.name}</CardTitle>
          {taxonomyLabel ? <Badge variant="outline" className="text-xs">{taxonomyLabel}</Badge> : null}
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">Slug:</span> {term.slug}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {term.description ? <p className="text-sm text-muted-foreground">{term.description}</p> : null}
        {(term.meta_title || term.meta_description) ? (
          <div className="space-y-1">
            {term.meta_title ? <div className="text-xs"><span className="font-medium">Meta title:</span> {term.meta_title}</div> : null}
            {term.meta_description ? <div className="text-xs"><span className="font-medium">Meta description:</span> {term.meta_description}</div> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

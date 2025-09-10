import { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Term } from './types';

interface PostTaxonomySectionProps {
  groupedTerms: Record<string, Term[]>;
  selectedTerms: number[];
  onTermToggle: (termId: number) => void;
}

export function PostTaxonomySection({
  groupedTerms,
  selectedTerms,
  onTermToggle,
}: PostTaxonomySectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTaxonomies, setExpandedTaxonomies] = useState<string[]>([]);

  const filteredGroupedTerms = useMemo(() => {
    if (!searchTerm) return groupedTerms;
    
    const searchLower = searchTerm.toLowerCase();
    const result: Record<string, Term[]> = {};
    
    Object.entries(groupedTerms).forEach(([taxonomy, terms]) => {
      const filteredTerms = terms.filter(term => 
        term.name.toLowerCase().includes(searchLower) ||
        term.slug?.toLowerCase().includes(searchLower)
      );
      
      if (filteredTerms.length > 0) {
        result[taxonomy] = filteredTerms;
        if (!expandedTaxonomies.includes(taxonomy)) {
          setExpandedTaxonomies(prev => [...prev, taxonomy]);
        }
      }
    });
    
    return result;
  }, [groupedTerms, searchTerm, expandedTaxonomies]);

  const toggleTaxonomy = (taxonomy: string) => {
    setExpandedTaxonomies(prev => 
      prev.includes(taxonomy)
        ? prev.filter(t => t !== taxonomy)
        : [...prev, taxonomy]
    );
  };

  if (Object.keys(groupedTerms).length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Categories & Tags</h3>
        <div className="w-64">
          <Input
            type="search"
            placeholder="Search categories & tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8"
          />
        </div>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto pr-4 space-y-4">
        {Object.entries(filteredGroupedTerms).map(([taxonomy, terms]) => (
          <div key={taxonomy} className="space-y-2 border-b pb-4 last:border-b-0">
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-accent/50 p-2 rounded-md"
              onClick={() => toggleTaxonomy(taxonomy)}
            >
              <Label className="font-medium capitalize">
                {taxonomy} <span className="text-muted-foreground text-sm">({terms.length})</span>
              </Label>
              <span className="text-sm text-muted-foreground">
                {expandedTaxonomies.includes(taxonomy) ? '▼' : '▶'}
              </span>
            </div>
            
            {expandedTaxonomies.includes(taxonomy) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pl-4 mt-2">
                {terms.map((term) => (
                  <div key={term.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`term-${term.id}`}
                      checked={selectedTerms.includes(term.id)}
                      onCheckedChange={() => onTermToggle(term.id)}
                    />
                    <Label htmlFor={`term-${term.id}`} className="text-sm font-normal">
                      {term.name} 
                      {term.count && (
                        <span className="text-muted-foreground text-xs ml-1">({term.count})</span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PostTaxonomySection;

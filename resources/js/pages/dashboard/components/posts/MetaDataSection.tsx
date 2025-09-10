import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

interface MetaDataSectionProps {
  metaData: Record<string, any>;
  onMetaDataChange: (data: Record<string, any>) => void;
}

export function MetaDataSection({ metaData, onMetaDataChange }: MetaDataSectionProps) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (newKey.trim()) {
      onMetaDataChange({ ...metaData, [newKey.trim()]: newValue });
      setNewKey('');
      setNewValue('');
    }
  };

  const handleRemove = (key: string) => {
    const newMeta = { ...metaData };
    delete newMeta[key];
    onMetaDataChange(newMeta);
  };

  const handleUpdate = (oldKey: string, newKey: string, value: string) => {
    const newMeta = { ...metaData };
    if (oldKey !== newKey) {
      delete newMeta[oldKey];
    }
    newMeta[newKey] = value;
    onMetaDataChange(newMeta);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Metadata</h3>
      <div className="space-y-2">
        {Object.entries(metaData).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <Input
              value={key}
              onChange={(e) => handleUpdate(key, e.target.value, String(metaData[key]))}
              className="flex-1"
            />
            <Input
              value={String(value)}
              onChange={(e) => handleUpdate(key, key, e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(key)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Key"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          className="flex-1"
        />
        <Input
          placeholder="Value"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button type="button" onClick={handleAdd}>
          Add
        </Button>
      </div>
    </div>
  );
}

export default MetaDataSection;

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Type, Layout, Menu, Columns, Save, RotateCcw } from 'lucide-react';

interface ThemeCustomizerFormProps {
  theme: any;
  settings: Record<string, any>;
  values?: Record<string, any>;
  availableMenus?: Record<string, any>;
  widgetAreas?: Record<string, any>;
  initial?: Record<string, any>;
  onSave: (data: Record<string, any>) => Promise<void> | void;
}

const sectionIcons: Record<string, any> = {
  colors: Palette,
  typography: Type,
  layout: Layout,
  menus: Menu,
};

const sectionLabels: Record<string, string> = {
  colors: 'Colors',
  typography: 'Typography',
  layout: 'Layout',
  menus: 'Menus',
};

export function ThemeCustomizerForm({
  theme,
  settings,
  values = {},
  availableMenus = {},
  widgetAreas = {},
  initial = {},
  onSave,
}: ThemeCustomizerFormProps) {
  const t = theme || {};
  const sections = Object.entries(settings || {});

  const toDisplayValue = (val: any) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') {
      try {
        return JSON.stringify(val);
      } catch (e) {
        return '';
      }
    }
    return String(val);
  };

  const [formValues, setFormValues] = useState<Record<string, any>>(() => {
    // Initialize with merged values (saved values take precedence)
    const merged: Record<string, any> = {};
    for (const [sectionKey, sectionSettings] of sections) {
      if (typeof sectionSettings === 'object' && sectionSettings !== null) {
        for (const [settingKey, settingConfig] of Object.entries(sectionSettings as Record<string, any>)) {
          const flatKey = `${sectionKey}.${settingKey}`;

          const candidate = values[sectionKey]?.[settingKey];
          const looksLikeSchema = candidate && typeof candidate === 'object' && (candidate.label || candidate.type || candidate.default !== undefined);

          // Prefer saved value if present and not the schema object itself
          if (candidate !== undefined && !looksLikeSchema) {
            merged[flatKey] = toDisplayValue(candidate);
          } else if (initial[flatKey] !== undefined && !(typeof initial[flatKey] === 'object' && (initial[flatKey] as any)?.label)) {
            merged[flatKey] = toDisplayValue(initial[flatKey]);
          } else if (typeof settingConfig === 'object' && settingConfig?.default !== undefined) {
            merged[flatKey] = toDisplayValue(settingConfig.default);
          } else {
            merged[flatKey] = '';
          }
        }
      }
    }
    return merged;
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (key: string, value: any) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formValues);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const defaults: Record<string, any> = {};
    for (const [sectionKey, sectionSettings] of sections) {
      if (typeof sectionSettings === 'object' && sectionSettings !== null) {
        for (const [settingKey, settingConfig] of Object.entries(sectionSettings as Record<string, any>)) {
          const flatKey = `${sectionKey}.${settingKey}`;
          if (typeof settingConfig === 'object' && settingConfig?.default !== undefined) {
            defaults[flatKey] = settingConfig.default;
          }
        }
      }
    }
    setFormValues(defaults);
  };

  const renderSettingInput = (sectionKey: string, settingKey: string, config: any) => {
    const flatKey = `${sectionKey}.${settingKey}`;
    const value = (formValues[flatKey] ?? config?.default ?? '') || '';
    const type = config?.type || 'text';
    const label = config?.label || settingKey;
    const options = config?.options;

    return (
      <div key={flatKey} className="space-y-2">
        <Label htmlFor={flatKey} className="text-sm font-medium">
          {label}
        </Label>
        
        {type === 'color' ? (
          <div className="flex items-center gap-3">
            <div 
              className="h-10 w-10 rounded-lg border-2 border-border shadow-sm cursor-pointer overflow-hidden"
              style={{ backgroundColor: value }}
            >
              <input
                id={flatKey}
                type="color"
                value={value}
                onChange={(e) => handleChange(flatKey, e.target.value)}
                className="h-full w-full opacity-0 cursor-pointer"
              />
            </div>
            <Input
              type="text"
              value={value}
              onChange={(e) => handleChange(flatKey, e.target.value)}
              placeholder="#000000"
              className="flex-1 font-mono text-sm"
            />
          </div>
        ) : type === 'select' && options ? (
          <Select value={value} onValueChange={(v) => handleChange(flatKey, v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt: any) => (
                <SelectItem key={opt.value || opt} value={opt.value || opt}>
                  {opt.label || opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={flatKey}
            type={type}
            value={value}
            onChange={(e) => handleChange(flatKey, e.target.value)}
            placeholder={config?.placeholder}
          />
        )}
        
        {config?.description && (
          <p className="text-xs text-muted-foreground">{config.description}</p>
        )}
      </div>
    );
  };

  if (sections.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Palette className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No customizer settings defined by this theme.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Theme Info Header */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Palette className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t.name || t.slug}</h3>
                <p className="text-sm text-muted-foreground">v{t.version || '1.0.0'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button type="submit" size="sm" disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customizer Sections */}
      <Card>
        <Tabs defaultValue={sections[0]?.[0] || 'colors'} className="w-full">
          <CardHeader className="pb-0">
            <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-transparent p-0">
              {sections.map(([sectionKey]) => {
                const Icon = sectionIcons[sectionKey] || Columns;
                const label = sectionLabels[sectionKey] || sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1);
                return (
                  <TabsTrigger
                    key={sectionKey}
                    value={sectionKey}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </CardHeader>
          
          <CardContent className="pt-6">
            {sections.map(([sectionKey, sectionSettings]) => (
              <TabsContent key={sectionKey} value={sectionKey} className="mt-0 space-y-6">
                {typeof sectionSettings === 'object' && sectionSettings !== null ? (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {Object.entries(sectionSettings as Record<string, any>).map(([settingKey, settingConfig]) => (
                      renderSettingInput(sectionKey, settingKey, settingConfig)
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No settings in this section.</p>
                )}
              </TabsContent>
            ))}
          </CardContent>
        </Tabs>
      </Card>

      {/* Theme Features */}
      {((availableMenus && Object.keys(availableMenus).length > 0) || (widgetAreas && Object.keys(widgetAreas).length > 0)) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {availableMenus && Object.keys(availableMenus).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Menu className="h-4 w-4" />
                  Menu Locations
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {Object.entries(availableMenus).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                      <span className="font-medium">{key}</span>
                      <span className="text-muted-foreground">{String(label)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {widgetAreas && Object.keys(widgetAreas).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Columns className="h-4 w-4" />
                  Widget Areas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {Object.entries(widgetAreas).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                      <span className="font-medium">{key}</span>
                      <span className="text-muted-foreground">{String(label)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </form>
  );
}

interface ThemeCustomizerFormProps {
  theme: any;
  settings: Record<string, any>;
  availableMenus?: Record<string, any>;
  widgetAreas?: Record<string, any>;
  initial?: Record<string, any>;
  onSave: (data: Record<string, any>) => Promise<void> | void;
}

export function ThemeCustomizerForm({
  theme,
  settings,
  availableMenus = {},
  widgetAreas = {},
  initial = {},
  onSave,
}: ThemeCustomizerFormProps) {
  const t = theme || {};
  const entries = Object.entries(settings || {});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data: Record<string, any> = {};
    for (const [k, v] of form.entries()) {
      data[k] = v as any;
    }
    await onSave(data);
  };

  return (
    <div className="space-y-8">
      <div className="border rounded-md p-4">
        <div className="font-semibold mb-2">{t.name || t.slug}</div>
        <div className="text-xs text-muted-foreground">Slug: {t.slug}</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {entries.length === 0 && (
            <div className="text-sm text-muted-foreground">No customizer settings defined by this theme.</div>
          )}
          {entries.map(([key, raw]) => {
            const v: any = raw as any;
            const value = (initial && key in initial) ? initial[key] : (v && v.default !== undefined ? v.default : (typeof v === 'string' ? v : ''));
            const type = (v && v.type) ? String(v.type) : (typeof value === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value) ? 'color' : 'text');
            const label = (v && v.label) ? String(v.label) : key;
            const options = (v && Array.isArray(v.options)) ? v.options : undefined;
            return (
              <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <label htmlFor={`cz_${key}`} className="text-sm font-medium">{label}</label>
                <div className="md:col-span-2">
                  {options ? (
                    <select id={`cz_${key}`} name={key} defaultValue={String(value)} className="w-full border border-gray-600 bg-gray-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {options.map((opt: any) => (
                        <option key={String(opt?.value ?? opt)} value={String(opt?.value ?? opt)}>{String(opt?.label ?? opt)}</option>
                      ))}
                    </select>
                  ) : type === 'color' ? (
                    <input id={`cz_${key}`} name={key} defaultValue={String(value)} type="color" className="h-9 w-16 p-1 border rounded" />
                  ) : type === 'textarea' ? (
                    <textarea id={`cz_${key}`} name={key} defaultValue={String(value)} className="w-full border border-gray-600 bg-gray-800 text-white placeholder:text-gray-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={4} />
                  ) : (
                    <input id={`cz_${key}`} name={key} defaultValue={String(value)} type={type} className="w-full border border-gray-600 bg-gray-800 text-white placeholder:text-gray-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2">
          <button type="submit" className="inline-flex items-center px-3 py-2 rounded bg-primary text-primary-foreground text-sm">
            Save Customizer
          </button>
        </div>
      </form>

      {(availableMenus && Object.keys(availableMenus).length > 0) || (widgetAreas && Object.keys(widgetAreas).length > 0) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availableMenus && Object.keys(availableMenus).length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Available Menus</h4>
              <div className="text-sm text-muted-foreground">
                <ul className="list-disc pl-5 space-y-1">
                  {Object.entries(availableMenus).map(([k, v]: any) => (
                    <li key={k}><span className="font-medium">{k}</span>: {String(v)}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {widgetAreas && Object.keys(widgetAreas).length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Widget Areas</h4>
              <div className="text-sm text-muted-foreground">
                <ul className="list-disc pl-5 space-y-1">
                  {Object.entries(widgetAreas).map(([k, v]: any) => (
                    <li key={k}><span className="font-medium">{k}</span>: {String(v)}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

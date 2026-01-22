import { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminToast } from '@/components/admin/AdminToastProvider';
import { Settings, Globe, FileText, Search, Share2, BarChart3, Image, Wrench, Link2, Trash2 } from 'lucide-react';

type SettingsGroup = 'general' | 'reading' | 'writing' | 'permalinks' | 'seo' | 'social' | 'analytics' | 'media' | 'advanced';

interface Page {
  id: number;
  title: string;
}

interface PostType {
  id: number;
  name: string;
  label?: string;
}

interface SiteSettingsFormProps {
  settings: Record<string, Record<string, any>>;
  currentGroup: SettingsGroup;
  pages?: Page[];
  postTypes?: PostType[];
  timezones?: string[];
  canEdit: boolean;
}

const groupIcons: Record<SettingsGroup, React.ReactNode> = {
  general: <Settings className="h-4 w-4" />,
  reading: <FileText className="h-4 w-4" />,
  writing: <FileText className="h-4 w-4" />,
  permalinks: <Link2 className="h-4 w-4" />,
  seo: <Search className="h-4 w-4" />,
  social: <Share2 className="h-4 w-4" />,
  analytics: <BarChart3 className="h-4 w-4" />,
  media: <Image className="h-4 w-4" />,
  advanced: <Wrench className="h-4 w-4" />,
};

const groupLabels: Record<SettingsGroup, string> = {
  general: 'General',
  reading: 'Reading',
  writing: 'Writing',
  permalinks: 'Permalinks',
  seo: 'SEO',
  social: 'Social',
  analytics: 'Analytics',
  media: 'Media',
  advanced: 'Advanced',
};

export function SiteSettingsForm({
  settings,
  currentGroup,
  pages = [],
  postTypes = [],
  timezones = [],
  canEdit,
}: SiteSettingsFormProps) {
  const { success: showSuccess, error: showError } = useAdminToast();
  const [activeTab, setActiveTab] = useState<SettingsGroup>(currentGroup);
  const [formData, setFormData] = useState<Record<string, Record<string, any>>>(settings);
  const [saving, setSaving] = useState(false);

  const updateField = (group: string, key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: value,
      },
    }));
  };

  const handleSave = async (group: SettingsGroup) => {
    if (!canEdit) return;
    setSaving(true);

    try {
      // Ensure all boolean fields are actually booleans, and nulls are handled
      const dataToSave = { ...formData[group] };
      
      await router.put(`/dashboard/admin/settings/${group}`, dataToSave, {
        preserveScroll: true,
        onSuccess: () => showSuccess(`${groupLabels[group]} settings saved`),
        onError: (errors) => {
          console.error('Validation errors:', errors);
          showError('Failed to save settings. Please check your input.');
        },
      });
    } catch (e) {
      console.error(e);
      showError('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (value: string): void => {
    setActiveTab(value as SettingsGroup);
    // Use replace to avoid polluting history with every tab click
    router.get('/dashboard/admin/settings', { group: value }, { 
      preserveState: true, 
      preserveScroll: true,
      replace: true 
    });
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="site_name" className="text-sm font-bold">Site Name</Label>
          <Input
            id="site_name"
            value={formData.general?.site_name || ''}
            onChange={(e) => updateField('general', 'site_name', e.target.value)}
            disabled={!canEdit}
            placeholder="Modulo CMS"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="site_url" className="text-sm font-bold">Site URL</Label>
          <Input
            id="site_url"
            type="url"
            value={formData.general?.site_url || ''}
            onChange={(e) => updateField('general', 'site_url', e.target.value)}
            disabled={!canEdit}
            placeholder="https://example.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="site_tagline" className="text-sm font-bold">Tagline</Label>
        <Input
          id="site_tagline"
          value={formData.general?.site_tagline || ''}
          onChange={(e) => updateField('general', 'site_tagline', e.target.value)}
          placeholder="A modern, modular headless CMS"
          disabled={!canEdit}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin_email" className="text-sm font-bold">Admin Email</Label>
        <Input
          id="admin_email"
          type="email"
          value={formData.general?.admin_email || ''}
          onChange={(e) => updateField('general', 'admin_email', e.target.value)}
          disabled={!canEdit}
          placeholder="admin@example.com"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="timezone" className="text-sm font-bold">Timezone</Label>
          <Select
            value={formData.general?.timezone || 'UTC'}
            onValueChange={(v) => updateField('general', 'timezone', v)}
            disabled={!canEdit}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {timezones.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="date_format" className="text-sm font-bold">Date Format</Label>
          <Select
            value={formData.general?.date_format || 'F j, Y'}
            onValueChange={(v) => updateField('general', 'date_format', v)}
            disabled={!canEdit}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="F j, Y">January 1, 2025</SelectItem>
              <SelectItem value="Y-m-d">2025-01-01</SelectItem>
              <SelectItem value="m/d/Y">01/01/2025</SelectItem>
              <SelectItem value="d/m/Y">01/01/2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="time_format" className="text-sm font-bold">Time Format</Label>
          <Select
            value={formData.general?.time_format || 'g:i a'}
            onValueChange={(v) => updateField('general', 'time_format', v)}
            disabled={!canEdit}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="g:i a">1:30 pm</SelectItem>
              <SelectItem value="g:i A">1:30 PM</SelectItem>
              <SelectItem value="H:i">13:30</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderReadingSettings = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="show_on_front" className="text-sm font-bold">Homepage Display</Label>
        <Select
          value={formData.reading?.show_on_front || 'posts'}
          onValueChange={(v) => updateField('reading', 'show_on_front', v)}
          disabled={!canEdit}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="posts">Your latest posts</SelectItem>
            <SelectItem value="page">A static page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.reading?.show_on_front === 'page' && (
        <div className="grid gap-6 md:grid-cols-2 p-4 rounded-lg bg-muted/20 border border-dashed">
          <div className="space-y-2">
            <Label htmlFor="front_page_id" className="text-sm font-bold">Homepage</Label>
            <Select
              value={formData.reading?.front_page_id ? String(formData.reading.front_page_id) : 'none'}
              onValueChange={(v) => updateField('reading', 'front_page_id', v === 'none' ? null : parseInt(v))}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Select —</SelectItem>
                {pages.map((page) => (
                  <SelectItem key={page.id} value={String(page.id)}>
                    {page.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="posts_page_id" className="text-sm font-bold">Posts Page</Label>
            <Select
              value={formData.reading?.posts_page_id ? String(formData.reading.posts_page_id) : 'none'}
              onValueChange={(v) => updateField('reading', 'posts_page_id', v === 'none' ? null : parseInt(v))}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Select —</SelectItem>
                {pages.map((page) => (
                  <SelectItem key={page.id} value={String(page.id)}>
                    {page.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="posts_per_page" className="text-sm font-bold">Blog pages show at most</Label>
          <div className="flex items-center gap-3">
            <Input
              id="posts_per_page"
              type="number"
              className="w-24"
              min={1}
              max={100}
              value={formData.reading?.posts_per_page || 10}
              onChange={(e) => updateField('reading', 'posts_per_page', parseInt(e.target.value) || 10)}
              disabled={!canEdit}
            />
            <span className="text-sm text-muted-foreground">posts</span>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="feed_limit" className="text-sm font-bold">Syndication feeds show the most recent</Label>
          <div className="flex items-center gap-3">
            <Input
              id="feed_limit"
              type="number"
              className="w-24"
              min={1}
              max={100}
              value={formData.reading?.feed_limit || 10}
              onChange={(e) => updateField('reading', 'feed_limit', parseInt(e.target.value) || 10)}
              disabled={!canEdit}
            />
            <span className="text-sm text-muted-foreground">items</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWritingSettings = () => (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="default_post_status" className="text-sm font-bold">Default Post Status</Label>
          <Select
            value={formData.writing?.default_post_status || 'draft'}
            onValueChange={(v) => updateField('writing', 'default_post_status', v)}
            disabled={!canEdit}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="default_post_type" className="text-sm font-bold">Default Post Type</Label>
          <Select
            value={formData.writing?.default_post_type || 'post'}
            onValueChange={(v) => updateField('writing', 'default_post_type', v)}
            disabled={!canEdit}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {postTypes.map((type) => (
                <SelectItem key={type.name} value={type.name}>
                  {type.label || type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderSeoSettings = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="meta_title_suffix" className="text-sm font-bold">Title Suffix</Label>
        <Input
          id="meta_title_suffix"
          value={formData.seo?.meta_title_suffix || ''}
          onChange={(e) => updateField('seo', 'meta_title_suffix', e.target.value)}
          placeholder="| My Awesome Site"
          disabled={!canEdit}
        />
        <p className="text-xs text-muted-foreground">Appended to page titles (e.g., "Home | My Awesome Site")</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="meta_description" className="text-sm font-bold">Default Meta Description</Label>
        <Textarea
          id="meta_description"
          value={formData.seo?.meta_description || ''}
          onChange={(e) => updateField('seo', 'meta_description', e.target.value)}
          rows={3}
          disabled={!canEdit}
          placeholder="Describe your site for search engines..."
          className="resize-none"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="google_site_verification" className="text-sm font-bold">Google Search Console</Label>
          <Input
            id="google_site_verification"
            value={formData.seo?.google_site_verification || ''}
            onChange={(e) => updateField('seo', 'google_site_verification', e.target.value)}
            placeholder="verification-code"
            disabled={!canEdit}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bing_site_verification" className="text-sm font-bold">Bing Webmaster Tools</Label>
          <Input
            id="bing_site_verification"
            value={formData.seo?.bing_site_verification || ''}
            onChange={(e) => updateField('seo', 'bing_site_verification', e.target.value)}
            placeholder="verification-code"
            disabled={!canEdit}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="indexnow_key" className="text-sm font-bold">IndexNow API Key</Label>
        <Input
          id="indexnow_key"
          value={formData.seo?.indexnow_key || ''}
          onChange={(e) => updateField('seo', 'indexnow_key', e.target.value)}
          placeholder="your-indexnow-key"
          disabled={!canEdit}
        />
        <p className="text-xs text-muted-foreground">Allows instant notification to search engines when content is updated.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="robots_txt" className="text-sm font-bold">robots.txt</Label>
        <Textarea
          id="robots_txt"
          value={formData.seo?.robots_txt || ''}
          onChange={(e) => updateField('seo', 'robots_txt', e.target.value)}
          rows={5}
          className="font-mono text-xs"
          disabled={!canEdit}
        />
      </div>
    </div>
  );

  const renderSocialSettings = () => (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="facebook_url" className="text-sm font-bold">Facebook</Label>
          <Input
            id="facebook_url"
            type="url"
            value={formData.social?.facebook_url || ''}
            onChange={(e) => updateField('social', 'facebook_url', e.target.value)}
            placeholder="https://facebook.com/yourpage"
            disabled={!canEdit}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="twitter_url" className="text-sm font-bold">Twitter / X</Label>
          <Input
            id="twitter_url"
            type="url"
            value={formData.social?.twitter_url || ''}
            onChange={(e) => updateField('social', 'twitter_url', e.target.value)}
            placeholder="https://twitter.com/yourhandle"
            disabled={!canEdit}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="instagram_url" className="text-sm font-bold">Instagram</Label>
          <Input
            id="instagram_url"
            type="url"
            value={formData.social?.instagram_url || ''}
            onChange={(e) => updateField('social', 'instagram_url', e.target.value)}
            placeholder="https://instagram.com/yourhandle"
            disabled={!canEdit}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="linkedin_url" className="text-sm font-bold">LinkedIn</Label>
          <Input
            id="linkedin_url"
            type="url"
            value={formData.social?.linkedin_url || ''}
            onChange={(e) => updateField('social', 'linkedin_url', e.target.value)}
            placeholder="https://linkedin.com/company/yourcompany"
            disabled={!canEdit}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="youtube_url" className="text-sm font-bold">YouTube</Label>
          <Input
            id="youtube_url"
            type="url"
            value={formData.social?.youtube_url || ''}
            onChange={(e) => updateField('social', 'youtube_url', e.target.value)}
            placeholder="https://youtube.com/@yourchannel"
            disabled={!canEdit}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="github_url" className="text-sm font-bold">GitHub</Label>
          <Input
            id="github_url"
            type="url"
            value={formData.social?.github_url || ''}
            onChange={(e) => updateField('social', 'github_url', e.target.value)}
            placeholder="https://github.com/yourorg"
            disabled={!canEdit}
          />
        </div>
      </div>
    </div>
  );

  const renderAnalyticsSettings = () => (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="google_analytics_id" className="text-sm font-bold">Google Analytics (G4)</Label>
          <Input
            id="google_analytics_id"
            value={formData.analytics?.google_analytics_id || ''}
            onChange={(e) => updateField('analytics', 'google_analytics_id', e.target.value)}
            placeholder="G-XXXXXXXXXX"
            disabled={!canEdit}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gtm_container_id" className="text-sm font-bold">Google Tag Manager</Label>
          <Input
            id="gtm_container_id"
            value={formData.analytics?.gtm_container_id || ''}
            onChange={(e) => updateField('analytics', 'gtm_container_id', e.target.value)}
            placeholder="GTM-XXXXXXX"
            disabled={!canEdit}
          />
        </div>
      </div>
    </div>
  );

  const renderMediaSettings = () => {
    const commonMimeTypes = [
      { label: 'JPEG Image', value: 'image/jpeg' },
      { label: 'PNG Image', value: 'image/png' },
      { label: 'GIF Image', value: 'image/gif' },
      { label: 'WebP Image', value: 'image/webp' },
      { label: 'SVG Image', value: 'image/svg+xml' },
      { label: 'PDF Document', value: 'application/pdf' },
      { label: 'ZIP Archive', value: 'application/zip' },
    ];

    const currentMimes = formData.media?.allowed_mime_types || [];

    const toggleMime = (mime: string) => {
      const next = currentMimes.includes(mime)
        ? currentMimes.filter((m: string) => m !== mime)
        : [...currentMimes, mime];
      updateField('media', 'allowed_mime_types', next);
    };

    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="max_upload_size" className="text-sm font-bold">Maximum Upload Size (MB)</Label>
            <Input
              id="max_upload_size"
              type="number"
              min={1}
              max={100}
              value={formData.media?.max_upload_size || 10}
              onChange={(e) => updateField('media', 'max_upload_size', parseInt(e.target.value) || 10)}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image_quality" className="text-sm font-bold">Generated Image Quality (%)</Label>
            <Input
              id="image_quality"
              type="number"
              min={1}
              max={100}
              value={formData.media?.image_quality || 85}
              onChange={(e) => updateField('media', 'image_quality', parseInt(e.target.value) || 85)}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-bold">Allowed File Types</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-lg border bg-muted/5">
            {commonMimeTypes.map((mime) => (
              <div key={mime.value} className="flex items-center space-x-2">
                <Switch
                  id={`mime-${mime.value}`}
                  checked={currentMimes.includes(mime.value)}
                  onCheckedChange={() => toggleMime(mime.value)}
                  disabled={!canEdit}
                />
                <Label htmlFor={`mime-${mime.value}`} className="text-xs font-medium cursor-pointer">{mime.label}</Label>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">Select which file types users are allowed to upload to the media library.</p>
        </div>
      </div>
    );
  };

  const renderPermalinksSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 bg-primary rounded-full" />
          <h3 className="text-lg font-bold">Permalink Structure</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Choose the default structure for your permanent URLs. This helps with SEO and user experience.
        </p>
        <div className="grid gap-4 p-4 rounded-lg border bg-muted/5">
          <div className="space-y-2">
            <Label htmlFor="permalink_structure" className="text-sm font-bold">Custom Structure</Label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 rounded-md border bg-muted text-muted-foreground text-xs font-mono">
                {formData.general?.site_url || 'https://example.com'}
              </span>
              <Input
                id="permalink_structure"
                value={formData.permalinks?.permalink_structure || '/%postname%/'}
                onChange={(e) => updateField('permalinks', 'permalink_structure', e.target.value)}
                disabled={!canEdit}
                placeholder="/%postname%/"
                className="font-mono text-xs"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">Available tags: %year%, %monthnum%, %day%, %postname%, %post_id%</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 bg-primary rounded-full" />
          <h3 className="text-lg font-bold">Optional Bases</h3>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category_base" className="text-sm font-bold">Category Base</Label>
            <Input
              id="category_base"
              value={formData.permalinks?.category_base || 'category'}
              onChange={(e) => updateField('permalinks', 'category_base', e.target.value)}
              disabled={!canEdit}
              placeholder="category"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tag_base" className="text-sm font-bold">Tag Base</Label>
            <Input
              id="tag_base"
              value={formData.permalinks?.tag_base || 'tag'}
              onChange={(e) => updateField('permalinks', 'tag_base', e.target.value)}
              disabled={!canEdit}
              placeholder="tag"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdvancedSettings = () => (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/5">
          <div className="space-y-0.5">
            <Label className="text-sm font-bold">Maintenance Mode</Label>
            <p className="text-xs text-muted-foreground">Temporarily disable public access to your site</p>
          </div>
          <Switch
            checked={Boolean(formData.advanced?.maintenance_mode)}
            onCheckedChange={(v) => updateField('advanced', 'maintenance_mode', v)}
            disabled={!canEdit}
          />
        </div>

        {formData.advanced?.maintenance_mode && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <Label htmlFor="maintenance_message" className="text-sm font-bold">Maintenance Message</Label>
            <Textarea
              id="maintenance_message"
              value={formData.advanced?.maintenance_message || ''}
              onChange={(e) => updateField('advanced', 'maintenance_message', e.target.value)}
              rows={3}
              disabled={!canEdit}
              className="resize-none"
            />
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/5">
          <div className="space-y-0.5">
            <Label className="text-sm font-bold">Enable Comments</Label>
            <p className="text-xs text-muted-foreground">Allow users to comment on posts and pages (Global setting)</p>
          </div>
          <Switch
            checked={Boolean(formData.advanced?.enable_comments)}
            onCheckedChange={(v) => updateField('advanced', 'enable_comments', v)}
            disabled={!canEdit}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/5">
          <div className="space-y-0.5">
            <Label className="text-sm font-bold">User Registration</Label>
            <p className="text-xs text-muted-foreground">Allow new users to sign up from the frontend</p>
          </div>
          <Switch
            checked={Boolean(formData.advanced?.registration_enabled)}
            onCheckedChange={(v) => updateField('advanced', 'registration_enabled', v)}
            disabled={!canEdit}
          />
        </div>
      </div>
    </div>
  );

  const handleClearCache = () => {
    if (!canEdit) return;
    router.post('/dashboard/admin/settings/clear-cache', {}, {
      onSuccess: () => showSuccess('Settings cache cleared successfully'),
    });
  };

  const groups: SettingsGroup[] = ['general', 'reading', 'writing', 'permalinks', 'seo', 'social', 'analytics', 'media', 'advanced'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Site Settings</h2>
          <p className="text-muted-foreground text-sm">Manage your site configuration and global preferences.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleClearCache}
          disabled={!canEdit}
          className="text-xs"
        >
          <Trash2 className="h-3.5 w-3.5 mr-2" />
          Clear Cache
        </Button>
      </div>

      <Card className="shadow-sm border-border overflow-hidden">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="border-b px-6 bg-muted/20">
              <TabsList className="h-12 bg-transparent gap-4 p-0">
                {groups.map((group) => (
                  <TabsTrigger 
                    key={group} 
                    value={group} 
                    className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 text-xs font-semibold uppercase tracking-wider transition-all hover:text-foreground/80"
                  >
                    <div className="flex items-center gap-2">
                      {groupIcons[group]}
                      <span className="hidden md:inline">{groupLabels[group]}</span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="general" className="mt-0 space-y-6 focus-visible:outline-none">
                {renderGeneralSettings()}
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={() => handleSave('general')} disabled={!canEdit || saving} className="px-8">
                    {saving ? 'Saving...' : 'Save General Settings'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="reading" className="mt-0 space-y-6 focus-visible:outline-none">
                {renderReadingSettings()}
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={() => handleSave('reading')} disabled={!canEdit || saving} className="px-8">
                    {saving ? 'Saving...' : 'Save Reading Settings'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="writing" className="mt-0 space-y-6 focus-visible:outline-none">
                {renderWritingSettings()}
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={() => handleSave('writing')} disabled={!canEdit || saving} className="px-8">
                    {saving ? 'Saving...' : 'Save Writing Settings'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="permalinks" className="mt-0 space-y-6 focus-visible:outline-none">
                {renderPermalinksSettings()}
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={() => handleSave('permalinks')} disabled={!canEdit || saving} className="px-8">
                    {saving ? 'Saving...' : 'Save Permalinks Settings'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="seo" className="mt-0 space-y-6 focus-visible:outline-none">
                {renderSeoSettings()}
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={() => handleSave('seo')} disabled={!canEdit || saving} className="px-8">
                    {saving ? 'Saving...' : 'Save SEO Settings'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="social" className="mt-0 space-y-6 focus-visible:outline-none">
                {renderSocialSettings()}
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={() => handleSave('social')} disabled={!canEdit || saving} className="px-8">
                    {saving ? 'Saving...' : 'Save Social Settings'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="mt-0 space-y-6 focus-visible:outline-none">
                {renderAnalyticsSettings()}
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={() => handleSave('analytics')} disabled={!canEdit || saving} className="px-8">
                    {saving ? 'Saving...' : 'Save Analytics Settings'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="media" className="mt-0 space-y-6 focus-visible:outline-none">
                {renderMediaSettings()}
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={() => handleSave('media')} disabled={!canEdit || saving} className="px-8">
                    {saving ? 'Saving...' : 'Save Media Settings'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="mt-0 space-y-6 focus-visible:outline-none">
                {renderAdvancedSettings()}
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={() => handleSave('advanced')} disabled={!canEdit || saving} className="px-8">
                    {saving ? 'Saving...' : 'Save Advanced Settings'}
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

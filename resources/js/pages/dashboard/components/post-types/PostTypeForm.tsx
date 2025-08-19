import React, { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import type { PostType } from '../../types'

export interface PostTypeFormProps {
  postType?: Partial<PostType>
  isEditing?: boolean
  onSubmit: (data: any) => void
  onCancel: () => void
}

const defaultSupports = ['title', 'editor']
const allSupports = ['title', 'editor', 'excerpt', 'thumbnail', 'comments', 'revisions']

export function PostTypeForm({ postType, isEditing, onSubmit, onCancel }: PostTypeFormProps) {
  const normalizeTaxonomies = (val: any): string[] => {
    if (!val) return []
    if (Array.isArray(val)) return val.map(String).filter(Boolean)
    if (typeof val === 'string') return val.split(',').map(t => t.trim()).filter(Boolean)
    if (typeof val === 'object') return Object.values(val).map(String).filter(Boolean)
    return []
  }

  const [form, setForm] = useState({
    name: postType?.name || '',
    label: postType?.label || '',
    plural_label: postType?.plural_label || '',
    description: postType?.description || '',
    route_prefix: postType?.route_prefix || '',
    has_taxonomies: postType?.has_taxonomies ?? true,
    has_featured_image: postType?.has_featured_image ?? true,
    has_excerpt: postType?.has_excerpt ?? true,
    has_comments: postType?.has_comments ?? true,
    supports: (postType?.supports && postType.supports.length ? postType.supports : defaultSupports) as string[],
    taxonomies: normalizeTaxonomies(postType?.taxonomies),
    is_public: postType?.is_public ?? true,
    is_hierarchical: postType?.is_hierarchical ?? false,
    menu_icon: postType?.menu_icon || '',
    menu_position: postType?.menu_position ?? 5,
  })

  const taxonomiesCsv = useMemo(() => normalizeTaxonomies(form.taxonomies).join(','), [form.taxonomies])

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const toggleSupport = (key: string, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      supports: checked ? Array.from(new Set([...(prev.supports || []), key])) : (prev.supports || []).filter(s => s !== key)
    }))
  }

  const onSubmitInternal = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...form,
      taxonomies: (taxonomiesCsv || '').split(',').map(t => t.trim()).filter(Boolean),
    }
    onSubmit(payload)
  }

  return (
    <form onSubmit={onSubmitInternal} className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">System Name</Label>
              <Input id="name" value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="e.g. article" required />
            </div>
            <div>
              <Label htmlFor="label">Label (Singular)</Label>
              <Input id="label" value={form.label} onChange={(e) => handleChange('label', e.target.value)} placeholder="e.g. Article" required />
            </div>
            <div>
              <Label htmlFor="plural_label">Label (Plural)</Label>
              <Input id="plural_label" value={form.plural_label} onChange={(e) => handleChange('plural_label', e.target.value)} placeholder="e.g. Articles" required />
            </div>
            <div>
              <Label htmlFor="route_prefix">Route Prefix</Label>
              <Input id="route_prefix" value={form.route_prefix} onChange={(e) => handleChange('route_prefix', e.target.value)} placeholder="e.g. articles" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={form.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Optional description" />
            </div>
          </div>

          <Separator className="my-2" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="text-sm font-medium">Features</div>
              <div className="grid grid-cols-2 gap-2">
                {allSupports.map(s => (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={form.supports?.includes(s)} onCheckedChange={(c) => toggleSupport(s, Boolean(c))} />
                    <span className="capitalize">{s}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-sm font-medium">Options</div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.is_public} onCheckedChange={(c) => handleChange('is_public', Boolean(c))} /> Public</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.is_hierarchical} onCheckedChange={(c) => handleChange('is_hierarchical', Boolean(c))} /> Hierarchical</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.has_taxonomies} onCheckedChange={(c) => handleChange('has_taxonomies', Boolean(c))} /> Taxonomies</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.has_featured_image} onCheckedChange={(c) => handleChange('has_featured_image', Boolean(c))} /> Featured Image</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.has_excerpt} onCheckedChange={(c) => handleChange('has_excerpt', Boolean(c))} /> Excerpt</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.has_comments} onCheckedChange={(c) => handleChange('has_comments', Boolean(c))} /> Comments</label>
              </div>
            </div>
          </div>

          <Separator className="my-2" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taxonomies">Taxonomies (comma-separated slugs)</Label>
              <Input id="taxonomies" value={taxonomiesCsv} onChange={(e) => handleChange('taxonomies', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} placeholder="e.g. category,tag" />
            </div>
            <div>
              <Label htmlFor="menu_icon">Menu Icon</Label>
              <Input id="menu_icon" value={form.menu_icon} onChange={(e) => handleChange('menu_icon', e.target.value)} placeholder="Optional icon class" />
            </div>
            <div>
              <Label htmlFor="menu_position">Menu Position</Label>
              <Input id="menu_position" type="number" value={form.menu_position} onChange={(e) => handleChange('menu_position', Number(e.target.value))} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit">{isEditing ? 'Update' : 'Create'} Post Type</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

export default PostTypeForm

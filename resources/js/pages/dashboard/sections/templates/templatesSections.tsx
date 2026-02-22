import type { ReactNode } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { TemplatesList } from '../../components/templates/TemplatesList';
import { TemplateForm } from '../../components/templates/TemplateForm';
import { TemplateView } from '../../components/templates/TemplateView';
import { asArray } from '../../types';

export function getTemplatesSections({
  adminSection,
  templates,
  template,
  editTemplate,
  templateTypes,
  can,
  showSuccess,
  showError,
  ROUTE,
  t,
}: {
  adminSection?: string;
  templates: any;
  template: any;
  editTemplate: any;
  templateTypes: any;
  can: (perm: string) => boolean;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  ROUTE: any;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}): Record<string, () => ReactNode> {
  const renderTemplatesList = () => {
    const templateItems = asArray((templates as any)?.data ?? templates).map((t: any) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      type: t.type,
      description: t.description,
      is_default: t.is_default,
      is_active: t.is_active,
    }));

    return (
      <SectionWrapper
        title={t('dashboard.templates.title')}
        actions={
          can('create templates') ? (
            <Button size="sm" onClick={() => router.visit(ROUTE.templates.create())}>
              {t('dashboard.templates.actions.new')}
            </Button>
          ) : null
        }
      >
        <TemplatesList
          items={templateItems as any}
          canView={can('view templates')}
          canEdit={can('edit templates')}
          canDelete={can('delete templates')}
          onView={(id) => router.visit(ROUTE.templates.show(id))}
          onEdit={(id) => router.visit(ROUTE.templates.edit(id))}
          onDelete={(item) => {
            if (!window.confirm(t('dashboard.templates.confirm_delete', { name: item.name }))) return;
            router.delete(ROUTE.templates.destroy(item.id), {
              preserveScroll: true,
              onSuccess: () => showSuccess(t('dashboard.templates.messages.deleted')),
              onError: () => showError(t('dashboard.templates.messages.delete_failed')),
            });
          }}
        />
      </SectionWrapper>
    );
  };

  const renderTemplateCreateEdit = () => {
    const isEditing = adminSection === 'templates.edit';
    const tpl = isEditing ? (editTemplate as any) : null;

    return (
      <SectionWrapper
        title={isEditing ? t('dashboard.templates.edit_title') : t('dashboard.templates.create_title')}
        description={isEditing ? t('dashboard.templates.edit_description') : t('dashboard.templates.create_description')}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.templates.index())}>
            {t('dashboard.templates.actions.back')}
          </Button>
        }
      >
        <TemplateForm
          template={tpl}
          templateTypes={(templateTypes as any) || {}}
          isEditing={isEditing}
          canDelete={can('delete templates')}
          onDelete={() => {
            if (!tpl?.id) return;
            if (!window.confirm(t('dashboard.templates.confirm_delete', { name: tpl.name }))) return;
            router.delete(ROUTE.templates.destroy(tpl.id));
          }}
          onSubmit={(payload) => {
            const method = isEditing ? 'put' : 'post';
            const url = isEditing && tpl?.id ? ROUTE.templates.update(tpl.id) : ROUTE.templates.store();
            router[method](url, payload, {
              preserveScroll: true,
              onSuccess: () => {
                showSuccess(
                  t(
                    isEditing
                      ? 'dashboard.templates.messages.updated'
                      : 'dashboard.templates.messages.created'
                  )
                );
                router.visit(ROUTE.templates.index());
              },
              onError: () => showError(
                t(
                  isEditing
                    ? 'dashboard.templates.messages.update_failed'
                    : 'dashboard.templates.messages.create_failed'
                )
              ),
            });
          }}
          onCancel={() => router.visit(ROUTE.templates.index())}
        />
      </SectionWrapper>
    );
  };

  const renderTemplateShow = () => (
    <SectionWrapper
      title={t('dashboard.templates.show_title')}
      actions={
        <div className="flex gap-2">
          {can('edit templates') && template?.id ? (
            <Button size="sm" onClick={() => router.visit(ROUTE.templates.edit(template.id))}>
              {t('dashboard.templates.actions.edit')}
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.templates.index())}>
            {t('dashboard.templates.actions.back')}
          </Button>
        </div>
      }
    >
      <TemplateView template={template as any} />
    </SectionWrapper>
  );

  return {
    templates: renderTemplatesList,
    'templates.create': renderTemplateCreateEdit,
    'templates.edit': renderTemplateCreateEdit,
    'templates.show': renderTemplateShow,
  };
}

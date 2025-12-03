import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Save, FileJson, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { Tables } from '@/integrations/supabase/types';

type Site = Tables<'sites'>;

interface SchemaField {
  name: string;
  type: 'text' | 'long-text' | 'image';
  label: string;
}

interface SchemaSection {
  id: string;
  type: string;
  label?: string;
  fields: SchemaField[];
}

interface Schema {
  sections: SchemaSection[];
}

const SiteEditor = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isSuperAdmin, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isJsonDialogOpen, setIsJsonDialogOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<Record<string, string>>({
    defaultValues: {},
  });

  const { data: site, isLoading, error } = useQuery({
    queryKey: ['site', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('id', id!)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Site not found');
      return data as Site;
    },
    enabled: !!user && !!id && isSuperAdmin,
  });

  const updateContentMutation = useMutation({
    mutationFn: async (content: any) => {
      const { data, error } = await supabase
        .from('sites')
        .update({ content })
        .eq('id', id!)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', id] });
      toast.success('התוכן נשמר בהצלחה');
      reset({}, { keepValues: true });
    },
    onError: () => {
      toast.error('שגיאה בשמירת התוכן');
    },
  });

  useEffect(() => {
    if (site?.content) {
      reset(flattenContent(site.content));
    }
  }, [site, reset]);

  const flattenContent = (content: any): Record<string, any> => {
    const flattened: Record<string, any> = {};
    if (content && typeof content === 'object') {
      Object.keys(content).forEach((sectionId) => {
        if (content[sectionId] && typeof content[sectionId] === 'object') {
          Object.keys(content[sectionId]).forEach((fieldKey) => {
            if (fieldKey && fieldKey !== 'undefined') {
              flattened[`${sectionId}.${fieldKey}`] = content[sectionId][fieldKey] || '';
            }
          });
        }
      });
    }
    return flattened;
  };

  const unflattenContent = (formData: Record<string, any>): any => {
    const content: any = {};
    Object.keys(formData).forEach((key) => {
      const parts = key.split('.');
      if (parts.length !== 2) return;
      
      const [sectionId, fieldKey] = parts;
      if (!sectionId || !fieldKey || fieldKey === 'undefined') return;
      
      if (!content[sectionId]) {
        content[sectionId] = {};
      }
      content[sectionId][fieldKey] = formData[key];
    });
    return content;
  };

  const onSubmit = (formData: any) => {
    const content = unflattenContent(formData);
    updateContentMutation.mutate(content);
  };

  const renderField = (sectionId: string, field: SchemaField) => {
    if (!field.name || field.name === 'undefined') {
      console.warn('Field with missing or invalid name detected', field);
      return null;
    }
    
    const fieldKey = `${sectionId}.${field.name}`;

    switch (field.type) {
      case 'text':
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>{field.label}</Label>
            <Input
              id={fieldKey}
              {...register(fieldKey)}
              placeholder={field.label}
            />
          </div>
        );

      case 'long-text':
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>{field.label}</Label>
            <Textarea
              id={fieldKey}
              {...register(fieldKey)}
              placeholder={field.label}
              rows={4}
            />
          </div>
        );

      case 'image':
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>{field.label} (URL)</Label>
            <Input
              id={fieldKey}
              {...register(fieldKey)}
              placeholder="https://example.com/image.jpg"
              dir="ltr"
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-muted-foreground">טוען...</div>
      </div>
    );
  }

  if (!user || !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-10 w-40" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <Link to="/admin/sites">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="ml-2 h-4 w-4" />
                חזרה לרשימת האתרים
              </Button>
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-destructive">
                האתר לא נמצא
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const schema = (site.schema as unknown) as Schema;

  return (
    <div className="min-h-screen bg-background pb-20" dir="rtl">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Link to="/admin/sites">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="ml-2 h-4 w-4" />
              חזרה לרשימת האתרים
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>עריכת תוכן: {site.name}</CardTitle>
            <CardDescription>
              ערוך את התוכן של האתר על פי הסכמה המוגדרת
            </CardDescription>
          </CardHeader>
        </Card>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Accordion type="multiple" defaultValue={schema.sections.map(s => s.id)} className="space-y-4">
            {schema.sections.map((section) => (
              <AccordionItem key={section.id} value={section.id}>
                <Card>
                  <CardHeader className="pb-3">
                    <AccordionTrigger className="hover:no-underline">
                      <CardTitle className="text-lg">
                        {section.label || section.type}
                      </CardTitle>
                    </AccordionTrigger>
                  </CardHeader>
                  <AccordionContent>
                    <CardContent className="space-y-4">
                      {section.fields.map((field) => renderField(section.id, field))}
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="fixed bottom-0 left-0 right-0 bg-card border-t py-4 shadow-lg z-20">
            <div className="container mx-auto px-4 flex justify-end gap-3">
              <Link to="/admin/sites">
                <Button type="button" variant="outline">
                  ביטול
                </Button>
              </Link>
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open(`/client-demo/${site.slug}`, '_blank')}
              >
                <Eye className="ml-2 h-4 w-4" />
                תצוגה מקדימה
              </Button>
              <Dialog open={isJsonDialogOpen} onOpenChange={setIsJsonDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline">
                    <FileJson className="ml-2 h-4 w-4" />
                    הצג JSON
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>תוכן JSON של האתר</DialogTitle>
                    <DialogDescription>
                      הצג את ה-JSON הגולמי שיועבר דרך ה-API
                    </DialogDescription>
                  </DialogHeader>
                  <div className="overflow-auto max-h-[60vh]">
                    <pre className="bg-muted p-4 rounded-md text-sm" dir="ltr">
                      <code>{JSON.stringify(site?.content || {}, null, 2)}</code>
                    </pre>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                type="submit"
                disabled={!isDirty || updateContentMutation.isPending}
              >
                <Save className="ml-2 h-4 w-4" />
                {updateContentMutation.isPending ? 'שומר...' : 'שמור שינויים'}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default SiteEditor;

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Tables } from '@/integrations/supabase/types';

type Site = Tables<'sites'>;

const createSiteSchema = z.object({
  name: z.string().min(1, 'שם האתר הוא שדה חובה').max(100, 'שם האתר ארוך מדי'),
  slug: z.string()
    .min(1, 'הסלאג הוא שדה חובה')
    .max(50, 'הסלאג ארוך מדי')
    .regex(/^[a-z0-9-]+$/, 'הסלאג יכול להכיל רק אותיות באנגלית קטנות, מספרים ומקפים'),
});

type CreateSiteFormData = z.infer<typeof createSiteSchema>;

const defaultSchema = {
  sections: [
    {
      id: 'hero',
      type: 'hero',
      fields: [
        { name: 'title', type: 'text', label: 'כותרת ראשית' },
        { name: 'subtitle', type: 'text', label: 'כותרת משנה' },
        { name: 'ctaText', type: 'text', label: 'טקסט לכפתור' },
        { name: 'ctaLink', type: 'text', label: 'קישור לכפתור' },
      ],
    },
  ],
};

const SitesManagement = () => {
  const { user, isSuperAdmin, loading: authLoading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<CreateSiteFormData>({
    resolver: zodResolver(createSiteSchema),
    defaultValues: {
      name: '',
      slug: '',
    },
  });

  const { data: sites, isLoading, error } = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Site[];
    },
    enabled: !!user && isSuperAdmin,
  });

  const createSiteMutation = useMutation({
    mutationFn: async (values: CreateSiteFormData) => {
      const { data, error } = await supabase
        .from('sites')
        .insert({
          name: values.name,
          slug: values.slug,
          schema: defaultSchema,
          content: {},
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('האתר נוצר בהצלחה');
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('הסלאג כבר קיים במערכת');
      } else {
        toast.error('שגיאה ביצירת האתר');
      }
    },
  });

  const onSubmit = (values: CreateSiteFormData) => {
    createSiteMutation.mutate(values);
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

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="ml-2 h-4 w-4" />
              חזרה ללוח הבקרה
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>ניהול אתרים</CardTitle>
                <CardDescription>צור ונהל את כל האתרים במערכת</CardDescription>
              </div>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="ml-2 h-4 w-4" />
                אתר חדש
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                <p className="font-semibold mb-2">שגיאה בטעינת האתרים</p>
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : 'שגיאה לא ידועה'}
                </p>
              </div>
            ) : sites && sites.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                אין אתרים במערכת. צור אתר ראשון!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">שם האתר</TableHead>
                    <TableHead className="text-right">סלאג</TableHead>
                    <TableHead className="text-right">נוצר ב</TableHead>
                    <TableHead className="text-right">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sites?.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell className="font-medium">{site.name}</TableCell>
                      <TableCell className="text-muted-foreground">{site.slug}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(site.created_at).toLocaleDateString('he-IL')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link to={`/admin/sites/${site.id}/editor`}>
                            <Button variant="ghost" size="icon" title="ערוך תוכן">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" title="מחק אתר">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>יצירת אתר חדש</DialogTitle>
            <DialogDescription>
              הזן את פרטי האתר החדש. הסכמה תיווצר אוטומטית.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם האתר</FormLabel>
                    <FormControl>
                      <Input placeholder="האתר שלי" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סלאג (מזהה ייחודי)</FormLabel>
                    <FormControl>
                      <Input placeholder="my-site" {...field} dir="ltr" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  ביטול
                </Button>
                <Button type="submit" disabled={createSiteMutation.isPending}>
                  {createSiteMutation.isPending ? 'יוצר...' : 'צור אתר'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SitesManagement;

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink } from 'lucide-react';

interface SiteContent {
  hero?: {
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaLink?: string;
    bg_image?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

const ClientDemo = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: site, isLoading, error } = useQuery({
    queryKey: ['public-site', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sites')
        .select('name, content')
        .eq('slug', slug!)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Site not found');
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-destructive/20 via-background to-muted flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-4xl font-bold text-destructive">404</h1>
          <p className="text-xl text-muted-foreground">
            האתר לא נמצא - {slug}
          </p>
          <p className="text-sm text-muted-foreground">
            Site not found. Please check the URL.
          </p>
        </div>
      </div>
    );
  }

  const content = site.content as SiteContent;
  const hero = content?.hero || {};
  const contact = content?.contact || {};

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section
        className="relative flex-1 flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: hero.bg_image
            ? `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${hero.bg_image})`
            : 'linear-gradient(135deg, hsl(var(--primary) / 0.8) 0%, hsl(var(--secondary) / 0.8) 100%)',
        }}
      >
        <div className="container mx-auto px-4 py-32 text-center space-y-8 relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg animate-fade-in">
            {hero.title || 'Welcome'}
          </h1>
          
          {hero.subtitle && (
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto drop-shadow-md animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {hero.subtitle}
            </p>
          )}

          {hero.ctaText && hero.ctaLink && (
            <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Button
                size="lg"
                className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                asChild
              >
                <a href={hero.ctaLink.startsWith('http') ? hero.ctaLink : `https://${hero.ctaLink}`} target="_blank" rel="noopener noreferrer">
                  {hero.ctaText}
                  <ExternalLink className="mr-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          )}

          {/* Site Name Badge */}
          <div className="absolute top-8 left-8 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
            <p className="text-sm font-semibold text-foreground">
              {site.name}
            </p>
          </div>

          {/* Demo Badge */}
          <div className="absolute top-8 right-8 bg-accent/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
            <p className="text-xs font-semibold text-accent-foreground">
              🎭 DEMO MODE
            </p>
          </div>
        </div>
      </section>

      {/* Footer / Contact Section */}
      {(contact.email || contact.phone || contact.address) && (
        <footer className="bg-card border-t py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-right" dir="rtl">
              {contact.email && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">אימייל</p>
                  <a href={`mailto:${contact.email}`} className="text-foreground hover:text-primary transition-colors">
                    {contact.email}
                  </a>
                </div>
              )}
              
              {contact.phone && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">טלפון</p>
                  <a href={`tel:${contact.phone}`} className="text-foreground hover:text-primary transition-colors">
                    {contact.phone}
                  </a>
                </div>
              )}
              
              {contact.address && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">כתובת</p>
                  <p className="text-foreground">{contact.address}</p>
                </div>
              )}
            </div>

            <div className="mt-8 text-center text-xs text-muted-foreground">
              <p>Powered by Headless CMS • Content delivered via API</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default ClientDemo;

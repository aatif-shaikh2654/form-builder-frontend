import React, { Suspense, cache } from 'react';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import {
  formsService,
  normalizePublishedForm,
} from '@/features/forms/services/formsService';
import {
  PublishedFormClient,
  PublicFormSkeleton,
} from './PublishedFormClient';

export const instant = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

// React cache ensures for a single request, GET /form/{slug}/form is executed exactly once
const getCachedPublishedForm = cache(async (slug: string, cookieHeader: string) => {
  return formsService.getServerPublishedForm(slug, cookieHeader);
});

/**
 * Server-side dynamic metadata generation with forwarded cookies
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const rawData = await getCachedPublishedForm(slug, cookieHeader);
  const form = normalizePublishedForm(rawData, slug);

  if (!form) {
    return {
      title: 'Form Not Found | FormCraft',
      description: 'The requested form could not be found or has been unpublished.',
    };
  }

  return {
    title: `${form.title} | FormCraft`,
    description: form.description || 'Fill out and submit your response.',
  };
}

/**
 * Server Component: fetches published form directly on the server (SSR)
 * forwarding all client request cookies to the backend.
 * NO fallback, NO extra API calls, NO dummy data.
 */
async function PublishedFormServerContent({ params }: PageProps) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  // Fetch form data on the server with full cookies forwarding (deduplicated by cache)
  const rawData = await getCachedPublishedForm(slug, cookieHeader);

  const form = normalizePublishedForm(rawData, slug);

  return <PublishedFormClient initialForm={form} slug={slug} />;
}

export default function PublishedFormPage({ params }: PageProps) {
  return (
    <Suspense fallback={<PublicFormSkeleton />}>
      <PublishedFormServerContent params={params} />
    </Suspense>
  );
}

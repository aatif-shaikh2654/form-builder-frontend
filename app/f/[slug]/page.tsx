import React, { Suspense } from 'react';
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Server-side dynamic metadata generation with forwarded cookies
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const isUuid = UUID_REGEX.test(slug);
  const rawData = isUuid
    ? await formsService.getServerFormById(slug, cookieHeader)
    : await formsService.getServerPublishedForm(slug, cookieHeader);

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
 */
async function PublishedFormServerContent({ params }: PageProps) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const isUuid = UUID_REGEX.test(slug);

  // Fetch form data on the server with full cookies forwarding
  const rawData = isUuid
    ? await formsService.getServerFormById(slug, cookieHeader)
    : await formsService.getServerPublishedForm(slug, cookieHeader);

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

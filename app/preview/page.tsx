import React, { Suspense } from 'react';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { formsService } from '@/features/forms/services/formsService';
import { PreviewClient, PreviewSkeleton } from './PreviewClient';

export const instant = false;

interface PreviewPageProps {
  searchParams: Promise<{ id?: string }>;
}

/**
 * Server-side dynamic metadata for Preview
 */
export async function generateMetadata({
  searchParams,
}: PreviewPageProps): Promise<Metadata> {
  const { id } = await searchParams;
  if (!id) {
    return {
      title: 'Preview Form | FormCraft Studio',
      description: 'Preview form in real time.',
    };
  }

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const form = await formsService.getServerFormById(id, cookieHeader);

  return {
    title: form?.title
      ? `Preview: ${form.title} | FormCraft`
      : 'Preview Form | FormCraft Studio',
    description: form?.description || 'Preview form in real time.',
  };
}

/**
 * Server-side Component: fetches form details directly on the server only,
 * forwarding all client request cookies to the backend.
 */
async function PreviewServerContent({ searchParams }: PreviewPageProps) {
  const { id } = await searchParams;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  // Fetch form details directly on the server (includes draft_version & published_version)
  const initialForm = id
    ? await formsService.getServerFormById(id, cookieHeader)
    : null;

  return <PreviewClient initialForm={initialForm} formIdParam={id || null} />;
}

export default async function PreviewPage(props: PreviewPageProps) {
  return (
    <Suspense fallback={<PreviewSkeleton />}>
      <PreviewServerContent {...props} />
    </Suspense>
  );
}

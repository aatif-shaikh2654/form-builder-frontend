import React, { Suspense, cache } from 'react';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { formsService, normalizeDraftForm } from '@/features/forms/services/formsService';
import { PreviewClient, PreviewSkeleton } from './PreviewClient';

export const instant = false;

interface PreviewPageProps {
  searchParams: Promise<{ id?: string }>;
}

// React cache ensures for a single request, GET /form/{id}/get-draft is executed exactly once
const getCachedDraftForm = cache(async (id: string, cookieHeader: string) => {
  return formsService.getServerDraftForm(id, cookieHeader);
});

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

  // Call only the draft API (deduplicated by cache)
  const rawDraft = await getCachedDraftForm(id, cookieHeader);
  const form = normalizeDraftForm(rawDraft, id);

  return {
    title: form?.title
      ? `Preview: ${form.title} | FormCraft`
      : 'Preview Form | FormCraft Studio',
    description: form?.description || 'Preview form in real time.',
  };
}

/**
 * Server-side Component: fetches draft form directly on the server only,
 * calling GET /api/v1/form/{form_id}/get-draft with forwarded client request cookies.
 * NO fallback, NO extra API calls, NO dummy data.
 */
async function PreviewServerContent({ searchParams }: PreviewPageProps) {
  const { id } = await searchParams;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  // Call only the draft API: GET /api/v1/form/{form_id}/get-draft
  const rawDraft = id
    ? await getCachedDraftForm(id, cookieHeader)
    : null;

  const initialForm = rawDraft ? normalizeDraftForm(rawDraft, id!) : null;

  return <PreviewClient initialForm={initialForm} />;
}

export default async function PreviewPage(props: PreviewPageProps) {
  return (
    <Suspense fallback={<PreviewSkeleton />}>
      <PreviewServerContent {...props} />
    </Suspense>
  );
}

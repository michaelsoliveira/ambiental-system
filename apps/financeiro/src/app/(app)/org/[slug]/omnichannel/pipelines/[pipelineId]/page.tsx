'use client';

import { use } from 'react';
import { OcPipelineBoard } from '@/features/omnichannel/components/pipeline/oc-pipeline-board';

export default function PipelinePage({ params }: { params: Promise<{ pipelineId: string }> }) {
  const { pipelineId } = use(params);
  return <OcPipelineBoard pipelineId={pipelineId} />;
}

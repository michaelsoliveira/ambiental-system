import { redirect } from 'next/navigation';

type Props = { params: Promise<{ slug: string }> };

export default async function OmnichannelIndexPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/org/${slug}/omnichannel/dashboard`);
}

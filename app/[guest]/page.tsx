import WeddingInvitation from "../WeddingInvitation";

export default async function GuestPage({ params }: { params: Promise<{ guest: string }> }) {
  const { guest } = await params;
  return <WeddingInvitation slug={guest} />;
}

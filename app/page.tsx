import WeddingInvitation from "./WeddingInvitation";

export const metadata = {
  title: "Undangan Pernikahan Digital",
  description: "Undangan pernikahan digital yang personal, hangat, dan mudah dibagikan.",
};

export default function Home() {
  return <WeddingInvitation slug="tamu-undangan" />;
}

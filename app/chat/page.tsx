import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CombinedChatPage from "@/components/CombinedChatPage";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  return <div className="flex-col items-center">
    <CombinedChatPage userId={session.user.id} />
    </div>;
}

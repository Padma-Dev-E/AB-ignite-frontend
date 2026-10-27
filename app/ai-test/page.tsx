import type { Metadata } from "next";
import { AiTestPage } from "../../src/features/ai-test/ai-test-page";

export const metadata: Metadata = {
  title: "AI API Test | AB Ignite",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AiTestPage />;
}

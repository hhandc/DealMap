import type { Metadata } from "next";
import "~/styles/globals.css";
import "~/styles/details.css";
export const metadata: Metadata = {
  title: "DealMap | 내 주변, 놓치기 아까운 혜택",
  description:
    "가까운 프랜차이즈 할인과 쿠폰, 스탬프를 한눈에. 딜맵에서 일상의 작은 혜택을 발견하세요.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <div data-theme>{children}</div>
      </body>
    </html>
  );
}

import type { ReactNode } from "react";
import { Card } from "antd";

type AuthGuestLayoutProps = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

/** Centered guest auth card (login / signup). */
export function AuthGuestLayout({
  title,
  children,
  footer,
}: AuthGuestLayoutProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f0f2f5",
      }}
    >
      <Card title={title} style={{ width: 360 }} variant="borderless">
        {children}
        {footer}
      </Card>
    </div>
  );
}

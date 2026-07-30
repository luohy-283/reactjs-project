import type { ReactNode } from "react";
import { Col, Row, Typography } from "antd";

export type PageHeaderProps = {
  title: ReactNode;
  /** Right-side actions (buttons, etc.) */
  extra?: ReactNode;
  /** Optional block under the title row (filters, search, …) */
  children?: ReactNode;
};

/** Page title row + optional toolbar / filter slot. */
export function PageHeader({ title, extra, children }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]} justify="space-between" align="middle">
        <Col flex="auto">
          <Typography.Title level={4} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
        </Col>
        {extra ? <Col>{extra}</Col> : null}
      </Row>
      {children ? <div style={{ marginTop: 16 }}>{children}</div> : null}
    </div>
  );
}

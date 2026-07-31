import { Badge, Button, Dropdown, Empty, List, Typography } from "antd";
import { BellOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useNotifications } from "@/features/notifications/api/notifications.hooks";
import type { AppNotification } from "@/features/notifications/api/notifications.types";
import { withNotificationFlash } from "@/lib/notificationNav";

function pathForNotification(
  n: AppNotification,
  role?: string,
): string {
  const ref = n.bookingId;
  if (n.type === "BOOKING_PENDING") {
    return ref != null
      ? `/admin/bookings?tab=pending&highlight=${ref}`
      : "/admin/bookings?tab=pending";
  }
  if (n.type === "BOOKING_APPROVED") return "/my-invoices";
  if (n.type === "DEPT_CHANGE_PENDING") {
    return ref != null
      ? `/admin/users?tab=requests&highlight=${ref}`
      : "/admin/users?tab=requests";
  }
  if (
    n.type === "DEPT_CHANGE_APPROVED" ||
    n.type === "DEPT_CHANGE_REJECTED"
  ) {
    return "/dashboard";
  }
  return role === "ADMIN" ? "/admin/bookings" : "/dashboard";
}

/** App-shell notification bell — polls every 15s while authenticated. */
export function NotificationBell() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { items, unreadCount, markRead, markAllRead } = useNotifications(
    Boolean(isAuthenticated),
  );

  const onItemClick = async (n: AppNotification) => {
    if (!n.read) {
      try {
        await markRead(n.id);
      } catch {
        /* ignore — still navigate */
      }
    }
    const path = pathForNotification(n, user?.role);
    navigate(path, { state: withNotificationFlash(location.state) });
  };

  const dropdown = (
    <div
      style={{
        width: 360,
        maxHeight: 420,
        overflow: "auto",
        padding: 12,
        background: "#fff",
        borderRadius: 8,
        boxShadow:
          "0 6px 16px 0 rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12), 0 9px 28px 8px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Typography.Text strong>Thông báo</Typography.Text>
        <Button
          type="link"
          size="small"
          disabled={unreadCount === 0}
          onClick={() => void markAllRead()}
        >
          Đọc tất cả
        </Button>
      </div>
      {items.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có thông báo" />
      ) : (
        <List
          size="small"
          dataSource={items}
          renderItem={(n) => (
            <List.Item
              style={{
                cursor: "pointer",
                background: n.read ? "#fff" : "#e6f4ff",
                padding: "8px 8px",
                borderRadius: 6,
                marginBottom: 4,
              }}
              onClick={() => void onItemClick(n)}
            >
              <List.Item.Meta
                title={
                  <Typography.Text strong={!n.read}>{n.title}</Typography.Text>
                }
                description={
                  <>
                    <div>{n.message}</div>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {n.createdDate
                        ? dayjs(n.createdDate).format("DD/MM/YYYY HH:mm")
                        : ""}
                    </Typography.Text>
                  </>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <Dropdown
      popupRender={() => dropdown}
      trigger={["click"]}
      placement="bottomRight"
    >
      <Button
        type="text"
        style={{ color: "#fff" }}
        icon={
          <Badge count={unreadCount} size="small" overflowCount={99}>
            <BellOutlined style={{ fontSize: 18, color: "#fff" }} />
          </Badge>
        }
      />
    </Dropdown>
  );
}

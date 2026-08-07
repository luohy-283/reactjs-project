import { Badge, Button, Dropdown, Empty, List, Typography, theme } from "antd";
import { BellOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useLocation, useNavigate } from "react-router";
import { ErrorMessage } from "@/components/ui/error/ErrorMessage";
import { RetryButton } from "@/components/ui/error/RetryButton";
import { useToast } from "@/components/ui/feedback/useFeedback";
import { LoadingSpinner } from "@/components/ui/loading/LoadingSpinner";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useNotifications } from "@/features/notifications/api/notifications.hooks";
import type { AppNotification } from "@/features/notifications/api/notifications.types";
import { getApiErrorMessage } from "@/lib/api-error";
import { withNotificationFlash } from "@/lib/notificationNav";

/** Returns a route for deep-linkable notices; `null` = mark-read only (no navigate). */
function pathForNotification(n: AppNotification): string | null {
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
  // REJECTED / CANCELLED / EXPIRED / DEPT_CHANGE_APPROVED|REJECTED — no destination
  return null;
}

/** App-shell notification bell — polls while authenticated (interval in useNotifications). */
export function NotificationBell() {
  const { token } = theme.useToken();
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    items,
    unreadCount,
    error,
    isLoading,
    marking,
    refresh,
    markRead,
    markAllRead,
  } = useNotifications(Boolean(isAuthenticated));

  const onMarkAllRead = async () => {
    try {
      await markAllRead();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không đánh dấu đã đọc được"));
    }
  };

  const onItemClick = async (n: AppNotification) => {
    if (marking) return;

    if (!n.read) {
      try {
        await markRead(n.id);
      } catch (err) {
        toast.warning(
          getApiErrorMessage(err, "Không đánh dấu đã đọc được thông báo"),
        );
      }
    }
    const path = pathForNotification(n);
    if (path != null) {
      navigate(path, { state: withNotificationFlash(location.state) });
    }
  };

  const listBody = (() => {
    if (isLoading && items.length === 0) {
      return (
        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
          <LoadingSpinner size="small" />
        </div>
      );
    }

    if (error && items.length === 0) {
      return (
        <ErrorMessage
          message={getApiErrorMessage(error, "Không tải được thông báo")}
          action={
            <RetryButton
              size="small"
              type="default"
              onRetry={refresh}
              loading={isLoading}
            />
          }
        />
      );
    }

    if (items.length === 0) {
      return (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có thông báo" />
      );
    }

    return (
      <List
        size="small"
        dataSource={items}
        renderItem={(n) => {
          const navigable = pathForNotification(n) != null;
          return (
          <List.Item
            style={{
              cursor: marking ? "default" : navigable ? "pointer" : "default",
              opacity: marking ? 0.6 : 1,
              background: n.read ? "transparent" : token.colorPrimaryBg,
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
          );
        }}
      />
    );
  })();

  const dropdown = (
    <div
      style={{
        width: 360,
        maxHeight: 420,
        overflow: "auto",
        padding: 12,
        background: token.colorBgElevated,
        borderRadius: 8,
        boxShadow: token.boxShadowSecondary,
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
          disabled={unreadCount === 0 || marking}
          loading={marking}
          onClick={() => void onMarkAllRead()}
        >
          Đọc tất cả
        </Button>
      </div>
      {error && items.length > 0 ? (
        <ErrorMessage
          message={getApiErrorMessage(error, "Không tải được thông báo")}
          action={
            <RetryButton
              size="small"
              type="default"
              onRetry={refresh}
              loading={isLoading}
            />
          }
          style={{ marginBottom: 8 }}
        />
      ) : null}
      {listBody}
    </div>
  );

  return (
    <Dropdown
      popupRender={() => dropdown}
      trigger={["click"]}
      placement="bottomRight"
      onOpenChange={(open) => {
        if (open) void refresh();
      }}
    >
            <Badge
        count={unreadCount}
        size="small"
        overflowCount={99}
        offset={[-4, 4]}
        style={{ display: "inline-flex", alignItems: "center" }}
      >
        <Button
          type="text"
          aria-label="Thông báo"
          icon={<BellOutlined />}
          style={{
            color: "#fff",
            fontSize: 18,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
      </Badge>
    </Dropdown>
  );
}

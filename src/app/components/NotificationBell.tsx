import { useRef } from "react";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import type { OverlayPanel as OverlayPanelType } from "primereact/overlaypanel";
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
import { useIsDarkMode } from "@/lib/useIsDarkMode";

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
  const isDark = useIsDarkMode();
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const panelRef = useRef<OverlayPanelType>(null);
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

  const bgElevated = isDark ? "#1f1f1f" : "#ffffff";
  const unreadBg = isDark ? "rgba(22, 104, 220, 0.25)" : "#e6f4ff";
  const muted = isDark ? "#a6a6a6" : "#8c8c8c";
  const shadow = isDark
    ? "0 6px 16px rgba(0,0,0,0.45)"
    : "0 6px 16px rgba(0,0,0,0.12)";

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
    panelRef.current?.hide();
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            padding: 24,
            color: muted,
          }}
        >
          <i className="pi pi-inbox" style={{ fontSize: 28, opacity: 0.55 }} />
          <div>Chưa có thông báo</div>
        </div>
      );
    }

    return (
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((n) => {
          const navigable = pathForNotification(n) != null;
          return (
            <li key={n.id}>
              <button
                type="button"
                disabled={marking}
                onClick={() => void onItemClick(n)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  cursor: marking ? "default" : navigable ? "pointer" : "default",
                  opacity: marking ? 0.6 : 1,
                  background: n.read ? "transparent" : unreadBg,
                  padding: "8px 8px",
                  borderRadius: 6,
                  marginBottom: 4,
                  color: "inherit",
                }}
              >
                <div style={{ fontWeight: n.read ? 400 : 600 }}>{n.title}</div>
                <div style={{ fontSize: 13 }}>{n.message}</div>
                <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>
                  {n.createdDate
                    ? dayjs(n.createdDate).format("DD/MM/YYYY HH:mm")
                    : ""}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    );
  })();

  const badgeValue =
    unreadCount > 99 ? "99+" : unreadCount > 0 ? unreadCount : undefined;

  return (
    <>
      <span
        className="topbar-notification-badge"
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          flexShrink: 0,
        }}
      >
        <Button
          type="button"
          text
          rounded
          icon="pi pi-bell"
          aria-label="Thông báo"
          onClick={(e) => panelRef.current?.toggle(e)}
          style={{
            color: "#fff",
            fontSize: 18,
            width: 40,
            height: 40,
          }}
        />
        {badgeValue != null ? (
          <Badge
            value={badgeValue}
            severity="danger"
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              fontSize: 10,
              minWidth: "1.1rem",
              height: "1.1rem",
              lineHeight: "1.1rem",
            }}
          />
        ) : null}
      </span>
      <OverlayPanel
        ref={panelRef}
        dismissable
        onShow={() => {
          void refresh();
        }}
      >
        <div
          style={{
            width: 360,
            maxHeight: 420,
            overflow: "auto",
            padding: 4,
            background: bgElevated,
            borderRadius: 8,
            boxShadow: shadow,
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
            <strong>Thông báo</strong>
            <Button
              type="button"
              link
              size="small"
              label="Đọc tất cả"
              disabled={unreadCount === 0 || marking}
              loading={marking}
              onClick={() => void onMarkAllRead()}
            />
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
      </OverlayPanel>
    </>
  );
}

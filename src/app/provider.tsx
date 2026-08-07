import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { PrimeReactProvider, addLocale, locale } from "primereact/api";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { ThemeProvider } from "@/app/theme/ThemeContext";
import { useThemeMode } from "@/app/theme/useThemeMode";
import { applyPrimeTheme } from "@/app/prime-theme";
import { ToastContext } from "@/components/ui/feedback/ToastContext";

addLocale("vi", {
  startsWith: "Bắt đầu với",
  contains: "Chứa",
  notContains: "Không chứa",
  endsWith: "Kết thúc với",
  equals: "Bằng",
  notEquals: "Không bằng",
  noFilter: "Không lọc",
  filter: "Lọc",
  lt: "Nhỏ hơn",
  lte: "Nhỏ hơn hoặc bằng",
  gt: "Lớn hơn",
  gte: "Lớn hơn hoặc bằng",
  dateIs: "Ngày bằng",
  dateIsNot: "Ngày khác",
  dateBefore: "Trước ngày",
  dateAfter: "Sau ngày",
  custom: "Tùy chỉnh",
  clear: "Xóa",
  apply: "Áp dụng",
  matchAll: "Khớp tất cả",
  matchAny: "Khớp bất kỳ",
  addRule: "Thêm điều kiện",
  removeRule: "Xóa điều kiện",
  accept: "Đồng ý",
  reject: "Từ chối",
  choose: "Chọn",
  upload: "Tải lên",
  cancel: "Hủy",
  dayNames: [
    "Chủ nhật",
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
  ],
  dayNamesShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  dayNamesMin: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  monthNames: [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ],
  monthNamesShort: [
    "Th1",
    "Th2",
    "Th3",
    "Th4",
    "Th5",
    "Th6",
    "Th7",
    "Th8",
    "Th9",
    "Th10",
    "Th11",
    "Th12",
  ],
  today: "Hôm nay",
  weekHeader: "Tuần",
  firstDayOfWeek: 1,
  dateFormat: "dd/mm/yy",
  weak: "Yếu",
  medium: "Trung bình",
  strong: "Mạnh",
  passwordPrompt: "Nhập mật khẩu",
  emptyFilterMessage: "Không có kết quả",
  emptyMessage: "Không có dữ liệu",
  emptySearchMessage: "Không tìm thấy",
  emptySelectionMessage: "Chưa chọn",
  selectionMessage: "{0} mục đã chọn",
  chooseYear: "Chọn năm",
  chooseMonth: "Chọn tháng",
  chooseDate: "Chọn ngày",
  prevDecade: "Thập kỷ trước",
  nextDecade: "Thập kỷ sau",
  prevYear: "Năm trước",
  nextYear: "Năm sau",
  prevMonth: "Tháng trước",
  nextMonth: "Tháng sau",
  prevHour: "Giờ trước",
  nextHour: "Giờ sau",
  prevMinute: "Phút trước",
  nextMinute: "Phút sau",
  prevSecond: "Giây trước",
  nextSecond: "Giây sau",
  am: "SA",
  pm: "CH",
  searchMessage: "{0} kết quả",
  fileChosenMessage: "{0} tệp",
  noFileChosenMessage: "Chưa chọn tệp",
} as Parameters<typeof addLocale>[1]);

locale("vi");

function ThemedApp({ children }: { children: ReactNode }) {
  const { isDark } = useThemeMode();
  const toastRef = useRef<Toast>(null);

  useEffect(() => {
    applyPrimeTheme(isDark);
  }, [isDark]);

  return (
    <PrimeReactProvider
      value={{
        ripple: true,
        locale: "vi",
      }}
    >
      <ToastContext.Provider value={toastRef}>
        <Toast ref={toastRef} position="top-right" />
        <ConfirmDialog />
        <AuthProvider>{children}</AuthProvider>
      </ToastContext.Provider>
    </PrimeReactProvider>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ThemedApp>{children}</ThemedApp>
    </ThemeProvider>
  );
}

import { createContext, type RefObject } from "react";
import type { Toast } from "primereact/toast";

export const ToastContext = createContext<RefObject<Toast | null> | null>(null);

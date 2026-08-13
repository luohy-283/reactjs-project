import {
  getEquipmentPage,
  getEquipmentPurchasesPage,
  listEquipmentForSelect,
  listRoomsForSelect,
} from "@/features/equipment/api/equipment.service";
import type {
  GetEquipmentOptions,
  GetEquipmentPurchasesOptions,
} from "@/features/equipment/api/equipment.service";
import type {
  Equipment,
  EquipmentPurchase,
  RoomSelectOption,
} from "@/features/equipment/api/equipment.types";
import type { PagedResult } from "@/lib/pagination";
import { useAsyncFetch } from "@/lib/useAsyncFetch";

const EMPTY_EQUIPMENT_PAGE: PagedResult<Equipment> = {
  items: [],
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
};

const EMPTY_PURCHASE_PAGE: PagedResult<EquipmentPurchase> = {
  items: [],
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
};

export function useEquipmentPage(
  options: Omit<GetEquipmentOptions, "signal">,
  enabled = true,
) {
  return useAsyncFetch(
    (signal) => getEquipmentPage({ ...options, signal }),
    [options.page, options.size, options.sort, options.q, options.active],
    { initialData: EMPTY_EQUIPMENT_PAGE, enabled },
  );
}

export function useEquipmentPurchasesPage(
  options: Omit<GetEquipmentPurchasesOptions, "signal">,
  enabled = true,
) {
  return useAsyncFetch(
    (signal) => getEquipmentPurchasesPage({ ...options, signal }),
    [
      options.page,
      options.size,
      options.sort,
      options.status,
      options.roomId,
    ],
    { initialData: EMPTY_PURCHASE_PAGE, enabled },
  );
}

export function useRoomsForSelect(enabled = true) {
  return useAsyncFetch(
    (signal) => listRoomsForSelect(signal),
    [],
    { initialData: [] as RoomSelectOption[], enabled },
  );
}

export function useEquipmentForSelect(enabled = true) {
  return useAsyncFetch(
    (signal) => listEquipmentForSelect(signal),
    [],
    { initialData: [] as Equipment[], enabled },
  );
}

export interface RevenueByRoom {
  roomId: number;
  roomName: string;
  bookingCount: number;
  amount: number;
  sharePercent: number;
}

export interface RevenueByDay {
  date: string;
  bookingCount: number;
  amount: number;
}

export interface RevenuePeriod {
  yearMonth: string;
  totalAmount: number;
  totalBookings: number;
  averageAmount: number;
  cancelledCount: number;
  cancellationRate: number;
}

export interface RevenueReport {
  yearMonth: string;
  totalAmount: number;
  totalBookings: number;
  averageAmount: number;
  cancelledCount: number;
  cancellationRate: number;
  previous: RevenuePeriod;
  byRoom: RevenueByRoom[];
  byDay: RevenueByDay[];
}

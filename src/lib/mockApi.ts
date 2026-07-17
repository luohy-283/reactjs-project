export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    role: "ADMIN" | "USER";
  };
}

export function mockLogin(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email === "admin@company.com" && password === "123456") {
        resolve({
          token: "fake-jwt-token-admin",
          user: { id: 1, email, fullName: "Admin User", role: "ADMIN" },
        });
      } else if (email === "user@company.com" && password === "123456") {
        resolve({
          token: "fake-jwt-token-user",
          user: { id: 2, email, fullName: "Normal User", role: "USER" },
        });
      } else {
        reject(new Error("Email hoặc mật khẩu không đúng"));
      }
    }, 800);
  });
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
  isActive: boolean;
}

const mockRooms: Room[] = [
  { id: 1, name: "Phòng Coda", capacity: 8, isActive: true },
  { id: 2, name: "Phòng Tầng 3", capacity: 20, isActive: true },
  { id: 3, name: "Phòng Sky", capacity: 4, isActive: false },
];

let nextRoomId = 4;

export function mockGetRooms(): Promise<Room[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockRooms]);
    }, 500);
  });
}

export interface CreateRoomPayload {
  name: string;
  capacity: number;
}

export function mockCreateRoom(payload: CreateRoomPayload): Promise<Room> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const room: Room = {
        id: nextRoomId++,
        name: payload.name,
        capacity: payload.capacity,
        isActive: true,
      };
      mockRooms.push(room);
      resolve(room);
    }, 500);
  });
}

export interface UpdateRoomPayload {
  id: number;
  name?: string;
  capacity?: number;
  isActive?: boolean;
}

export function mockUpdateRoom(payload: UpdateRoomPayload): Promise<Room> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockRooms.findIndex((room) => room.id === payload.id);
      if (index === -1) {
        reject(new Error("Phòng không tồn tại"));
        return;
      }
      mockRooms[index] = { ...mockRooms[index], ...payload };
      resolve(mockRooms[index]);
    }, 500);
  });
}

export interface Booking {
  id: number;
  roomId: number;
  userId: number;
  title: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "APPROVED" | "CANCELLED";
}

function atTime(hour: number, minute = 0): string {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

const mockBookings: Booking[] = [
  {
    id: 1,
    roomId: 1,
    userId: 2,
    title: "Họp team",
    startTime: atTime(9),
    endTime: atTime(10),
    status: "APPROVED",
  },
  {
    id: 2,
    roomId: 1,
    userId: 1,
    title: "Review sprint",
    startTime: atTime(14),
    endTime: atTime(15, 30),
    status: "APPROVED",
  },
  {
    id: 3,
    roomId: 2,
    userId: 2,
    title: "Training",
    startTime: atTime(10),
    endTime: atTime(12),
    status: "APPROVED",
  },
];

let nextBookingId = 4;

function isOverlapping(
  roomId: number,
  startTime: string,
  endTime: string,
  excludeId?: number,
): boolean {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  return mockBookings.some((booking) => {
    if (
      booking.roomId !== roomId ||
      booking.status === "CANCELLED" ||
      booking.id === excludeId
    ) {
      return false;
    }

    const bookingStart = new Date(booking.startTime).getTime();
    const bookingEnd = new Date(booking.endTime).getTime();
    return start < bookingEnd && end > bookingStart;
  });
}

export function mockGetBookings(date: string): Promise<Booking[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = mockBookings.filter((booking) => {
        const bookingDate = booking.startTime.slice(0, 10);
        return bookingDate === date && booking.status !== "CANCELLED";
      });
      resolve(result);
    }, 500);
  });
}

export interface CreateBookingPayload {
  roomId: number;
  userId: number;
  title: string;
  startTime: string;
  endTime: string;
}

export function mockCreateBooking(
  payload: CreateBookingPayload,
): Promise<Booking> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (isOverlapping(payload.roomId, payload.startTime, payload.endTime)) {
        reject(new Error("Phòng đã được đặt trong khoảng thời gian này"));
        return;
      }

      const booking: Booking = {
        id: nextBookingId++,
        roomId: payload.roomId,
        userId: payload.userId,
        title: payload.title,
        startTime: payload.startTime,
        endTime: payload.endTime,
        status: "APPROVED",
      };
      mockBookings.push(booking);
      resolve(booking);
    }, 800);
  });
}

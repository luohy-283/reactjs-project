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

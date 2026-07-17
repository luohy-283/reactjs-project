export interface Room {
  id: number;
  name: string;
  capacity: number;
  isActive: boolean;
}

export interface CreateRoomPayload {
  name: string;
  capacity: number;
}

export interface UpdateRoomPayload {
  id: number;
  name?: string;
  capacity?: number;
  isActive?: boolean;
}

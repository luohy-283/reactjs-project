import {
  mockCreateRoom,
  mockGetRooms,
  mockUpdateRoom,
} from "../../lib/mockApi";
import type {
  CreateRoomPayload,
  Room,
  UpdateRoomPayload,
} from "./rooms.types";

export async function getRooms(): Promise<Room[]> {
  return mockGetRooms();
}

export async function createRoom(payload: CreateRoomPayload): Promise<Room> {
  return mockCreateRoom(payload);
}

export async function updateRoom(payload: UpdateRoomPayload): Promise<Room> {
  return mockUpdateRoom(payload);
}

import { useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { createRoom, updateRoom } from "../api/rooms/rooms.service";
import { useRooms } from "../api/rooms/rooms.hooks";
import type { Room } from "../api/rooms/rooms.types";

export default function AdminRooms() {
  const { data: rooms, isLoading, refetch } = useRooms();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [form] = Form.useForm<{ name: string; capacity: number }>();

  const openCreateModal = () => {
    setEditingRoom(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    form.setFieldsValue({ name: room.name, capacity: room.capacity });
    setModalOpen(true);
  };

  const handleSubmit = async (values: { name: string; capacity: number }) => {
    setSubmitting(true);
    try {
      if (editingRoom) {
        await updateRoom({ id: editingRoom.id, ...values });
        message.success("Cập nhật phòng thành công");
      } else {
        await createRoom(values);
        message.success("Thêm phòng thành công");
      }
      setModalOpen(false);
      form.resetFields();
      await refetch();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (room: Room) => {
    await updateRoom({ id: room.id, isActive: false });
    message.success(`Đã vô hiệu hóa ${room.name}`);
    await refetch();
  };

  const handleActivate = async (room: Room) => {
    await updateRoom({ id: room.id, isActive: true });
    message.success(`Đã kích hoạt lại ${room.name}`);
    await refetch();
  };

  const columns: ColumnsType<Room> = [
    { title: "Tên phòng", dataIndex: "name", key: "name" },
    { title: "Sức chứa", dataIndex: "capacity", key: "capacity" },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) =>
        isActive ? "Đang hoạt động" : "Ngừng hoạt động",
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, room) => (
        <Space>
          <Button size="small" onClick={() => openEditModal(room)}>
            Sửa
          </Button>
          {room.isActive ? (
            <Popconfirm
              title="Vô hiệu hóa phòng này?"
              description="Phòng sẽ không thể đặt mới sau khi vô hiệu hóa."
              onConfirm={() => handleDeactivate(room)}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Button size="small" danger>
                Vô hiệu hóa
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Kích hoạt lại phòng này?"
              description="Phòng sẽ có thể đặt lại sau khi kích hoạt."
              onConfirm={() => handleActivate(room)}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Button size="small" type="primary">
                Kích hoạt lại
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card title="Quản lý phòng họp">
      <Row justify="end" style={{ marginBottom: 16 }}>
        <Col>
          <Button type="primary" onClick={openCreateModal}>
            Thêm phòng mới
          </Button>
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={rooms}
        loading={isLoading}
        scroll={{ x: true }}
      />

      <Modal
        title={editingRoom ? "Sửa phòng" : "Thêm phòng mới"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingRoom ? "Lưu" : "Thêm"}
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Tên phòng"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên phòng" }]}
          >
            <Input placeholder="VD: Phòng Coda" />
          </Form.Item>

          <Form.Item
            label="Sức chứa"
            name="capacity"
            rules={[
              { required: true, message: "Vui lòng nhập sức chứa" },
              {
                type: "number",
                min: 1,
                message: "Sức chứa phải lớn hơn 0",
              },
            ]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

// src/components/CreateTaskModal.js
import React from 'react';
import { Modal, Form, Input, DatePicker, Button } from 'antd';
import moment from 'moment';

const CreateTaskModal = ({ visible, onCancel, onCreate, assignedToId }) => {
  const [form] = Form.useForm();

  const onFinish = (values) => {
    const taskData = {
      title: values.title,
      description: values.description,
      due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
      assigned_to_id: assignedToId,
    };
    onCreate(taskData);
    form.resetFields();
  };

  return (
    <Modal
      visible={visible}
      title="Create Task"
      okText="Create"
      cancelText="Cancel"
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          assigned_to_id: assignedToId,
        }}
      >
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: 'Please input the task title!' }]}
        >
          <Input placeholder="Enter task title" />
        </Form.Item>
        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please input the task description!' }]}
        >
          <Input.TextArea placeholder="Enter task description" rows={4} />
        </Form.Item>
        <Form.Item
          name="due_date"
          label="Due Date"
          rules={[{ required: true, message: 'Please select a due date!' }]}
        >
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>
  
      </Form>
    </Modal>
  );
};

export default CreateTaskModal;
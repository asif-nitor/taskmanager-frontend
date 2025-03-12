// src/components/CreateTaskModal.js
import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker } from 'antd';
import moment from 'moment';

const { Option } = Select;

const CreateTaskModal = ({ visible, onCancel, onCreate, assignedToId, task }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (task) {
      form.setFieldsValue({
        title: task.title,
        description: task.description,
        status: task.status,
        due_date: task.due_date ? moment(task.due_date) : null,
      });
    } else {
      form.resetFields();
    }
  }, [task, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const taskData = {
        ...values,
        assigned_to_id: assignedToId,
        due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
      };
      onCreate(taskData);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title={task ? 'Edit Task' : 'Create New Task'}
      visible={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      okText={task ? 'Update' : 'Create'}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: 'Please input the title!' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea />
        </Form.Item>
        {task ? (
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select a status!' }]}
          >
            <Select>
              <Option value="pending">Pending</Option>
              <Option value="in_progress">In Progress</Option>
              <Option value="completed">Completed</Option>
            </Select>
          </Form.Item>
        ) : null}
        <Form.Item name="due_date" label="Due Date">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateTaskModal;
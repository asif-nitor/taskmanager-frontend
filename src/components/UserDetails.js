import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchUserDetails, createTask, updateTask, fetchTaskDetails } from '../services/api';
import { Table, Button, Descriptions, notification, Tag, Space } from 'antd';
import CreateTaskModal from './CreateTaskModal';

const UserDetails = () => {
  const params = useParams();
  const userId = params.userId;
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    const loadUserDetails = async () => {
      setLoading(true);
      try {
        const response = await fetchUserDetails(userId);
        setUser({
          id: response.data.id,
          email: response.data.email,
          role: response.data.role,
        });
        setTasks(response.data.tasks || []);
        setError('');
      } catch (err) {
        console.error('Fetch User Details Error:', err.response || err);
        setError(err.response?.data?.error || 'Failed to fetch user details');
        api.open({
          message: 'Error',
          description: err.response?.data?.error || 'Failed to fetch user details',
          placement: 'topRight',
          duration: 20,
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserDetails();
  }, [userId]);

  const handleEditTask = async (taskId) => {
    console.log('Editing task with ID:', taskId); // Debug
    try {
      const response = await fetchTaskDetails(taskId);
      console.log('Task details fetched:', response.data); // Debug
      setEditingTask(response.data);
      setModalVisible(true);
    } catch (err) {
      console.error('Fetch Task Details Error:', err.response || err);
      api.open({
        message: 'Error',
        description: err.response?.data?.error || 'Failed to fetch task details',
        placement: 'topRight',
        duration: 20,
      });
    }
  };

  const handleCreateOrUpdateTask = async (taskData) => {
    try {
      let response;
      if (editingTask) {
        response = await updateTask(editingTask.id, taskData);
        setTasks(prevTasks =>
          prevTasks.map(task => (task.id === editingTask.id ? { ...task, ...response.data } : task))
        );
        api.open({
          message: 'Task Updated',
          description: `The task "${response.data.title}" has been updated successfully!`,
          placement: 'topRight',
          duration: 20,
        });
      } else {
        response = await createTask(taskData);
        setTasks(prevTasks => [
          { ...response.data, key: response.data.id },
          ...prevTasks,
        ]);
        api.open({
          message: 'Task Created',
          description: `The task "${response.data.title}" has been created successfully!`,
          placement: 'topRight',
          duration: 20,
        });
      }
      setModalVisible(false);
      setEditingTask(null);
      setError('');
    } catch (err) {
      console.error('Task Operation Error:', err.response || err);
      const errorMessage = err.response?.data?.errors?.join(', ') || err.response?.data?.error || 'Failed to perform task operation';
      api.open({
        message: 'Error',
        description: errorMessage,
        placement: 'topRight',
        duration: 20,
      });
      setError(errorMessage);
    }
  };

  const taskColumns = [
    { title: 'Task ID', dataIndex: 'id', key: 'id' },
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => (date ? new Date(date).toLocaleDateString() : 'N/A'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = status === 'completed' ? 'green' : status === 'in_progress' ? 'blue' : 'gray';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" onClick={() => handleEditTask(record.id)}>
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'red', textAlign: 'center', padding: '50px' }}>{error}</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      {contextHolder}
      <div style={{ maxWidth: 800, margin: '20px auto', padding: '20px' }}>
        <h2>User Details</h2>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="ID">{user.id}</Descriptions.Item>
          <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
          <Descriptions.Item label="Role">{user.role}</Descriptions.Item>
        </Descriptions>
        <Space size="middle">
          <Button
            type="primary"
            onClick={() => {
              setSelectedUserId(user.id);
              setEditingTask(null);
              setModalVisible(true);
            }}
          >
            Create Task
          </Button>
        </Space>

        <h3 style={{ marginTop: '20px' }}>Assigned Tasks</h3>
        <Table
          dataSource={tasks}
          columns={taskColumns}
          rowKey="id"
          pagination={{ pageSize: 20 }}
          locale={{ emptyText: 'No tasks assigned to this user' }}
        />

        <CreateTaskModal
          visible={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setSelectedUserId(null);
            setEditingTask(null);
          }}
          onCreate={handleCreateOrUpdateTask}
          assignedToId={selectedUserId}
          task={editingTask}
        />

        <Button
          type="default"
          onClick={() => navigate('/users')}
          style={{ marginTop: '20px' }}
        >
          Back to User List
        </Button>
      </div>
    </>
  );
};

export default UserDetails;
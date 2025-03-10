// src/components/UserDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchUserDetails, createTask, updateTask } from '../services/api';
import { Table, Button, Descriptions, notification,Tag, Space } from 'antd';
import CreateTaskModal from './CreateTaskModal';

const UserDetails = () => {
  const params = useParams(); // Get all params for debugging
  const userId = params.userId;
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const navigate = useNavigate();
  const [modalVisible, setModalVisible] = useState(false);

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
        debugger
        setError('');
      } catch (err) {
        console.error('Fetch User Details Error:', err.response || err);
        setError(err.response?.data?.error || 'Failed to fetch user details');
        notification.error({
          message: 'Error',
          description: err.response?.data?.error || 'Failed to fetch user details',
          placement: 'topRight',
          duration: 3,
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserDetails();
  }, [userId]);

  const handleCreateTask = async (taskData) => {
    try {
      const response = await createTask(taskData);
      console.log('Task Created:', response.data);
      // openNotification(taskData);
      setTasks(prevData => ({
        ...prevData,
        tasks: [...(prevData.tasks || []), response.data.data],
      }));
      
      setModalVisible(false);
      setError('');
      // window.location.reload();
    } catch (err) {
      console.error('Create Task Error:', err.response || err);
      const errorMessage = err.response?.data?.errors?.join(', ') || err.response?.data?.error || 'Failed to create task';
      // notification.error({
      //   message: 'Error',
      //   description: errorMessage,
      //   placement: 'topRight',
      //   duration: 3,
      // });
      setError(errorMessage);
    }
  };

  // Columns for the task list
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
    
    // {
    //   title: 'Assigned By',
    //   dataIndex: 'assigned_by',
    //   key: 'assigned_to',
    //   render: (assigned_by) => `${assigned_by.email || 'Unassigned'}`,
    // },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            onClick={() => {
              setSelectedUserId(record.id);
              setModalVisible(true);
            }}
          >
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
        }}
        onCreate={handleCreateTask}
        assignedToId={selectedUserId}
      />

      <Button
        type="default"
        onClick={() => navigate('/users')} // Navigate back to UserList
        style={{ marginTop: '20px' }}
      >
        Back to User List
      </Button>
    </div>
  );
};

export default UserDetails;
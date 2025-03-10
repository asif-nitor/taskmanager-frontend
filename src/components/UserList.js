// src/components/UserList.js
import React, { useState, useEffect, createContext } from 'react';
import { fetchUsers, createTask } from '../services/api';
import { Space, Table, Button, notification, Input } from 'antd';
import CreateTaskModal from './CreateTaskModal';
import { useNavigate } from 'react-router-dom';

const NotificationContext = createContext({
  taskTitle: 'New Task',
});

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [notificationApi, contextHolder] = notification.useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [taskTitle, setTaskTitle] = useState('New Task');
  const navigate = useNavigate(); 

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const response = await fetchUsers({q: searchQuery});
        setUsers(response.data);
        setError('');
      } catch (err) {
        console.log("Error", err.response)
        setError(err.response?.data?.error || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [searchQuery]);

  const openNotification = (taskData) => {
    setTaskTitle(taskData.title); // Update task title for notification
    notificationApi.info({
      message: `Task Created: ${taskData.title}`,
      description: (
        <NotificationContext.Consumer>
          {({ taskTitle }) => `The task "${taskTitle}" has been created successfully!`}
        </NotificationContext.Consumer>
      ),
      placement: 'topRight',
      duration: 10,
    });
  };

  const handleCreateTask = async (taskData) => {
    try {
      const response = await createTask(taskData);
      console.log('Task Created:', response.data);
      openNotification(taskData);
      setModalVisible(false);
      setError('');
    } catch (err) {
      console.error('Create Task Error:', err.response || err);
      const errorMessage = err.response?.data?.errors?.join(', ') || err.response?.data?.error || 'Failed to create task';
      notification.error({
        message: 'Error',
        description: errorMessage,
        placement: 'topRight',
        duration: 3,
      });
      setError(errorMessage);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
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
            Create Task
          </Button>
          <Button
            type="primary"
            onClick={() => navigate(`/users/${record.id}`)}
          >
            View Details
          </Button>
          {/*<a>Delete</a>*/}
        </Space>
      ),
    },
  ];

  return (

    <NotificationContext.Provider value={{ taskTitle }}>
      {contextHolder}
      <div style={{ maxWidth: 800, margin: '20px auto', padding: '20px' }}>
        <h2>User List</h2>
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        <Space.Compact block>
          <Input
            placeholder="Search by user's email"
            value={searchQuery}
            onChange={handleSearch}
            style={{ width: '30%', marginBottom: '20px' }}
          />
        </Space.Compact>
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
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
      </div>
    </NotificationContext.Provider>
  );
};

export default UserList;
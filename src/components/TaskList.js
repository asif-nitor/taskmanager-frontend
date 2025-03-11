// src/components/TaskList.js
import React, { useState, useEffect } from 'react';
import { Space, Table, Tag, Input, Select, DatePicker, notification, message, Popconfirm, Button, Alert } from 'antd';
import { fetchTasks, updateTask, fetchTaskDetails } from '../services/api';
import { useActionCable } from '../utils/ActionCableContext';
import CreateTaskModal from './CreateTaskModal';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { Option } = Select;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const { cable } = useActionCable(); // Only need cable here
  const [api, contextHolder] = notification.useNotification();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const user = localStorage.getItem('user');
  const userData = JSON.parse(user);
  const userRole = userData.role;

  // Fetch initial tasks
  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        const [startDate, endDate] = dateRange || [null, null];
        const response = await fetchTasks({
          q: searchQuery,
          status: statusFilter,
          start_date: startDate ? startDate.format('YYYY-MM-DD') : '',
          end_date: endDate ? endDate.format('YYYY-MM-DD') : '',
        });
        const formattedTasks = response.data.map(task => ({
          ...task,
          key: task.id,
        }));
        setTasks(formattedTasks);
        setError('');
      } catch (err) {
        console.error('Fetch Tasks Error:', err.response || err);
        setError(err.response?.data?.error || 'Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, [searchQuery, statusFilter, dateRange]);

  // Handle ActionCable subscription
  useEffect(() => {
    if (!cable) {
      console.log('Cable not available');
      return;
    }

    console.log('Subscribing to TaskChannel');
    const subscription = cable.subscriptions.create(
      { channel: 'TaskChannel' },
      {
        connected: () => console.log('Connected to TaskChannel'),
        disconnected: () => console.log('Disconnected from TaskChannel'),
        received: (data) => {
          console.log('Received data:', data);
          if (data.action === 'task_assigned') {
            console.log('Task assigned detected:', data);
            openNotification(data);
            setTasks((prev) => {
              const newTasks = [...prev, { ...data.task, key: data.task.id }];
              console.log('Updated tasks:', newTasks);
              return newTasks;
            });
          }
        },
      }
    );

    return () => {
      console.log('Unsubscribing from TaskChannel');
      subscription.unsubscribe();
    };
  }, [cable]); // Depend on cable to re-subscribe if it changes

  const openNotification = (data) => {
    console.log('Opening notification with:', data);
    api.open({
      message: data.task.title, // Use data.task.title instead of data.title
      description: data.message,
      placement: 'topRight',
      duration: 20,
    });
  };

  const handleSearch = (e) => setSearchQuery(e.target.value);
  const handleStatusChange = (value) => setStatusFilter(value);
  const handleDateRangeChange = (dates) => setDateRange(dates);

  // const confirm = (e) => {
  //   console.log(e);
  //   message.success('Click on Yes');
  // };

  const statusTransitions = {
    pending: { next: 'in_progress', display: 'In Progress' },
    in_progress: { next: 'completed', display: 'Complete' },
  };

  const handleMoveTask = async (taskId, newStatus) => {
    try {
      const updatedTaskData = { status: newStatus };
      const response = await updateTask(taskId, updatedTaskData);
      setTasks(prevTasks =>
        prevTasks.map(task => (task.id === taskId ? { ...task, ...response.data } : task))
      );
      message.success('Task status updated successfully');
    } catch (err) {
      console.error('Update Task Error:', err.response || err);
      message.error('Failed to update task status');
    }
  };

  // const handleEditTask = (taskId) => {
  //   console.log(`Editing task with ID: ${taskId}`);
  //   // Replace with logic to open a modal or navigate to an edit page
  // };

   const handleEditTask = async (taskId) => {
    console.log('Editing task with ID:', taskId); // Debug
    try {
      const response = await fetchTaskDetails(taskId);
      console.log('Task details fetched:', response.data); // Debug
      setEditingTask(response.data);
      debugger
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

  const cancel = (e) => {
    console.log(e);
    message.error('Click on No');
  };

  const handleUpdateTask = async (taskData) => {
    debugger
    try {
      let response;
      if (editingTask) {
        response = await updateTask(editingTask.id, taskData);
        debugger
        setTasks(prevTasks =>
          prevTasks.map(task => (task.id === editingTask.id ? { ...task, ...response.data } : task))
        );
        api.open({
          message: 'Task Updated',
          description: `The task "${response.data.title}" has been updated successfully!`,
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

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title', render: (text) => <a>{text}</a> },
    { title: 'Description', dataIndex: 'description', key: 'description' },
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
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => (date ? new Date(date).toLocaleDateString() : 'N/A'),
    },
    {
      title: 'Assigned To',
      dataIndex: 'assigned_to',
      key: 'assigned_to',
      render: (assigned_to) => assigned_to?.email || 'Unassigned',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => {
        if (userRole === 'user' && record.status in statusTransitions) {
          const { next, display } = statusTransitions[record.status];
          const buttonText = `Move To ${display}`;
          return (
            <Space size="middle">
              <Popconfirm
                title="Move task"
                description={`Are you sure to move this task to ${display.toLowerCase()}?`}
                onConfirm={() => handleMoveTask(record.id, next)}
                onCancel={cancel}
                okText="Yes"
                cancelText="No"
              >
                <Button danger>{buttonText}</Button>
              </Popconfirm>
            </Space>
          );
        }
        // For admins or managers
        else if (userRole === 'admin' || userRole === 'manager') {
          return (
            <Space size="middle">
              <Button type="primary" onClick={() => handleEditTask(record.id)}>
                Edit
              </Button>
            </Space>
          );
        }
        // For completed tasks or other roles
        else {
          return <Space size="middle"><Alert message="Completed" type="success" /></Space>;
        }
      },
    },
  ];

  return (
    <>
      {contextHolder} {/* Must be at the root for notifications to work */}
      <div style={{ maxWidth: 1000, margin: '20px auto', padding: '20px' }}>
        <h2>Task List</h2>
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        <Space.Compact block>
          <Input
            placeholder="Search by assigned user's email"
            value={searchQuery}
            onChange={handleSearch}
            style={{ width: '30%', marginBottom: '20px' }}
          />
          <DatePicker.RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            format="YYYY-MM-DD"
            style={{ width: '45%', marginBottom: '20px' }}
          />
          <Select
            placeholder="Filter by status"
            value={statusFilter}
            onChange={handleStatusChange}
            style={{ width: '25%', marginBottom: '20px' }}
            allowClear
          >
            <Option value="pending">Pending</Option>
            <Option value="in_progress">In Progress</Option>
            <Option value="completed">Completed</Option>
          </Select>
        </Space.Compact>
        <Table
          columns={columns}
          dataSource={tasks}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />

        <CreateTaskModal
          visible={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            // setSelectedUserId(null);
            setEditingTask(null);
          }}
          onCreate={handleUpdateTask}
          // assignedToId={selectedUserId}
          task={editingTask}
        />
      </div>
    </>
  );
};

export default TaskList;
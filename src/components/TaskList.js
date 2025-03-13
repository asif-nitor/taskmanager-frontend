import React, { useState, useEffect } from 'react';
import { Space, Table, Tag, Input, Select, DatePicker, notification, message, Popconfirm, Button, Alert } from 'antd';
import { fetchTasks, updateTask, fetchTaskDetails, deleteTask } from '../services/api';
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
  const user = JSON.parse(localStorage.getItem('user'));
  const userRole = user.role;

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
          } else if (data.action === 'task_updated') {
            console.log('Task updated detected:', data);
            openNotification(data);
            setTasks((prev) =>
              prev.map(task => (task.id === data.task.id ? { ...task, ...data.task, key: task.id } : task))
            );
          } else if (data.action === 'status_updated') {
            console.log('Status updated detected:', data);
            openNotification(data);
            setTasks((prev) =>
              prev.map(task => (task.id === data.task.id ? { ...task, ...data.task, key: task.id } : task))
            );
          }
        },
      }
    );

    return () => {
      console.log('Unsubscribing from TaskChannel');
      subscription.unsubscribe();
    };
  }, [cable, user.id]);

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
      api.open({
        message: 'Status Updated',
        description: `The task status moved to ${newStatus} successfully!`,
        placement: 'topRight',
        duration: 20,
      });
    } catch (err) {
      console.error('Update Task Error:', err.response || err);
      api.open({
        message: 'Error',
        description: err.response?.data?.error || 'Failed to fetch task details',
        placement: 'topRight',
        duration: 20,
      });
    }
  };

   const handleEditTask = async (taskId) => {
    try {
      const response = await fetchTaskDetails(taskId);
      console.log('Task details fetched:', response.data);
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

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId); // Call the DELETE API
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId)); // Remove task from state
      api.open({
        message: 'Task Deleted',
        description: `The task has been deleted successfully!`,
        placement: 'topRight',
        duration: 20,
      });
    } catch (err) {
      console.error('Delete Task Error:', err.response || err);
      const errorMessage = err.response?.data?.alert || 'Failed to delete task';
      api.open({
        message: 'Error',
        description: errorMessage,
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
    userRole === 'user'
    ? {
        title: 'Assigned By',
        dataIndex: 'assigned_by',
        key: 'assigned_by',
        render: (assigned_by) => assigned_by?.email || 'Unassigned',
      } :
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
              <Space size="middle">
              <Popconfirm
                title="Delete Task"
                description={`Are you sure?`}
                onConfirm={() => handleDeleteTask(record.id)}
                onCancel={cancel}
                okText="Yes"
                cancelText="No"
              >
                <Button danger>Delete</Button>
              </Popconfirm>
            </Space>

              {/*<Button type="primary" onClick={() => handleDeleteTask(record.id)}>
                Delete
              </Button>*/}
            </Space>
          );
        }
        else {
          return <Space size="middle"><Alert message="Completed" type="success" /></Space>;
        }
      },
    },
  ];

  return (
    <>
      {contextHolder}
      <div style={{ maxWidth: 1000, margin: '20px auto', padding: '20px' }}>
        <h2>Task List</h2>
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        <Space.Compact block>
          { (userRole === 'admin' || userRole === 'manager') && (
            <Input
              placeholder="Search by assigned user's email"
              value={searchQuery}
              onChange={handleSearch}
              style={{ width: '30%', marginBottom: '20px' }}
            />
          )}
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
          pagination={{ pageSize: 20 }}
        />

        <CreateTaskModal
          visible={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setEditingTask(null);
          }}
          onCreate={handleUpdateTask}
          task={editingTask}
        />
      </div>
    </>
  );
};

export default TaskList;
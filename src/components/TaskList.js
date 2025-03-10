// src/components/TaskList.js
import React, { useState, useEffect, createContext } from 'react';
import { Space, Table, Tag, Input, Col, Row, Select, DatePicker, notification } from 'antd';
import { fetchTasks } from '../services/api';
import { useActionCable } from '../utils/ActionCableContext';

const NotificationContext = createContext({
  taskTitle: 'New Task',
});

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const { Option } = Select;
  const { cable, notifications } = useActionCable();
  const [taskTitle, setTaskTitle] = useState('New Task');
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        const [startDate, endDate] = dateRange || [null, null];
        const response = await fetchTasks({q: searchQuery, status: statusFilter, start_date: startDate ? startDate.format('YYYY-MM-DD') : '', end_date: endDate ? endDate.format('YYYY-MM-DD') : '',});
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
    if (cable) {
      const subscription = cable.subscriptions.create(
        { channel: 'TaskChannel' },
        {
          received: (data) => {
            if (data.action === 'task_assigned') {
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
        subscription.unsubscribe();
      };
    }
  }, []);

  const openNotification = (data) => {
    debugger
    api.open({
      message: data.title,
      description: data.message,
      duration: 20,
    });
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
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
      render: (assigned_to) => `${assigned_to.email || 'Unassigned'}`,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <a>Edit</a>
          <a>Delete</a>
        </Space>
      ),
    },
  ];

  return (
    <NotificationContext.Provider value={{ taskTitle }}>
      {contextHolder}
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
          style={{
            width: '45%',
            marginBottom: '20px'
          }}
        />
        <Select
          placeholder="Filter by status"
          value={statusFilter}
          onChange={handleStatusChange}
          style={{ idth: '25%', marginBottom: '20px' }}
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
    </div>
    </NotificationContext.Provider>
  );
};

export default TaskList;
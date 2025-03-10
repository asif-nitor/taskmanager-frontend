// src/components/SignIn.js
import React, { useState, createContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../services/api';
import { Button, Checkbox, Form, Input, notification } from 'antd';

const NotificationContext = createContext({
  userEmail: 'User',
});

const SignIn = ({ setUser }) => {
  const [form] = Form.useForm(); // Ant Design form instance
  const [error, setError] = useState(''); // Error state for API failures
  const navigate = useNavigate();
  const [notificationApi, contextHolder] = notification.useNotification();

  const openNotification = (userEmail) => {
    notificationApi.info({
      message: `Sign-in Successful`,
      description: (
        <NotificationContext.Consumer>
          {({ userEmail }) => `Welcome back, ${userEmail}!`}
        </NotificationContext.Consumer>
      ),
      placement: 'topRight',
      duration: 10,
    });
  };

  const onFinish = async (values) => {
    try {
      const response = await signIn({
        email: values.email,
        password: values.password,
      });
      const { token, data: user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      setError('');
      openNotification(user.email);
      debugger
      navigate('/tasks');
    } catch (err) {
      console.error('Sign-in Error:', err.response || err);
      const errorMessage = err.response?.data?.error || 'Sign-in failed';
      notificationApi.error({
        message: 'Sign-in Error',
        description: errorMessage,
        placement: 'topRight',
        duration: 10,
      });
      setError(errorMessage);
      form.setFields([{ name: 'password', errors: [errorMessage] }]);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <NotificationContext.Provider value={{ userEmail: form.getFieldValue('email') || 'User' }}>
      {contextHolder}
      <div style={{ maxWidth: 600, margin: '50px auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Sign In</h2>
        <Form
          form={form}
          name="basic"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input placeholder="Enter your email" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password placeholder="Enter your password" />
          </Form.Item>

          {/*<Form.Item name="remember" valuePropName="checked" label={null}>
            <Checkbox>Remember me</Checkbox>
          </Form.Item>*/}

          <Form.Item label={null} wrapperCol={{ offset: 8, span: 16 }}>
            <Button type="primary" htmlType="submit">
              Sign In
            </Button>
          </Form.Item>

          {error && (
            <p style={{ color: 'red', textAlign: 'center', marginTop: 10 }}>
              {error}
            </p>
          )}
        </Form>
      </div>
    </NotificationContext.Provider>
  );
};

export default SignIn;
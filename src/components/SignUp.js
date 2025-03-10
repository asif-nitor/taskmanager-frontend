// src/components/SignUp.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp } from '../services/api';
import { Button, Form, Input } from 'antd';

const SignUp = ({ setUser }) => {
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const response = await signUp({
        email: values.email,
        password: values.password,
        password_confirmation: values.passwordConfirmation
      });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      setError('');
      navigate('/sign_in');
    } catch (err) {
      console.error('Sign-un Error:', err.response || err);
      setError(err.response?.data?.errors?.join(', ') || 'Sign-up failed');
      form.setFields([{ name: 'email', errors: [error] }]);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '50px auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Sign Up</h2>
      <Form
        form={form}
        name="signup"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Please input a valid email!' }]}>
          <Input placeholder="Enter your email" />
        </Form.Item>
        <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Please input your password!' }]}>
          <Input.Password placeholder="Enter your password" />
        </Form.Item>
        <Form.Item label="Confirm Password" name="passwordConfirmation" rules={[{ required: true, message: 'Please confirm your password!' }]}>
          <Input.Password placeholder="Confirm your password" />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit">
            Sign Up
          </Button>
        </Form.Item>
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      </Form>
    </div>
  );
};

export default SignUp;
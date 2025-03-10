// src/contexts/ActionCableContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { createConsumer } from '@rails/actioncable';

const ActionCableContext = createContext();

export const ActionCableProvider = ({ children }) => {
  const [cable, setCable] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token'); // Assuming JWT token is stored
    const consumer = createConsumer(`ws://localhost:4000/cable?token=${token}`);
    console.log("consumer", consumer)
    setCable(consumer);

    return () => {
      consumer.disconnect();
    };
  }, []);

  const addNotification = (notification) => {
    setNotifications((prev) => [...prev, notification]);
  };

  return (
    <ActionCableContext.Provider value={{ cable, notifications, addNotification }}>
      {children}
    </ActionCableContext.Provider>
  );
};

export const useActionCable = () => useContext(ActionCableContext);
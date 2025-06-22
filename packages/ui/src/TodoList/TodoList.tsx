import { Checkbox, Flex, List, message, Typography, Button, Modal } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { client } from '../apiClient';
import type { InferResponseType } from 'hono';

type Todos = Exclude<
  InferResponseType<typeof client.todos.$get>,
  { error: string }
>;

export const TodoList = () => {
  const [todos, setTodos] = useState<Todos>([]);
  const [messageApi, messageContext] = message.useMessage();
  const [modalApi, modalContext] = Modal.useModal();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const fetchTodos = async () => {
      const response = await client.todos.$get(
        {},
        { headers: { authorization: `Bearer ${token}` } },
      );
      const todos = await response.json();
      setTodos(todos as Todos);
    };

    fetchTodos();
  }, []);

  const handleComplete = async (id: number, checked: boolean) => {
    const token = localStorage.getItem('token');
    const response = await client.todos.$patch(
      { json: { id, status: checked ? 'completed' : 'inprogress' } },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );

    const result = await response.json();
    if (response.status !== 200) {
      messageApi.open({
        type: 'error',
        content: (result as { error: string })?.error ?? 'Unknown error',
      });
      return;
    }
    setTodos(
      todos.map((todo) =>
        todo.id === (result as Todos[number]).id
          ? (result as Todos[number])
          : todo,
      ),
    );
    messageApi.open({
      type: 'success',
      content: 'Todo has been updated',
    });
  };

  const handleDeleteTodo = async (id: number) => {
    const confirmed = await modalApi.confirm({
      title: 'Delete todo?',
    });
    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem('token');
    const response = await client.todos.$delete(
      { json: { id } },
      { headers: { authorization: `Bearer ${token}` } },
    );
    const result = await response.json();
    if (response.status !== 200) {
      messageApi.open({
        type: 'error',
        content: (result as { error: string })?.error ?? 'Unknown error',
      });
      return;
    }
    messageApi.open({
      type: 'info',
      content: 'Todo has been deleted',
    });

    setTodos(todos.filter((todo) => todo.id !== id));
  };

  return (
    <>
      {messageContext}
      {modalContext}
      <List
        dataSource={todos}
        renderItem={(item) => (
          <List.Item>
            <Flex>
              <Flex vertical align="start">
                <Typography.Title level={5}>{item.title}</Typography.Title>
                <Typography.Text>{item.body}</Typography.Text>
              </Flex>
            </Flex>
            <Flex align="center">
              <Checkbox
                onChange={(event) =>
                  handleComplete(item.id, event.target.checked)
                }
                checked={item.status === 'completed'}
              >
                Completed
              </Checkbox>
              <Button
                icon={<DeleteOutlined />}
                danger
                onClick={() => handleDeleteTodo(item.id)}
              />
            </Flex>
          </List.Item>
        )}
      />
    </>
  );
};

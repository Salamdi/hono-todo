import { Checkbox, Flex, List, message, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { client } from '../apiClient';
import type { InferResponseType } from 'hono';

type Todos = InferResponseType<typeof client.todos.$get>;

export const TodoList = () => {
  const [todos, setTodos] = useState<Todos>([]);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const fetchTodos = async () => {
      const response = await client.todos.$get(
        {},
        { headers: { authorization: `Bearer ${token}` } },
      );
      const todos = await response.json();
      setTodos(todos);
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
    setTodos(todos.map((todo) => (todo.id === result.id ? result : todo)));
    messageApi.open({
      type: 'success',
      content: 'Todo has been updated',
    });
  };

  return (
    <>
      {contextHolder}
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
              />
            </Flex>
          </List.Item>
        )}
      />
    </>
  );
};

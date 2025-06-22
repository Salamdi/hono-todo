import { client } from '../apiClient';
import { Button, Form, Input, message, Tabs, type TabsProps } from 'antd';
import { TodoList } from '../TodoList';

export const Main = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<{
    title: string;
    body: string;
  }>();

  const handleAddTodo = async (values: { title: string; body: string }) => {
    const token = localStorage.getItem('token');
    const response = await client.todos.$post(
      { json: values },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );

    const result = await response.json();
    if (response.status !== 201) {
      messageApi.open({
        type: 'error',
        content: (result as { error: string })?.error ?? 'Unknown error',
      });
      return;
    }
    messageApi.open({
      type: 'success',
      content: 'Todo has benn added',
    });

    form.resetFields();
  };

  const tabItems: TabsProps['items'] = [
    {
      key: 'list',
      label: 'Todo List',
      destroyOnHidden: true,
      children: <TodoList />,
    },
    {
      key: 'addTodo',
      label: 'Add Todo',
      children: (
        <Form onFinish={handleAddTodo} form={form}>
          <Form.Item
            label="title"
            name="title"
            rules={[{ required: true, message: 'Please add a title!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="description"
            name="body"
            rules={[{ required: true, message: 'Please add a description!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit">Add</Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Tabs items={tabItems} />
    </>
  );
};

import { Button, Form, Input, message, Tabs, type TabsProps } from 'antd';
import { client } from '../apiClient';

interface AuthProps {
  onAuth: (token: string) => void;
}

export const Auth = ({ onAuth }: AuthProps) => {
  const [messageApi, contextHolder] = message.useMessage();

  const handleLogin = async (values: { username: string }) => {
    const response = await client.auth.login.$post({ json: values });
    const result = await response.json();
    if (response.status !== 200) {
      messageApi.open({
        type: 'error',
        content: (result as { error: string })?.error ?? 'Unknown error',
      });
      return;
    }
    const { token } = result as { token: string };
    onAuth(token);
    localStorage.setItem('token', token);
  };

  const handleSignup = async (values: { username: string }) => {
    const response = await client.users.$post({ json: values });
    const result = await response.json();
    if (response.status !== 201) {
      messageApi.open({
        type: 'error',
        content: (result as { error: string })?.error ?? 'Unknown error',
      });
      return;
    }
    const { token } = result as { token: string };
    onAuth(token);
    localStorage.setItem('token', token);
  };

  const tabItems: TabsProps['items'] = [
    {
      key: 'login',
      label: 'Login',
      children: (
        <Form onFinish={handleLogin}>
          <Form.Item
            label="username"
            name="username"
            rules={[{ required: true, message: 'Please type your name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit">Login</Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'signup',
      label: 'Signup',
      children: (
        <Form onFinish={handleSignup}>
          <Form.Item
            label="username"
            name="username"
            rules={[{ required: true, message: 'Please type your name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit">Signup</Button>
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

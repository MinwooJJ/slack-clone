import React, { useCallback, useState } from 'react';
import { Form, Error, Label, Input, LinkContainer, Button, Header } from './styles';
import axios from 'axios';
import useInput from '@hooks/useInput';
import { Link, Redirect } from 'react-router-dom';
import useSWR, { mutate } from 'swr';
import fetcher from '@utils/fetcher';

const LogIn = () => {
  const { data, revalidate } = useSWR('/api/users', fetcher, {
    dedupingInterval: 10000,
  });
  const [logInError, setLogInError] = useState(false);
  const [email, onChangeEmail] = useInput(''); // custom hook
  const [password, onChangePassword] = useInput('');

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setLogInError(false);
      axios
        .post('/api/users/login', { email, password })
        .then((response) => {
          revalidate();
        })
        .catch((error) => {
          setLogInError(error.response?.data?.statusCode === 401);
        });
    },
    [email, password],
  );

  if (data === undefined) {
    return <div>Loading...</div>;
  }

  if (data) {
    return <Redirect to="/workspace/sleact/channel/일반" />;
  }

  return (
    <div id="container">
      <Header>Sleact</Header>
      <Form onSubmit={onSubmit}>
        <Label id="email-label">
          <span>E-mail address</span>
          <div>
            <Input type="email" id="email" name="email" value={email} onChange={onChangeEmail} />
          </div>
        </Label>
        <Label id="password-label">
          <span>Password</span>
          <div>
            <Input type="password" id="password" name="password" value={password} onChange={onChangePassword} />
          </div>
          {logInError && <Error>Your e-mail and password do not match.</Error>}
        </Label>
        <Button type="submit">Sign in</Button>
      </Form>
      <LinkContainer>
        Don't have an account?&nbsp;
        <Link to="/signup">Sign up</Link>
      </LinkContainer>
    </div>
  );
};

export default LogIn;

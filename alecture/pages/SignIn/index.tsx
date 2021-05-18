import React, { useCallback, useState } from 'react';
import { Form, Error, Label, Input, LinkContainer, Button, Header } from '@pages/SignUp/styles';
import axios from 'axios';
import useInput from '@hooks/useInput';
import { Link, Redirect } from 'react-router-dom';
import useSWR, { mutate } from 'swr'; // 이쪽의 mutate는 범용적으로 쓸수 있는 mutate
import fetcher from '@utils/fetcher';

const LogIn = () => {
  const { data, error, revalidate, mutate } = useSWR('http://localhost:3095/api/users', fetcher, {
    dedupingInterval: 10000, // cash의 유지 기간, 이 시간에는 swr을 많이 호출해도 한 번만 요청보내고 나머지는 첫 번째 성공한 데이터 그대로 사용
  });
  const [logInError, setLogInError] = useState(false);
  const [email, onChangeEmail] = useInput('');
  const [password, onChangePassword] = useInput('');

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setLogInError(false);
      axios
        .post('/api/users/login', { email, password }, { withCredentials: true })
        .then((response) => {
          mutate(response.data, false); // 서버에 요청을 보내지 않고 데이터 수정
          // revalidate();       // 서버에 요청을 보내서 데이터를 가져오는 것
          // mutate('http://localhost:3095/api/users', response.data); // 범용적으로 사용시
        })
        .catch((error) => {
          setLogInError(error.response?.data?.statusCode === 401);
        });
    },
    [email, password],
  );

  // if there is case of 'false' data
  if (data == undefined) {
    return <div>Loading...</div>;
  }

  // after sign in
  if (data) {
    return <Redirect to="/workspace/channel" />;
  }
  // console.log(error, userData);
  // if (!error && userData) {
  //   console.log('로그인됨', userData);
  //   return <Redirect to="/workspace/sleact/channel/일반" />;
  // }

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

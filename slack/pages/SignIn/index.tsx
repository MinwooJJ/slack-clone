import React, { useCallback, useState } from 'react';
import { Form, Error, Label, Input, LinkContainer, Button, Header } from '@pages/SignUp/styles';
import axios from 'axios';
import useInput from '@hooks/useInput';
import { Link, Redirect } from 'react-router-dom';
import useSWR, { mutate } from 'swr'; // 이쪽의 mutate는 범용적으로 쓸수 있는 mutate
import fetcher from '@utils/fetcher';

const LogIn = () => {
  // revalidate: fetcher 함수 실행
  // 기타 옵션: errorRetryInterval, loadingTimeout, errorRetryCount
  // useSWR은 data의 값이 바뀌면 알아서 re-render 동작을 함
  const { data, error, revalidate, mutate } = useSWR('/api/users', fetcher, {
    dedupingInterval: 10000, // cash의 유지 기간, 이 시간에는 swr을 많이 호출해도 한 번만 요청보내고 나머지는 첫 번째 성공한 데이터 그대로 사용
  });
  const [logInError, setLogInError] = useState(false);
  const [email, onChangeEmail] = useInput(''); // custom hook
  const [password, onChangePassword] = useInput('');

  const onSubmit = useCallback(
    (e) => {
      // a tag or submit tag는 페이지 이동 및 input을 전송하는 동작이 기본적으로 있는데 그것을 막는 역할
      e.preventDefault();
      setLogInError(false);
      axios
        .post('/api/users/login', { email, password })
        .then((response) => {
          // mutate(response.data, false); // 서버에 요청을 보내지 않고 데이터 수정, 두 번째 인수는 데이터가 바뀐것이 있나 점검하는 것, 정해진 기간마다 데이터 확인을 위해 fetcher를 실행함
          revalidate(); // 서버에 요청을 보내서 데이터를 가져오는 것
          // mutate('http://localhost:3095/api/users', response.data); // 범용적으로 사용시
        })
        .catch((error) => {
          setLogInError(error.response?.data?.statusCode === 401);
        });
    },
    [email, password],
  );

  // if there is case of 'false' data
  // redirect시 data가 없는 경우 나은 사용자 경험을 위해 loading으로 처리 가능
  if (data === undefined) {
    return <div>Loading...</div>;
  }

  // after sign in
  if (data) {
    return <Redirect to="/workspace/sleact/channel/일반" />;
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
        {/* React-router에서는 a tag가 아닌 Link 사용, a 사용시 새로고침이 되어버리고 Link는 화면 변경만 */}
        <Link to="/signup">Sign up</Link>
      </LinkContainer>
    </div>
  );
};

export default LogIn;

import useInput from '@hooks/useInput';
import React, { useCallback, useState } from 'react';
import axios from 'axios';
import { Header, Form, Label, Input, LinkContainer, Button, Error, Success } from './styles';
import { Link, Redirect } from 'react-router-dom';
import useSWR from 'swr';
import fetcher from '@utils/fetcher';

const SignUp = () => {
  const { data, error, revalidate } = useSWR('/api/users', fetcher);

  const [email, onChangeEmail] = useInput('');
  const [nickname, onChangeNickname] = useInput('');
  const [password, setPassword] = useState('');
  const [passwordCheck, setPasswordCheck] = useState('');
  const [mismatchError, setMismatchError] = useState(false);
  const [signUpError, setSignUpError] = useState('');
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  // const onChangeEmail = useCallback((e) => {
  //   setEmail(e.target.value);
  // }, []);

  // const onChangeNickname = useCallback((e) => {
  //   setNickname(e.target.value);
  // }, []);

  const onChangePassword = useCallback(
    (e) => {
      setPassword(e.target.value);
      setMismatchError(e.target.value !== passwordCheck);
    },
    [passwordCheck],
  );

  const onChangePasswordCheck = useCallback(
    (e) => {
      setPasswordCheck(e.target.value);
      setMismatchError(e.target.value !== password);
    },
    [password],
  );

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();
      console.log(email, nickname, password, passwordCheck);
      if (!mismatchError && nickname) {
        // loading
        setSignUpError('');
        setSignUpSuccess(false);
        axios
          .post('/api/users', {
            email,
            nickname,
            password,
          })
          .then((response) => {
            // success
            setSignUpSuccess(true);
          })
          .catch((error) => {
            // fail
            setSignUpError(error.response.data);
          })
          .finally(() => {});
      }
    },
    [email, nickname, password, passwordCheck, mismatchError],
  );

  if (data == undefined) {
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
        <Label id="nickname-label">
          <span>Display Name</span>
          <div>
            <Input type="text" id="nickname" name="nickname" value={nickname} onChange={onChangeNickname} />
          </div>
        </Label>
        <Label id="password-label">
          <span>Password</span>
          <div>
            <Input type="password" id="password" name="password" value={password} onChange={onChangePassword} />
          </div>
        </Label>
        <Label id="password-check-label">
          <span>Confirm password</span>
          <div>
            <Input
              type="password"
              id="password-check"
              name="password-check"
              value={passwordCheck}
              onChange={onChangePasswordCheck}
            />
          </div>
          {!nickname && <Error>Name cannot be empty</Error>}
          {mismatchError && <Error>Passwords do not match</Error>}
          {signUpError && <Error>{signUpError}</Error>}
          {signUpSuccess && <Success>Congratulations, your account has been successfully created</Success>}
        </Label>
        <Button type="submit">Register</Button>
      </Form>
      <LinkContainer>
        Already have an account?&nbsp;
        <Link to="/signin">Sign in</Link>
      </LinkContainer>
    </div>
  );
};

export default SignUp;

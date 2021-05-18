// 로그인 후 쓰일 화면
import fetcher from '@utils/fetcher';
import axios from 'axios';
import React, { FC, useCallback } from 'react';
import { Redirect } from 'react-router';
import useSWR from 'swr';

const Workspace: FC = ({ children }) => {
  const { data, error, revalidate, mutate } = useSWR('http://localhost:3095/api/users', fetcher);

  const onLogout = useCallback(() => {
    axios.post('/api/users/logout', null, { withCredentials: true }).then(() => {
      // revalidate(); // false data
      mutate(false, false); // optimistic UI
    });
  }, []);

  if (!data) {
    return <Redirect to="/signin" />;
  }

  return (
    <div>
      <button onClick={onLogout}>log out</button>
      {children}
    </div>
  );
};

export default Workspace;

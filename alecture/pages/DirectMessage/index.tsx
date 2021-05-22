import React, { useCallback } from 'react';
import { Header } from './styles';
import gravatar from 'gravatar'; // random으로 icon을 만들어주는 API
import { useParams } from 'react-router';
import fetcher from '@utils/fetcher';
import useSWR from 'swr';
import { Container } from './styles';
import ChatBox from '@components/ChatBox';
import ChatList from '@components/ChatList';
import useInput from '@hooks/useInput';
import axios from 'axios';
import { IDM } from '@typings/db';

// DM display 부분
const DirectMessage = () => {
  const { workspace, id } = useParams<{ workspace: string; id: string }>();
  const { data: userData } = useSWR(`/api/workspaces/${workspace}/users/${id}`, fetcher);
  const { data: myData } = useSWR('/api/users', fetcher);
  // 공통적으로 쓰이는 data가 아닌 경우는 부모쪽에서 정의하여 props로 내린다
  const [chat, onChangeChat, setChat] = useInput('');
  // 채팅 데이터는 받아오는 api
  const {
    data: chatData,
    mutate: mutateChat,
    revalidate,
  } = useSWR<IDM[]>(`/api/workspaces/${workspace}/dms/${id}/chats?perPage=20&page=1`, fetcher);

  const onSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      if (chat?.trim()) {
        //dm 보내는 api
        axios
          .post(`/api/workspaces/${workspace}/dms/${id}/chats`, {
            content: chat,
          })
          .then(() => {
            // 채팅 등록 후 채팅 다시 받아오기
            revalidate();
            // 채팅 보낸 후 기존 데이터 초기화
            setChat('');
          })
          .catch(console.error);
      }
    },
    [chat],
  );

  // data error 혹은 loading중
  if (!userData || !myData) {
    return null;
  }

  return (
    <Container>
      <Header>
        <img src={gravatar.url(userData.email, { s: '24px', d: 'retro' })} alt={userData.nickname} />
        <span>{userData.nickname}</span>
      </Header>
      {/* 채팅 목록, 입력창*/}
      <ChatList />
      <ChatBox chat={chat} onSubmitForm={onSubmitForm} onChangeChat={onChangeChat} />
    </Container>
  );
};

export default DirectMessage;

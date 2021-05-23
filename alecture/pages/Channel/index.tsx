import ChatBox from '@components/ChatBox';
import ChatList from '@components/ChatList';
import useInput from '@hooks/useInput';
import React, { useCallback } from 'react';
import { Container, Header } from './styles';

const Channel = () => {
  const [chat, onChangeChat] = useInput('');
  const onSubmitForm = useCallback((e) => {
    e.preventDefault();
  }, []);

  return (
    // Workspace layout은 유지한채 channel 추가
    <Container>
      <Header>Channel</Header>
      {/* 채팅 목록, 입력창*/}
      {/* <ChatList chatSections={chatSections} />{' '} */}
      <ChatBox chat={chat} onSubmitForm={onSubmitForm} onChangeChat={onChangeChat} />
    </Container>
  );
};

export default Channel;

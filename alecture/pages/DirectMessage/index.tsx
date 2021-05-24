import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DragOver, Header, Container } from './styles';
import gravatar from 'gravatar'; // random으로 icon을 만들어주는 API
import { useParams } from 'react-router';
import fetcher from '@utils/fetcher';
import useSWR, { useSWRInfinite } from 'swr';
import ChatBox from '@components/ChatBox';
import ChatList from '@components/ChatList';
import useInput from '@hooks/useInput';
import axios from 'axios';
import { IDM } from '@typings/db';
import makeSection from '@utils/makeSection';
import Scrollbars from 'react-custom-scrollbars';
import useSocket from '@hooks/useSocket';

// DM display 부분
const DirectMessage = () => {
  const [dragOver, setDragOver] = useState(false);
  const { workspace, id } = useParams<{ workspace: string; id: string }>();
  const { data: userData } = useSWR(`/api/workspaces/${workspace}/users/${id}`, fetcher);
  const { data: myData } = useSWR('/api/users', fetcher);
  const scrollbarRef = useRef<Scrollbars>(null);
  // socket for DM 연결하기
  const [socket] = useSocket(workspace);
  // 공통적으로 쓰이는 data가 아닌 경우는 부모쪽에서 정의하여 props로 내린다
  const [chat, onChangeChat, setChat] = useInput('');
  // 채팅 데이터는 받아오는 api
  // infinite 사용시 첫 번째 인자가 함수가 되어야 함
  const {
    data: chatData,
    mutate: mutateChat,
    revalidate,
    setSize, // 페이지수를 바꿔주는 역할
  } = useSWRInfinite<IDM[]>(
    // index는 페이지 수, 채팅의 배열이 아닌 2차 배열이 됨 페이지 별로 나눠 짐
    // SWR은 [{id:1}, {id:2}...], infinite는 [[{id:1}, {id:2}], [{id:3}]...]
    (index) => `/api/workspaces/${workspace}/dms/${id}/chats?perPage=20&page=${index + 1}`,
    fetcher,
  );

  // infinite scrolling 사용 시 선언해주면 좋은 변수
  // 데이터가 총 45개이고 한 페이지에 20개씩이면
  // 20 + 20 + 5, empty는 아니지만 끝에 도달함( isReachingEnd === true)
  const isEmpty = chatData?.[0]?.length === 0; // 데이터가 비어있는 경우, 끝인 경우
  // undefiend 때문에 false
  const isReachingEnd = isEmpty || (chatData && chatData[chatData.length - 1]?.length < 20) || false;

  const onSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      // optimistic UI의 경우 server를 거치지 않고 화면에 먼저 보여주기 때문에 데이터를 만들어놔야 함
      if (chat?.trim() && chatData) {
        const savedChat = chat;
        mutateChat((prevChatData) => {
          // 가장 최신 데이터
          prevChatData?.[0].unshift({
            // DM 객체에 데이터를 넣어줌
            id: (chatData[0][0]?.id || 0) + 1,
            content: savedChat,
            SenderId: myData.id,
            Sender: myData,
            ReceiverId: userData.id,
            Receiver: userData,
            createdAt: new Date(),
          });
          return prevChatData;
        }, false) // optimistic 동작시에는 false로 놔야 데이터를 서버와 비교하지 않음
          .then(() => {
            // 채팅 보낸 후 기존 데이터 초기화
            setChat('');
            // 채팅 전송 후 scroolbar 가장 아래로
            scrollbarRef.current?.scrollToBottom();
          });

        //dm 보내는 api
        axios
          .post(`/api/workspaces/${workspace}/dms/${id}/chats`, {
            content: chat,
          })
          .then(() => {
            // 채팅 등록 후 채팅 다시 받아오기
            // 서버에서 데이터를 가져오는 것 실패 시 mutate 데이터도 삭제 됨
            revalidate();
          })
          .catch(console.error);
      }
    },
    [chat, chatData, myData, userData, workspace, id],
  );

  const onMessage = useCallback((data: IDM) => {
    // id: 상대방 아이디, 내 아이디가 아닌것, 위에서 내 아이디의 mutate는 이미 하고 있기 때문
    // 서버에서 데이터를 실시간으로 가져오는데 굳이 서버로 데이터를 요청 할 필요는 없음( revalidate x) --> mutate
    if (data.SenderId === Number(id) && myData.id !== Number(id)) {
      mutateChat((chatData) => {
        chatData?.[0].unshift(data);
        return chatData;
      }, false).then(() => {
        if (scrollbarRef.current) {
          if (
            // 내가 150px 이상 올렸을 경우 남이 채팅을 칠 경우 스크롤바가 내려가지 않고 이하면 내려감
            scrollbarRef.current.getScrollHeight() <
            scrollbarRef.current.getClientHeight() + scrollbarRef.current.getScrollTop() + 150
          ) {
            console.log('scrollToBottom!', scrollbarRef.current?.getValues());
            // 살짝 딜레이?? 최신화 왜 ??
            // 개체가 null 인듯 합니다,
            setTimeout(() => {
              scrollbarRef.current?.scrollToBottom();
            }, 50);
            // scrollbarRef.current.scrollToBottom();
          }
        }
      });
    }
  }, []);

  // socket 연결 후 dm보내기
  useEffect(() => {
    socket?.on('dm', onMessage);
    return () => {
      socket?.off('dm', onMessage);
    };
  }, [socket, onMessage]);

  // 로딩 시 scroll bar를 가장 아래로 내리는 부분
  useEffect(() => {
    if (chatData?.length === 1) {
      scrollbarRef.current?.scrollToBottom();
    }
  }, [chatData]);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      console.log(e);
      const formData = new FormData();
      if (e.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
          // If dropped items aren't files, reject them
          if (e.dataTransfer.items[i].kind === 'file') {
            const file = e.dataTransfer.items[i].getAsFile();
            console.log('... file[' + i + '].name = ' + file.name);
            formData.append('image', file);
          }
        }
      } else {
        // Use DataTransfer interface to access the file(s)
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          console.log('... file[' + i + '].name = ' + e.dataTransfer.files[i].name);
          formData.append('image', e.dataTransfer.files[i]);
        }
      }
      axios.post(`/api/workspaces/${workspace}/dms/${id}/images`, formData).then(() => {
        setDragOver(false);
        revalidate();
      });
    },
    [revalidate, workspace, id],
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    console.log(e);
    setDragOver(true);
  }, []);

  // data error 혹은 loading중
  if (!userData || !myData) {
    return null;
  }

  // chatDate.reverse() 해버리면 기존 배열이 바뀌어 버리므로 immutable한 방법으로
  // 2차원 배열 --> 1차원 배열 and reverse
  const chatSections = makeSection(chatData ? chatData.flat().reverse() : []);

  return (
    <Container onDrop={onDrop} onDragOver={onDragOver}>
      <Header>
        <img src={gravatar.url(userData.email, { s: '24px', d: 'retro' })} alt={userData.nickname} />
        <span>{userData.nickname}</span>
      </Header>
      <ChatList chatSections={chatSections} ref={scrollbarRef} setSize={setSize} isReachingEnd={isReachingEnd} />
      <ChatBox chat={chat} onChangeChat={onChangeChat} onSubmitForm={onSubmitForm} />
      {dragOver && <DragOver>Image Upload</DragOver>}
    </Container>
  );
};

export default DirectMessage;

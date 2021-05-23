import { CollapseButton } from '@components/DMList/styles';
import useSocket from '@hooks/useSocket';
// import useSocket from '@hooks/useSocket';
import { IUser, IUserWithOnline } from '@typings/db';
import fetcher from '@utils/fetcher';
import React, { FC, useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { NavLink } from 'react-router-dom';
import useSWR from 'swr';

const DMList: FC = () => {
  // router의 workspace 이름 가져오는 부분
  const { workspace } = useParams<{ workspace?: string }>();

  const {
    data: userData,
    error,
    revalidate,
    mutate,
  } = useSWR<IUser>('/api/users', fetcher, {
    dedupingInterval: 2000, // 2초
  });

  // workspace 참여 멤버들 불러오기
  // online인 유저들
  const { data: memberData } = useSWR<IUserWithOnline[]>(
    userData ? `/api/workspaces/${workspace}/members` : null,
    fetcher,
  );
  // useSocket은 공통으로 관리 됨, 다른 화면이 꺼져도 계속해서 유지 가능
  const [socket] = useSocket(workspace);
  // true면 멤버목록 숨기기, false면 보이기
  const [channelCollapse, setChannelCollapse] = useState(false);
  const [onlineList, setOnlineList] = useState<number[]>([]);

  const toggleChannelCollapse = useCallback(() => {
    setChannelCollapse((prev) => !prev);
  }, []);

  useEffect(() => {
    console.log('DMList: workspace 바꼈다', workspace);
    setOnlineList([]);
  }, [workspace]);

  // 다른 사람이 sign in 하였을 경우 DM list에 추가
  useEffect(() => {
    // on을 여러번하고 off를 하지 않으면 데이터를 연결한만큼 여러번 받는 경우가 생김, 항상 off 고려
    socket?.on('onlineList', (data: number[]) => {
      setOnlineList(data);
    });
    // socket?.on('dm', onMessage);
    // console.log('socket on dm', socket?.hasListeners('dm'), socket);
    return () => {
      // socket?.off('dm', onMessage);
      // console.log('socket off dm', socket?.hasListeners('dm'));
      // on이 있으면 그 데이터를 정리해주는 off도 존재
      socket?.off('onlineList');
    };
  }, [socket]);

  return (
    <>
      <h2>
        <CollapseButton collapse={channelCollapse} onClick={toggleChannelCollapse}>
          <i
            className="c-icon p-channel_sidebar__section_heading_expand p-channel_sidebar__section_heading_expand--show_more_feature c-icon--caret-right c-icon--inherit c-icon--inline"
            data-qa="channel-section-collapse"
            aria-hidden="true"
          />
        </CollapseButton>
        <span>Direct Messages</span>
      </h2>
      <div>
        {!channelCollapse &&
          memberData?.map((member) => {
            const isOnline = onlineList.includes(member.id);
            return (
              // NavLink가 자동으로 selected calssName을 부여해 줌
              <NavLink key={member.id} activeClassName="selected" to={`/workspace/${workspace}/dm/${member.id}`}>
                <i
                  // DM 아이디 점 들의 대한 icon className, 로그인 한 사용자는 초록불이 들어옴
                  className={`c-icon p-channel_sidebar__presence_icon p-channel_sidebar__presence_icon--dim_enabled c-presence ${
                    isOnline ? 'c-presence--active c-icon--presence-online' : 'c-icon--presence-offline'
                  }`}
                  aria-hidden="true"
                  data-qa="presence_indicator"
                  data-qa-presence-self="false"
                  data-qa-presence-active="false"
                  data-qa-presence-dnd="false"
                />
                <span>{member.nickname}</span>
                {member.id === userData?.id && <span> (Me)</span>}
              </NavLink>
            );
          })}
      </div>
    </>
  );
};

export default DMList;

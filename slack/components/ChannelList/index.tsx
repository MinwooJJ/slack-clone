// import useSocket from '@hooks/useSocket';
import { CollapseButton } from '@components/DMList/styles';
import { IChannel, IUser } from '@typings/db';
import fetcher from '@utils/fetcher';
import React, { FC, useCallback, useState } from 'react';
import { useParams } from 'react-router';
import { NavLink } from 'react-router-dom';
import useSWR from 'swr';

const ChannelList: FC = () => {
  const { workspace } = useParams<{ workspace?: string }>();
  // const [socket] = useSocket(workspace);
  // SWR은 불러온 데이터를 cashing하고 있다가 계속해서 재사용함, 여러 번 useSWR한다고 하여 데이터를 계속해서 불러오는것은 아님
  // 실시간성을 알아서 유지해주기 때문에 훨씬 편리한면도 있음
  const {
    data: userData,
    error,
    revalidate,
    mutate,
  } = useSWR<IUser>('/api/users', fetcher, {
    // 새로 요청을 보내고 싶은것은 dedupingInterval로 control 가능
    dedupingInterval: 2000, // 2초
  });
  const { data: channelData } = useSWR<IChannel[]>(userData ? `/api/workspaces/${workspace}/channels` : null, fetcher);
  const [channelCollapse, setChannelCollapse] = useState(false);

  const toggleChannelCollapse = useCallback(() => {
    setChannelCollapse((prev) => !prev);
  }, []);

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
        <span>Channels</span>
      </h2>
      <div>
        {!channelCollapse &&
          // map 사용시에 return tag는 최적화를 위해 컴포넌트로 뺴는것을 추천, 아래는 안 뺌
          channelData?.map((channel) => {
            return (
              <NavLink
                key={channel.name}
                activeClassName="selected"
                to={`/workspace/${workspace}/channel/${channel.name}`}
              >
                <span># {channel.name}</span>
              </NavLink>
            );
          })}
      </div>
    </>
  );
};

export default ChannelList;

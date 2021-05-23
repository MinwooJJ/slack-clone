// 로그인 후 쓰일 화면
import {
  AddButton,
  Channels,
  Chats,
  Header,
  LogOutButton,
  MenuScroll,
  ProfileImg,
  ProfileModal,
  RightMenu,
  WorkspaceButton,
  WorkspaceModal,
  WorkspaceName,
  Workspaces,
  WorkspaceWrapper,
} from './styles';
import fetcher from '@utils/fetcher';
import axios from 'axios';
import React, { VFC, useCallback, useState, useEffect } from 'react';
import { Redirect, Route, Switch, useParams } from 'react-router';
import useSWR from 'swr';
import gravatar from 'gravatar'; // random으로 icon을 만들어주는 API
import loadable from '@loadable/component';
import Menu from '@components/Menu';
import Modal from '@components/Modal';
import { Link } from 'react-router-dom';
import { IChannel, IUser } from '@typings/db';
import { Button, Label, Input } from '@pages/SignUp/styles';
import useInput from '@hooks/useInput';
import { toast } from 'react-toastify';
import CreateChannelModal from '@components/CreateChannelModal';
import InviteWorkspaceModal from '@components/InviteWorkspaceModal';
import InviteChannelModal from '@components/InviteChannelModal';
import ChannelList from '@components/ChannelList';
import DMList from '@components/DMList';
import useSocket from '@hooks/useSocket';

// code split은 router마다 진행
const Channel = loadable(() => import('@pages/Channel'));
const DirectMessage = loadable(() => import('@pages/DirectMessage'));

// Children이 필요 없는 component는 VFC 반대는 FC
const Workspace: VFC = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [showInviteWorkspaceModal, setShowInviteWorkspaceModal] = useState(false);
  const [showInviteChannelModal, setShowInviteChannelModal] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newWorkspace, onChangeNewWorkspace, setNewWorkspace] = useInput('');
  const [newUrl, onChangeNewUrl, setNewUrl] = useInput('');

  const { workspace } = useParams<{ workspace: string }>();
  // IUser or false 타입을 가질 수 있음, 2초마다 데이터 확인
  // SWR이 server로부터 가져온 data를 관리해주기 때문에 SWR만 추가해서 데이터를 가져와 관리 가능
  const {
    data: userData,
    error,
    revalidate,
    mutate,
  } = useSWR<IUser | false>('/api/users', fetcher, { dedupingInterval: 2000 });

  // SWR이 workspace와 channel 데이터를 관리해 줌
  // signin이 되지 않은 상태이면 요청하지 못함
  const { data: channelData } = useSWR<IChannel[]>(userData ? `/api/workspaces/${workspace}/channels` : null, fetcher);
  const { data: memberData } = useSWR<IUser[]>(userData ? `/api/workspaces/${workspace}/members` : null, fetcher);
  const [socket, disconnect] = useSocket(workspace);

  // sign in
  useEffect(() => {
    // socket이 undefined일 경우도 있으므로 확실히 있다는 것을 보장해주어야 함
    if (channelData && userData && socket) {
      // console.log(socket);
      socket.emit('login', { id: userData.id, channels: channelData.map((v) => v.id) });
    }
    // 내부에서 쓰이지 않는 외부 변수들의 경우는 넣어주어야 함 deps
  }, [socket, channelData, userData]);

  useEffect(() => {
    return () => {
      disconnect();
    };
    // workspace가 바뀔때 동작해야하므로
  }, [workspace, disconnect]);

  const onSignout = useCallback(() => {
    axios.post('/api/users/logout', null).then(() => {
      // revalidate(); // false data
      mutate(false, false); // optimistic UI
    });
  }, []);

  // toggle 함수
  const onClickUserProfile = useCallback(() => {
    setShowUserMenu((prev) => !prev);
  }, []);

  const onCloseUserProfile = useCallback((e) => {
    e.stopPropagation();
    setShowUserMenu(false);
  }, []);

  const onClickCreateWorkspace = useCallback(() => {
    setShowCreateWorkspaceModal(true);
  }, []);

  // 화면에 있는 모든 Modal을 닫는 method
  // 모든 modal이 공유함
  const onCloseModal = useCallback(() => {
    setShowCreateWorkspaceModal(false);
    setShowCreateChannelModal(false);
    setShowInviteWorkspaceModal(false);
    setShowInviteChannelModal(false);
  }, []);

  const onCreateWorkspace = useCallback(
    (e) => {
      e.preventDefault();
      // trim for space
      if (!newWorkspace || !newWorkspace.trim()) return;
      if (!newUrl || !newUrl.trim()) return;
      axios
        .post('/api/workspaces', {
          workspace: newWorkspace,
          url: newUrl,
        })
        .then(() => {
          revalidate();
          setShowCreateWorkspaceModal(false);
          setNewWorkspace('');
          setNewUrl('');
        })
        .catch((error) => {
          console.dir(error);
          toast.error(error.response?.data, { position: 'bottom-center' });
        });
    },
    [newWorkspace, newUrl],
  );

  const toogleWorkspaceModal = useCallback(() => {
    setShowWorkspaceModal((prev) => !prev);
  }, []);

  const onClickAddChannel = useCallback(() => {
    setShowCreateChannelModal(true);
  }, []);

  const onClickInviteWorkspace = useCallback(() => {
    setShowInviteWorkspaceModal(true);
  }, []);

  if (!userData) {
    return <Redirect to="/signin" />;
  }

  return (
    <div>
      <Header>
        <RightMenu>
          {/* event bubbling 현상에 의해 click이 일어남 */}
          <span onClick={onClickUserProfile}>
            <ProfileImg src={gravatar.url(userData.nickname, { s: '28px', d: 'retro' })} alt={userData.email} />
            {showUserMenu && (
              <Menu style={{ right: 0, top: 38 }} show={showUserMenu} onCloseModal={onCloseUserProfile}>
                {/* Menu 안에서 render */}
                <ProfileModal>
                  <img src={gravatar.url(userData.nickname, { s: '36px', d: 'retro' })} alt={userData.email} />
                  <div>
                    <span id="profile-name">{userData.nickname}</span>
                    <span id="profile-active">Active</span>
                  </div>
                </ProfileModal>
                <LogOutButton onClick={onSignout}>Sign out</LogOutButton>
              </Menu>
            )}
          </span>
        </RightMenu>
      </Header>
      <WorkspaceWrapper>
        <Workspaces>
          {/* axios에서 받은 데이터에 workspaces 정보가 포함되어 있고 받아서 표시, ? optional chaining을 이용해 데이터가 존재하지 않을 경우 오류를 막기 위함 */}
          {userData?.Workspaces.map((ws) => {
            return (
              <Link key={ws.id} to={`/workspace/${123}/channel/일반`}>
                {/* Workspace의 이름을 첫 글자를 따서 넣음 */}
                <WorkspaceButton>{ws.name.slice(0, 1).toUpperCase()}</WorkspaceButton>
              </Link>
            );
          })}
          <AddButton onClick={onClickCreateWorkspace}>+</AddButton>
        </Workspaces>
        <Channels>
          <WorkspaceName onClick={toogleWorkspaceModal}>Sleact</WorkspaceName>
          <MenuScroll>
            {/* component에 style props를 정의해야 적용이 가능, close modal의 경우 bubbling 조심 */}
            <Menu show={showWorkspaceModal} onCloseModal={toogleWorkspaceModal} style={{ top: 95, left: 80 }}>
              <WorkspaceModal>
                <h2>Sleact</h2>
                <button onClick={onClickInviteWorkspace}>Invite user to a workspace</button>
                <button onClick={onClickAddChannel}>Add channel</button>
                <button onClick={onSignout}>Sign out</button>
              </WorkspaceModal>
            </Menu>
            {/* data가 없을 수 있는 경우는 ? 추가 */}
            <ChannelList />
            <DMList />
          </MenuScroll>
        </Channels>
        <Chats>
          <Switch>
            <Route path="/workspace/:workspace/channel/:channel" component={Channel} />
            <Route path="/workspace/:workspace/dm/:id" component={DirectMessage} />
          </Switch>
        </Chats>
      </WorkspaceWrapper>
      <Modal show={showCreateWorkspaceModal} onCloseModal={onCloseModal}>
        <form onSubmit={onCreateWorkspace}>
          <Label id="workspace-label">
            <span>Name</span>
            <Input id="workspace" value={newWorkspace} onChange={onChangeNewWorkspace} />
          </Label>
          <Label id="workspace-url-label">
            <span>URL</span>
            <Input id="workspace" value={newUrl} onChange={onChangeNewUrl} />
          </Label>
          <Button type="submit">Create</Button>
        </form>
      </Modal>
      {/* input이 있는 component는 분리를 할 것임, re-render에서 효율적이므로 */}
      <CreateChannelModal
        show={showCreateChannelModal}
        onCloseModal={onCloseModal}
        setShowCreateChannelModal={setShowCreateChannelModal}
      />
      <InviteWorkspaceModal
        show={showInviteWorkspaceModal}
        onCloseModal={onCloseModal}
        setShowInviteWorkspaceModal={setShowInviteWorkspaceModal}
      />
      <InviteChannelModal
        show={showInviteChannelModal}
        onCloseModal={onCloseModal}
        setShowInviteChannelModal={setShowInviteChannelModal}
      />
    </div>
  );
};

export default Workspace;

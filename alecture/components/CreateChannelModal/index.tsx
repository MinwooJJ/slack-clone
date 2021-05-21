import Modal from '@components/Modal';
import useInput from '@hooks/useInput';
import { Button, Input, Label } from '@pages/SignUp/styles';
import { IChannel, IUser } from '@typings/db';
import fetcher from '@utils/fetcher';
import axios from 'axios';
import React, { useCallback, VFC } from 'react';
import { useParams } from 'react-router';
import { toast } from 'react-toastify';
import useSWR from 'swr';

interface Props {
  show: boolean;
  onCloseModal: () => void;
  setShowCreateChannelModal: (flag: boolean) => void;
}

// component를 따로 빼면 가독성이 좋아지기 때문에 유지, 보수에도 좋음
// 화면에 띄워지는 JSX 부분을 먼저 설계 후 eventlistener를 작성하는 것이 편함
const CreateChannelModal: VFC<Props> = ({ show, onCloseModal, setShowCreateChannelModal }) => {
  const [newChannel, onChangeNewChannel, setNewChannel] = useInput('');
  // router에서 parameter로 선언해 놓은 값들
  // 주소를 체계적으로 정해놓으면 주소에 데이터를 저장해놓고 사용 할 수 있기에 중요함
  const { workspace, channel } = useParams<{ workspace: string; channel: string }>();

  const {
    data: userData,
    error,
    revalidate,
    mutate,
  } = useSWR<IUser | false>('/api/users', fetcher, { dedupingInterval: 2000 });

  const { data: channelData, revalidate: revalidateChannel } = useSWR<IChannel[]>(
    userData ? `/api/workspaces/${workspace}/channels` : null,
    fetcher,
  );

  const onCreateChannel = useCallback(
    (e) => {
      // server에게 정확한 정보를 전달해 주어야 함, channel 생성을 해야 한다는 것은 인지하나 어떠한 workspace인지를 모름
      e.preventDefault();
      axios
        .post(
          `/api/workspaces/${workspace}/channels`,
          {
            name: newChannel,
          },
          { withCredentials: true }, // cookie가 전달되어 누가 생성하는건지 알 수 있음
        )
        .then(() => {
          setShowCreateChannelModal(false);
          revalidateChannel(); // channel 생성 후 새로 추가된 channel이 있는 데이터를 SWR에 저장
          setNewChannel('');
        })
        .catch((error) => {
          console.dir(error);
          toast.error(error.response?.data, { position: 'bottom-center' });
        });
    },
    [newChannel],
  );

  return (
    <Modal show={show} onCloseModal={onCloseModal}>
      <form onSubmit={onCreateChannel}>
        <Label id="channel-label">
          <span>Channel</span>
          <Input id="channel" value={newChannel} onChange={onChangeNewChannel} />
        </Label>
        <Button type="submit">Create</Button>
      </form>
    </Modal>
  );
};

export default CreateChannelModal;

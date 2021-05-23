import io from 'socket.io-client';
import { useCallback } from 'react';

// 공통되는 변수 같은 경우는 따로 const로 빼서 관리하는것이 좋음
const backUrl = 'http://localhost:3095';
// typescript에서 빈 객체 or 배열의 경우는 typing을 해줘야 함
// [key: string]: workspace가 어떠한 값이 될 수도 있고 어떤 key든 string이면 된다라는 뜻
// SocketIOClient.Socket: .connect의 return 값
const sockets: { [key: string]: SocketIOClient.Socket } = {};

// type을 인식하지 못하는 경우에는 정확히 언급해주어야 함
const useSocket = (workspace?: string): [SocketIOClient.Socket | undefined, () => void] => {
  const disconnect = useCallback(() => {
    if (workspace) {
      sockets[workspace].disconnect();
      delete sockets[workspace];
    }
  }, [workspace]);

  if (!workspace) {
    return [undefined, disconnect];
  }

  if (!sockets[workspace]) {
    // 서버와 연결
    // socket.io에 연결 할 계층을 잘 선택해서 연결해야 함
    // namespace와 room이 존재
    sockets[workspace] = io.connect(`${backUrl}/ws-${workspace}`, {
      // http 요청말고 websocket만 사용해라라는 지시
      transports: ['websocket'],
    });
  }

  return [sockets[workspace], disconnect];
};

export default useSocket;

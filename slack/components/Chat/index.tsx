import { IChat, IDM } from '@typings/db';
import React, { memo, useMemo, VFC } from 'react';
import { ChatWrapper } from './styles';
import gravatar from 'gravatar'; // random으로 icon을 만들어주는 API
import dayjs from 'dayjs';
import regexifyString from 'regexify-string';
import { stringify } from 'querystring';
import { Link, useParams } from 'react-router-dom';

interface Props {
  data: IDM | IChat;
}

// 정규표현식은 연산이 많이 들어가기에 성능에 좋지 않다, useMemo: props가 똑가
// '\'는 특수기호를 무력화
// \d 숫자, + 1개 이상, ? 0개나 1개, * 0개 이상, g 모두 찾기, | 또는, \n 줄바꿈
// ()로 정규표현식을 묶는 건 grouping이라는 것이며 묶인 값이 아래에선 arr[1], arr[2]...에 추가됨
// img 업로드 추가
const BACK_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:3095' : 'https://sleact.nodebird.com';
const Chat: VFC<Props> = ({ data }) => {
  const { workspace } = useParams<{ workspace?: string }>();
  // DM or Channel
  const user = 'Sender' in data ? data.Sender : data.User;

  // 응답온 string가 uploads\\로 오면 img 태그에 넣어라
  const result = useMemo(
    () =>
      // upload\\서버주소
      data.content.startsWith('uploads\\') ? (
        <img src={`${BACK_URL}/${data.content}`} style={{ maxHeight: 200 }} />
      ) : (
        regexifyString({
          input: data.content,
          pattern: /@\[(.+?)\]\((\d+?)\)|\n/g, // 아이디나 줄 바꿈을 보면 decorator와 같이 바꿔라
          decorator(match, index) {
            const arr: string[] | null = match.match(/@\[(.+?)\]\((\d+?)\)/)!; // 아이디만
            // 아이디에 걸리면 아이디 하이라이트 후 그 사람에게 DM 보내기
            if (arr) {
              return (
                <Link key={match + index} to={`/workspace/${workspace}/dm/${arr[2]}`}>
                  @{arr[1]}
                </Link>
              );
            }
            return <br key={index} />; // 줄 바꿈
          },
        })
      ),
    [data.content],
  );

  return (
    <ChatWrapper>
      <div className="chat-img">
        <img src={gravatar.url(user.email, { s: '36px', d: 'retro' })} alt={user.nickname} />
      </div>
      <div className="chat-text">
        <div className="chat-user">
          <b>{user.nickname}</b>
          <span>{dayjs(data.createdAt).format(' h:mm A')}</span>
        </div>
        <p>{result}</p>
      </div>
    </ChatWrapper>
  );
};

export default memo(Chat);

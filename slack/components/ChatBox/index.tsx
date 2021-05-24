import { ChatArea, EachMention, Form, MentionsTextarea, SendButton, Toolbox } from './styles';
import React, { useCallback, useEffect, useRef, VFC } from 'react';
// textarea를 자동으로 늘려주는 라이브러리
import autosize from 'autosize';
// @hashtag하여 사용자지정하는 라이브러리
import { Mention, SuggestionDataItem } from 'react-mentions';
import useSWR from 'swr';
import fetcher from '@utils/fetcher';
import { IUser } from '@typings/db';
import gravatar from 'gravatar';
import { useParams } from 'react-router';

interface Props {
  chat: string;
  onSubmitForm: (e: any) => void;
  onChangeChat: (e: any) => void;
  placeholder?: string;
}

// 여러곳에서 재사용을 해야 될 경우에는 props로 작업을 부모로 올려서 부모쪽에서 구체적인 작업을 하게끔 해야함
// 재사용되는데 서로 다른 데이터는 props로 가져오고 공통되는것은 component에서 SWR로 가져옴
const ChatBox: VFC<Props> = ({ chat, onSubmitForm, onChangeChat, placeholder }) => {
  const { workspace } = useParams<{ workspace: string }>();
  // 데이터를 가져 올 때 따로 고민하지 않고 복사해서 SWR로 가져오면 알아서 공유되기 때문에 편함
  const {
    data: userData,
    error,
    revalidate,
    mutate,
  } = useSWR<IUser | false>('/api/users', fetcher, { dedupingInterval: 2000 });
  const { data: memberData } = useSWR<IUser[]>(userData ? `/api/workspaces/${workspace}/members` : null, fetcher);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textareaRef.current) {
      autosize(textareaRef.current);
    }
  }, []);

  // keydown 이벤트를 이용해 enter --> submit, enter + shift --> 줄바꿈
  // props로 갖고온 것들은 왠만하면 deps에 넣어야 함
  const onKeyDownChat = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        if (!e.shiftKey) {
          onSubmitForm(e);
        }
      }
    },
    [onSubmitForm],
  );

  const renderSuggestion = useCallback(
    (
      suggestion: SuggestionDataItem,
      search: string,
      highlightedDisplay: React.ReactNode,
      index: number,
      focus: boolean,
    ): React.ReactNode => {
      if (!memberData) return;

      return (
        <EachMention focus={focus}>
          <img
            src={gravatar.url(memberData[index].email, { s: '20px', d: 'retro' })}
            alt={memberData[index].nickname}
          />
          {/* 선택 된 사람의 하이라이트 처리 */}
          <span>{highlightedDisplay}</span>
        </EachMention>
      );
    },
    [memberData],
  );

  // react-mentions는 아래와 같은 구조여야 함
  // <MentionsInput>
  //   <Mention></Mention>
  // </MentionsInput>
  return (
    <ChatArea>
      <Form onSubmit={onSubmitForm}>
        <MentionsTextarea
          id="editor-chat"
          value={chat}
          onChange={onChangeChat}
          onKeyDown={onKeyDownChat}
          placeholder={placeholder}
          // tag에 직접 접근하고 싶을때 ref 사용
          inputRef={textareaRef}
          allowSuggestionsAboveCursor
        >
          {/* textarea 기능을 Mention이 덮어 씀 */}
          <Mention
            appendSpaceOnAdd
            trigger="@"
            data={memberData?.map((v) => ({ id: v.id, display: v.nickname })) || []}
            renderSuggestion={renderSuggestion}
          />
        </MentionsTextarea>
        <Toolbox>
          <SendButton
            className={
              'c-button-unstyled c-icon_button c-icon_button--light c-icon_button--size_medium c-texty_input__button c-texty_input__button--send' +
              (chat?.trim() ? '' : ' c-texty_input__button--disabled')
            }
            data-qa="texty_send_button"
            aria-label="Send message"
            data-sk="tooltip_parent"
            type="submit"
            disabled={!chat?.trim()}
          >
            <i className="c-icon c-icon--paperplane-filled" aria-hidden="true" />
          </SendButton>
        </Toolbox>
      </Form>
    </ChatArea>
  );
};

export default ChatBox;

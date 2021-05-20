import React, { CSSProperties, FC, useCallback } from 'react';
import { CloseModalButton, CreateMenu } from './styles';

// type을 interface로 정의하여 generic으로 선언
interface Props {
  show: boolean;
  style: CSSProperties;
  onCloseModal: (e: any) => void;
  closeButton?: boolean;
}

// 재사용이 가능하므로 component로 빼서 구현
const Menu: FC<Props> = ({ children, style, show, onCloseModal, closeButton }) => {
  // event bubbling 효과를 막는것, 자식 tag에서 event가 일어났을경우 부모 tag까지 영향을 미치는 것
  const stopPropagation = useCallback((e) => {
    e.stopPropagation();
  }, []);

  if (!show) {
    return null;
  }

  return (
    <CreateMenu onClick={onCloseModal}>
      <div style={style} onClick={stopPropagation}>
        {closeButton && <CloseModalButton onClick={onCloseModal}>&times;</CloseModalButton>}
        {children}
      </div>
    </CreateMenu>
  );
};

// Props의 기본값 설정
Menu.defaultProps = {
  closeButton: true,
};

export default Menu;

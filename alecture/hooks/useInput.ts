import { ChangeEvent, Dispatch, SetStateAction, useCallback, useState } from 'react';

// 함수 parameter의 경우는 type을 지정해주어야 한다
type ReturnType<T = any> = [T, (e: ChangeEvent<HTMLInputElement>) => void, Dispatch<SetStateAction<T>>];

const useInput = <T>(initialData: T): ReturnType<T> => {
  const [value, setValue] = useState(initialData);

  const handler = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    // type을 강제로 바꾸는 것
    setValue(e.target.value as unknown as T);
  }, []);

  return [value, handler, setValue];
};

export default useInput;

import { Dispatch, SetStateAction, useCallback, useState } from 'react';

// 함수 parameter의 경우는 type을 지정해주어야 한다
type ReturnType<T = any> = [T, (e: any) => void, Dispatch<SetStateAction<T>>];

const useInput = <T = any>(initialData: T): ReturnType<T> => {
  const [value, setValue] = useState(initialData);

  const handler = useCallback((e: any) => {
    setValue(e.target.value);
  }, []);

  return [value, handler, setValue];
};

export default useInput;

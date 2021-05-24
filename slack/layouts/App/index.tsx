import React from 'react';
import loadable from '@loadable/component';
import { Switch, Route, Redirect } from 'react-router-dom';

// Code splitting
const SignIn = loadable(() => import('@pages/SignIn'));
const SignUp = loadable(() => import('@pages/SignUp'));
const Workspace = loadable(() => import('@layouts/Workspace'));

// layout 정하는 2가지
// 1. 각각의 page에서 layout으로 감싸주고 children props로 받기, router의 구조가 계층구조가 아닌 경우
// 2. layout에서 children이 누가 될지 판단, router로 결정, router의 구조가 계층구조일 경우( nested route)
const App = () => {
  return (
    <Switch>
      <Redirect exact path="/" to="/signin" />
      <Route path="/signin" component={SignIn} />
      <Route path="/signup" component={SignUp} />
      {/* /:( route prameter)을 붙이면 특수한 역할을 함, 사용자가 자유롭게 값을 바꿀 수 있는 부분 */}
      {/* /workspace/test, /workspace/dm... 모두 같은 주소를 나타냄  */}
      {/* parameter가 아닌 값을 위에 선언해주어야 의도된 바로 동작 할 것임 */}
      <Route path="/workspace/:workspace" component={Workspace} />
    </Switch>
  );
};

export default App;

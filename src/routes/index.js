/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-2016 Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import App from '../components/App';

// Child routes
import home from './home';
import contact from './contact';
import signin from './signin';
import signup from './signup';
import topicPage from './topicPage'
import content from './content';
import error from './error';

import { Provider } from 'react-redux';
import configureStore from '../store/configureStore';

const store = configureStore();

export default {

  path: '/',

  // keep in mind, routes are evaluated in order
  children: [
    home,
    contact,
    signin,
    signup,
    topicPage,
    // place new routes before...
    content,
    error,
  ],

  async action({ next, render, context }) {
    const component = await next();
    if (component === undefined) return component;
    return render(
      <Provider store={store}>
        <App context={context}>{component}</App>
      </Provider>
    );
  },

};

/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-2016 Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import Home from './Home';
import fetch from '../../core/fetch';

export default {

  path: '/',

  async action() {
    const resp = await fetch('api/v1/topics');
    const { success, data } = await resp.json();
    if ( !success || !data) throw new Error('Failed to load the topic.');
    return <Home topics={data} />;
  },
};

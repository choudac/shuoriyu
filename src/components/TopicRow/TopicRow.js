/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-2016 Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React, { Component, PropTypes } from 'react';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import s from './TopicRow.css';
import Link from '../Link';

class TopicRow extends Component {

  static propTypes = {
    index: PropTypes.number.isRequired,
    item: PropTypes.object.isRequired
  };

  render() {
    let to = `/topic/${this.props.item.id}`;
    return (
      <div className={s.item}>
        <span className={s.index}>{this.props.index}</span>
         <Link className={s.link} to={to}>{this.props.item.title}</Link>
      </div>
    );
  }
}

export default withStyles(s)(TopicRow);
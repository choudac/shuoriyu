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
import { Col, Alert } from 'react-bootstrap';
import SignupComp from '../../components/Signup';
import connectComponent from '../../utils/connectComponent';
import history from '../../core/history';

const title = '注册';

class Signup extends Component {
  static contextTypes = {
    setTitle: PropTypes.func.isRequired,
  };

  constructor() {
    super();
    this.state = {
      signinButNotActive: false
    };
  }

  componentWillMount() {
    this.context.setTitle(title);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.secret && nextProps.secret._id) {
      console.log(nextProps.secret);
      if (nextProps.active) {
        history.push('/');
      } else {
        this.setState({signinButNotActive: true});
      }
    }
  }

  _onSubmit(name, email, password, rePassword, code) {
    const { actions } = this.props;
    this.props.actions.onSignup(name, email, password, rePassword, code);
  }

  render() {
    if (this.state.signinButNotActive) {
      return (
        <Col md={4} mdOffset={4}>
          <Alert bsStyle="warning">
            <strong>您好，{this.props.secret.loginname}</strong> <br/>
            您的账号注册成功，请登录你的注册邮箱 {this.props.secret.email} 激活账号。
          </Alert>
        </Col>
      );   
    } else {
      return (
        <Col md={4} mdOffset={4}>
          <SignupComp onSubmit={this._onSubmit.bind(this)} />
        </Col>
      );      
    }
  }
}

const LayoutComponent = Signup;
function mapStateToProps(state) {
  return {
    secret: state.auth.secret || {}
  }
}

export default connectComponent({LayoutComponent, mapStateToProps});

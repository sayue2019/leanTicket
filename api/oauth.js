const router = require('express').Router()
const qs = require('qs')
const _ = require('lodash')
const request = require('request-promise')
const AV = require('leanengine')

const config = require('../config')
const common = require('./common')

const wechat = require('./wechat')

const serverDomain = 'https://open.weixin.qq.com'
const oauthScope = 'snsapi_base'


exports.orgName = 'WeChat'

exports.login = (callbackUrl) => {
  return (req, res) => {
    const loginUrl = serverDomain + '/connect/oauth2/authorize?' +
      qs.stringify({
        appid: config.wechatCorpID,
        response_type: 'code',
        redirect_uri: callbackUrl,
        scope: oauthScope,
        state: '',
      }) + '#wechat_redirect'
    res.redirect(loginUrl)
  }
}

exports.loginCallback = (callbackUrl) => {
  return (req, res) => {
    wechat.getAccessToken(req.query.code, callbackUrl).then((accessToken) => {
      accessToken.openid = '' + accessToken.UserId
      //console.log(JSON.stringify(accessToken))
      return AV.User.loginWithAuthData(accessToken, 'wechat')
    }).then((user) => {
      //console.log(JSON.stringify(user))
      if (_.isEqual(user.createdAt, user.updatedAt)) {
        // 第一次登录，从 LeanCloud 初始化用户信息
        return initUserInfo(user)
      }
      return user
    }).then((user) => {
      res.redirect('/login?token=' + user._sessionToken)
    })
  }
}

const initUserInfo = (user) => {
  return getClientInfo(user)
  .then((client) => {
    console.log(JSON.stringify(client))
    return user.save({
      username: client.userid.toLowerCase(),
      name: client.name,
      wechatEnterpriseUserId: client.userid,
      email: client.email,
      mobilePhoneNumber: client.mobile,


    },{useMasterKey: true})
  })
}

const getClientInfo = (user) => {
  if (user.get('authData') && user.get('authData').wechat) {
    const authData = user.get('authData').wechat
    if(authData && authData.UserId) {
      return wechat.getUserInfo(authData.UserId)
    }
  }
  
  throw new AV.Cloud.Error(`Could not find Wechat authData: userId=${user.id}`, {status: 404})
}




exports.router = router
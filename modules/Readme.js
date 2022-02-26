/*global SITE_NAME*/

import React from 'react'
import DocumentTitle from 'react-document-title'

export default function Readme() {
  var fullTitle = '说明 - '+ SITE_NAME
  return <div>
    <DocumentTitle title= {fullTitle} />
    <h1 className='font-logo'>说明</h1>
    <hr />
    <p>该应用是基于<a href='https://leancloud.cn/'>LeanCloud</a> 免费开发版的工单系统，并发线程限制3个。</p>
    <p>第一次使用请关注企业微信插件公众号，提交工单在微信中直接登陆使用。</p>
    <p>如需要在电脑端使用请在微信中登陆后 个人设置 中修改登陆密码，即可在电脑上使用用户号和密码登陆。</p>
  </div>
}

Readme.displayName = 'Readme'

/*global $*/
import _ from 'lodash'
import React from 'react'
import PropTypes from 'prop-types'
import {FormGroup, ControlLabel, FormControl, Button, Tooltip, OverlayTrigger} from 'react-bootstrap'
import AV from 'leancloud-storage/live-query'

import TextareaWithPreview from './components/TextareaWithPreview'
import {uploadFiles, getCategoriesTree, depthFirstSearchFind, getTinyCategoryInfo, getTicketAcl, OrganizationSelect, TagForm} from './common'

export default class NewTicket extends React.Component {

  constructor(props) {
    super(props)
    let org = null
    if (this.props.selectedOrgId && this.props.selectedOrgId.length > 0) {
      org = _.find(this.props.organizations, {id: this.props.selectedOrgId})
    }
    this.state = {
      ticket: new AV.Object('Ticket', {
        organization: org,
        title: '',
        category: null,
        content: '',
        files: [],
        tags: [],
        ACL: getTicketAcl(AV.User.current(), org),
      }),
      categoriesTree: [],
      isCommitting: false,
      categoryPath: [],
    }
  }

  componentDidMount() {
    this.contentTextarea.addEventListener('paste', this.pasteEventListener.bind(this))
    return getCategoriesTree()
    .then(categoriesTree => {
      let {
        title=(localStorage.getItem('ticket:new:title') || ''),
        categoryIds=JSON.parse(localStorage.getItem('ticket:new:categoryIds') || '[]'),
        content=(localStorage.getItem('ticket:new:content') || '')
      } = this.props.location.query

      const categoryPath = _.compact(categoryIds.map(cid => depthFirstSearchFind(categoriesTree, c => c.id == cid)))
      const category = _.last(categoryPath)
      if (content === '' && category && category.get('qTemplate')) {
        content = category.get('qTemplate')
      }
      const ticket = this.state.ticket
      ticket.set('title', title)
      ticket.set('content', content)
      this.setState({
        ticket,
        categoriesTree,
        categoryPath,
      })
      return
    })
    .catch(this.context.addNotification)
  }

  componentWillUnmount() {
    this.contentTextarea.removeEventListener('paste', this.pasteEventListener.bind(this))
  }

  pasteEventListener(e) {
    if (e.clipboardData.types.indexOf('Files') != -1) {
      this.setState({isCommitting: true})
      return uploadFiles(e.clipboardData.files)
      .then((files) => {
        const ticket = this.state.ticket
        const content = `${ticket.get('content')}\n<img src='${files[0].url()}' />`
        ticket.set('content', content)
        this.setState({isCommitting: false, ticket})
        return
      })
    }
  }

  handleTitleChange(e) {
    localStorage.setItem('ticket:new:title', e.target.value)
    const ticket = this.state.ticket
    ticket.set('title', e.target.value)
    this.setState({ticket})
  }

  handleCategoryChange(e, index) {
    const categoryPath = this.state.categoryPath.slice(0, index)

    const category = depthFirstSearchFind(this.state.categoriesTree, c => c.id === e.target.value)
    if (!category) {
      localStorage.setItem('ticket:new:categoryIds', JSON.stringify(categoryPath.map(c => c.id)))
      this.setState({categoryPath})
      return
    }

    categoryPath.push(category)
    const ticket = this.state.ticket
    if (ticket.get('content') && category.get('qTemplate')) {
      if (confirm('?????????????????????????????????????????????????????????????????????????????????????????????\n\n???????????????')) {
        localStorage.setItem('ticket:new:categoryIds', JSON.stringify(categoryPath.map(c => c.id)))
        localStorage.setItem('ticket:new:content', category.get('qTemplate'))
        ticket.set('content', category.get('qTemplate'))
        this.setState({categoryPath, ticket})
        return
      } else {
        return false
      }
    }

    const content = category.get('qTemplate') || ticket.get('content') || ''
    localStorage.setItem('ticket:new:categoryIds', JSON.stringify(categoryPath.map(c => c.id)))
    localStorage.setItem('ticket:new:content', content)
    ticket.set('content', content)
    this.setState({categoryPath, ticket})
  }

  changeTagValue(key, value) {
    const ticket = this.state.ticket
    const tags = ticket.get('tags')
    let tag = _.find(tags, {key})
    if (!tag) {
      tags.push({key, value})
    } else {
      tag.value = value
    }
    this.setState({ticket})
  }

  handleContentChange(e) {
    localStorage.setItem('ticket:new:content', e.target.value)
    const ticket = this.state.ticket
    ticket.set('content', e.target.value)
    this.setState({ticket})
  }

  handleSubmit(e) {
    e.preventDefault()

    const ticket = this.state.ticket
    if (!ticket.get('title') || ticket.get('title').trim().length === 0) {
      this.context.addNotification(new Error('??????????????????'))
      return
    }
    if (!this.state.categoryPath) {
      this.context.addNotification(new Error('????????????????????????'))
      return
    }
    if (_.last(this.state.categoryPath).children.length > 0) {
      this.context.addNotification(new Error('?????????????????????'))
      return
    }

    this.setState({isCommitting: true})
    return uploadFiles($('#ticketFile')[0].files)
    .then((files) => {
      ticket.set('category', getTinyCategoryInfo(_.last(this.state.categoryPath)))
      ticket.set('files', files)
      return ticket.save()
    })
    .then(() => {
      this.setState({isCommitting: false})
      return
    })
    .then(() => {
      localStorage.removeItem('ticket:new:title')
      localStorage.removeItem('ticket:new:content')
      this.context.router.push('/tickets')
      return
    })
    .catch(this.context.addNotification)
  }

  render() {
    const getSelect = (categories, selectCategory, index) => {
      if (categories.length == 0) {
        return
      }

      const options = categories.map((category) => {
        return (
          <option key={category.id} value={category.id}>{category.get('name')}</option>
        )
      })
      return (
        <FormGroup key={'categorySelect' + index}>
          <ControlLabel>{index == 0 ? '???????????????' : index + 1 + ' ????????????'}</ControlLabel>
          <FormControl componentClass="select" value={selectCategory && selectCategory.id || ''} onChange={(e) => this.handleCategoryChange(e, index)}>
            <option key='empty'></option>
            {options}
          </FormControl>
        </FormGroup>
      )
    }

    const categorySelects = []
    for (let i = 0; i < this.state.categoryPath.length + 1; i++) {
      const selected = this.state.categoryPath[i]
      if (i == 0) {
        categorySelects.push(getSelect(this.state.categoriesTree, selected, i))
      } else {
        categorySelects.push(getSelect(this.state.categoryPath[i - 1].children, selected, i))
      }
    }

    const tooltip = (
      <Tooltip id="tooltip">?????? Markdown ??????</Tooltip>
    )
    const ticket = this.state.ticket
    return (
      <div>
        <form onSubmit={this.handleSubmit.bind(this)}>
          {this.props.organizations.length > 0 && <OrganizationSelect organizations={this.props.organizations}
            selectedOrgId={this.props.selectedOrgId}
            onOrgChange={this.props.handleOrgChange} />}
          <FormGroup>
            <ControlLabel>?????????</ControlLabel>
            <input type="text" className="form-control" value={ticket.get('title')} onChange={this.handleTitleChange.bind(this)} />
          </FormGroup>

          {categorySelects}

          {this.context.tagMetadatas.map(tagMetadata => {
            const tags = ticket.get('tags')
            const tag = _.find(tags, t => t.key == tagMetadata.get('key'))
            return <TagForm key={tagMetadata.id}
                            tagMetadata={tagMetadata}
                            tag={tag}
                            changeTagValue={this.changeTagValue.bind(this)} />
          })}

          <FormGroup>
            <ControlLabel>
              ??????????????? <OverlayTrigger placement="top" overlay={tooltip}>
                <b className="has-required" title="?????? Markdown ??????">M???</b>
              </OverlayTrigger>
            </ControlLabel>
            <TextareaWithPreview componentClass="textarea" placeholder="?????????????????????????????????????????????" rows="8"
              value={ticket.get('content')}
              onChange={this.handleContentChange.bind(this)}
              inputRef={(ref) => this.contentTextarea = ref }
            />
          </FormGroup>
          <FormGroup>
            <input id="ticketFile" type="file" multiple />
          </FormGroup>
          <Button type='submit' disabled={this.state.isCommitting} bsStyle='success'>??????</Button>
        </form>
      </div>
    )
  }

}

NewTicket.contextTypes = {
  router: PropTypes.object,
  addNotification: PropTypes.func.isRequired,
  tagMetadatas: PropTypes.array,
}

NewTicket.propTypes = {
  location: PropTypes.object,
  organizations: PropTypes.array,
  handleOrgChange: PropTypes.func,
  selectedOrgId: PropTypes.string,
}


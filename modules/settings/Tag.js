import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Form, FormGroup, ControlLabel, FormControl, InputGroup, Checkbox, Radio, Button, OverlayTrigger, Tooltip} from 'react-bootstrap'
import AV from 'leancloud-storage/live-query'

export default class Tag extends Component {

  constructor(props) {
    super(props)
    this.state = {
      tagMetadata: null,
      isSubmitting: false,
    }
  }

  componentDidMount() {
    const id = this.props.params.id
    return Promise.resolve()
    .then(() => {
      if (id == 'new') {
        return new AV.Object('TagMetadata', {
          key: '',
          type: 'select',
          values: [],
          isPrivate: false,
          ACL: {
            'role:customerService': {write: true, read: true}
          },
        })
      } else {
        const tagMetadata = AV.Object.createWithoutData('TagMetadata', id)
        return tagMetadata.fetch()
      }
    })
    .then(tagMetadata => {
      this.setState({
        tagMetadata,
      })
      return
    })
  }

  handleChangePrivate(isPrivate) {
    const tagMetadata = this.state.tagMetadata
    if (isPrivate) {
      tagMetadata.set('isPrivate', true)
    } else {
      tagMetadata.set('isPrivate', false)
    }
    this.setState({tagMetadata})
  }

  handleKeyChange(e) {
    const tagMetadata = this.state.tagMetadata
    tagMetadata.set('key', e.target.value)
    this.setState({tagMetadata})
  }

  handleTypeChange(e) {
    const tagMetadata = this.state.tagMetadata
    tagMetadata.set('type', e.target.value)
    this.setState({tagMetadata})
  }

  addValueItem() {
    const tagMetadata = this.state.tagMetadata
    tagMetadata.get('values').push('')
    this.setState({tagMetadata})
  }

  changeValue(index, value) {
    const tagMetadata = this.state.tagMetadata
    tagMetadata.get('values')[index] = value
    this.setState({tagMetadata})
  }

  handleSortUpdate(value, oriIndex, newIndex) {
    const tagMetadata = this.state.tagMetadata
    const values = tagMetadata.get('values')
    values.splice(oriIndex, 1)
    values.splice(newIndex, 0, value)
    this.setState({tagMetadata})
  }

  handleRemoveItem(index) {
    const tagMetadata = this.state.tagMetadata
    tagMetadata.get('values').splice(index, 1)
    this.setState({tagMetadata})
  }

  handleRemove() {
    const result = confirm('????????????????????????' + this.state.tagMetadata.get('key'))
    if (result) {
      return this.state.tagMetadata.destroy()
      // TODO ???????????? ticket ?????????
      .then(() => {
        this.context.refreshTagMetadatas()
        this.context.router.push('/settings/tags')
        return
      })
      .catch(this.context.addNotification)
    }
  }

  handleSubmit(e) {
    e.preventDefault()
    this.setState({isSubmitting: true})

    const tagMetadata = this.state.tagMetadata
    const acl = {
      '*': {read: !tagMetadata.get('isPrivate')},
      'role:customerService': {write: true, read: true}
    }
    tagMetadata.set('ACL', acl)
    return tagMetadata.save()
    .then(() => {
      this.setState({isSubmitting: false})
      this.context.refreshTagMetadatas()
      this.context.router.push(`/settings/tags/${tagMetadata.id}`)
      return
    })
    .then(this.context.addNotification)
    .catch(this.context.addNotification)
  }

  render() {
    const tagMetadata = this.state.tagMetadata
    if (!tagMetadata) {
      return <div>???????????????</div>
    }

    return <Form onSubmit={this.handleSubmit.bind(this)}>
      <FormGroup controlId="tagNameText">
        <ControlLabel>????????????</ControlLabel>
        <FormControl type="text" value={tagMetadata.get('key')} onChange={this.handleKeyChange.bind(this)} />
      </FormGroup>
      <FormGroup>
        <ControlLabel>??????</ControlLabel>
        <Checkbox
          checked={tagMetadata.get('isPrivate')}
          onChange={(e) => this.handleChangePrivate(e.target.checked)}>
          ?????????
          {' '}<OverlayTrigger placement="right" overlay={
            <Tooltip id="tooltip">
              ????????????????????????????????????????????????????????????
            </Tooltip>}>
            <span className="glyphicon glyphicon-question-sign" aria-hidden="true"></span>
          </OverlayTrigger>
        </Checkbox>
      </FormGroup>
      <FormGroup>
        <ControlLabel>??????</ControlLabel>
        <Radio name="tagTypeGroup" value='select' checked={tagMetadata.get('type') == 'select'} onChange={this.handleTypeChange.bind(this)}>
          ????????????
          {' '}<OverlayTrigger placement="right" overlay={
            <Tooltip id="tooltip">
              ???????????????????????????????????????????????????
            </Tooltip>}>
            <span className="glyphicon glyphicon-question-sign" aria-hidden="true"></span>
          </OverlayTrigger>
        </Radio>
        <Radio name="tagTypeGroup" value="text" checked={tagMetadata.get('type') == 'text'} onChange={this.handleTypeChange.bind(this)}>
          ????????????
          {' '}<OverlayTrigger placement="right" overlay={
            <Tooltip id="tooltip">
              ????????????????????????????????????????????????
            </Tooltip>}>
            <span className="glyphicon glyphicon-question-sign" aria-hidden="true"></span>
          </OverlayTrigger>
        </Radio>{' '}
      </FormGroup>
      {tagMetadata.get('type') == 'select' &&
        <FormGroup>
          <ControlLabel>???????????????</ControlLabel>
          {tagMetadata.get('values').map((value, index, array) => {
            return <InputGroup key={index}>
                <FormControl type='text' value={value} onChange={(e) => this.changeValue(index, e.target.value)} />
                <InputGroup.Button>
                  <Button disabled={index == 0} onClick={() => this.handleSortUpdate(value, index, index - 1)}><span className="glyphicon glyphicon glyphicon-chevron-up" aria-hidden="true" /></Button>
                  <Button disabled={index == array.length - 1} onClick={() => this.handleSortUpdate(value, index, index + 1)}><span className="glyphicon glyphicon glyphicon-chevron-down" aria-hidden="true" /></Button>
                  <Button onClick={() => this.handleRemoveItem(index)}><span className="glyphicon glyphicon-remove" aria-hidden="true" /></Button>
                </InputGroup.Button>
              </InputGroup>
          })}
          <Button type='button' onClick={this.addValueItem.bind(this)}><span className="glyphicon glyphicon glyphicon-plus" aria-hidden="true" /></Button>
        </FormGroup>
      }
      <Button type='submit' bsStyle='success'>??????</Button>
      {' '}
      {this.state.tagMetadata.id
        && <Button type='button' onClick={this.handleRemove.bind(this)} bsStyle="danger">??????</Button>}
      {' '}
      <Button type='button' onClick={() => this.context.router.push('/settings/tags')}>??????</Button>
    </Form>
  }
}

Tag.propTypes = {
  params: PropTypes.object.isRequired,
}

Tag.contextTypes = {
  router: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  refreshTagMetadatas: PropTypes.func.isRequired,
}

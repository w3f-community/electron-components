import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

import {
  InputGroup,
  Input,
  InputGroupAddon,
  FormText,
  FormFeedback,
} from 'reactstrap'

import debounce from 'lodash/debounce'

export default class DebouncedInput extends PureComponent {
  static propTypes = {
    onChange: PropTypes.func,
    debounce: PropTypes.number,
    initialValue: PropTypes.string,
    value: PropTypes.string,
    feedback: PropTypes.node,
    invalid: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.bool,
    ]),
  }

  static defaultProps = {
    onChange: () => {},
    debounce: 50
  }

  constructor (props) {
    super(props)
    this.state = {
      value: props.initialValue || props.value || ''
    }
    this.input = React.createRef()
  }

  componentDidMount () {
    this.handleDebounced = debounce(() => {
      this.props.onChange.apply(this, [this.state.value])
    }, this.props.debounce)
  }

  componentDidUpdate (prevProps) {
    if (this.props.value !== prevProps.value && this.props.value !== this.state.value) {
      this.setState({ value: this.props.value })
    }
  }

  onChange = event => {
    this.setState({ value: event.target.value })
    this.handleDebounced()
  }

  focus = () => this.input.current.focus()
  blur = () => this.input.current.blur()

  renderFeedback = (feedback, invalid) => {
    if (!feedback) {
      return null
    }
    if (typeof invalid !== 'boolean') {
      return <FormText>{feedback}</FormText>
    }
    return <FormFeedback valid={!invalid}>{feedback}</FormFeedback>
  }

  render () {
    const { addon, size, inputGroupClassName, feedback, invalid, children, ...props } = this.props
    return (
      <React.Fragment>
        <InputGroup
          size={size}
          className={classnames(inputGroupClassName, typeof invalid === 'boolean' && (invalid ? 'is-invalid' : 'is-valid'))}
        >
          { addon ? <InputGroupAddon addonType='prepend'>{addon}</InputGroupAddon> : null }
          <Input
            innerRef={this.input}
            bsSize={size}
            valid={typeof invalid === 'boolean' ? !invalid : undefined}
            invalid={typeof invalid === 'boolean' ? invalid : undefined}
            {...props}
            value={this.state.value}
            onChange={this.onChange}
          />
          {children}
        </InputGroup>
        {this.renderFeedback(feedback, invalid)}
      </React.Fragment>
    )
  }
}

import React, { PureComponent } from 'react'
import classnames from 'classnames'

import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'

import chalk from 'chalk'

import { getColor } from '@obsidians/ui-components'
import notification from '@obsidians/notification'

import 'xterm/css/xterm.css'

import TerminalInput from './TerminalInput'
import './styles.css'

import initTerminalChannel from './lib/initTerminalChannel'
import colorCommand from './lib/colorCommand'

export default class Terminal extends PureComponent {
  constructor(props) {
    super(props)
    this.initialized = false
    this.incompleteLine = ''
    this.termRef = React.createRef()
    this.inputRef = React.createRef()

    this.terminalChannel = initTerminalChannel(this.props.logId)
    this.terminalChannel.onData(this.onIpcData)
  }

  componentDidMount () {
    if (this.props.active) {
      this.initialized = true
      this.createTerm()
    }

    this.autofit = setInterval(() => {
      if (this.term && this.props.active) {
        this.resizeTerm()
      }
    }, 500)
  }

  componentDidUpdate (prevProps) {
    if (!this.initialized && this.props.active) {
      this.initialized = true
      this.createTerm()
    }
    if (!prevProps.active && this.props.active) {
      this.term && this.term.scrollLines(0)
    }
  }

  componentWillUnmount () {
    this.stop()
    this.terminalChannel.dispose()

    this.autofit && clearInterval(this.autofit)
    if (this.term) {
      this.term.dispose()
    }
  }

  onIpcData = (method, args) => {
    switch (method) {
      case 'executing':
        this.setState({ executing: args[0] })
        return
      case 'data':
        this.onLogReceived(args[0])
        return
      default:
        return
    }
  }

  resizeTerm () {
    try {
      this.termFitAddon.fit()
      this.term._core._charSizeService.measure()

      const { cols, rows } = this.term

      if (this.props.active) {
        if (this.cols === cols && this.rows === rows) {
          return
        }
        this.cols = cols
        this.rows = rows
        this.terminalChannel.invoke('resize', { cols: this.props.cols || cols, rows })
      }
    } catch (e) {
      console.warn(e)
    }
  }

  createTerm () {
    const el = this.termRef.current

    if (this.term) {
      return this.term
    }

    el.onmouseup = this.onMouseUpTerm

    const color = getColor('--color-text')
    const bgColor = getColor('--color-bg2')

    const term = new XTerm({
      fontSize: 13,
      fontFamily: this.props.font,
      theme: {
        foreground: color,
        background: bgColor,
        cursor: bgColor,
      }
    })

    this.termFitAddon = new FitAddon()
    term.loadAddon(this.termFitAddon)
    term.open(el)
    this.termFitAddon.fit()
    this.term = term

    if (this.props.onTermCreated) {
      this.props.onTermCreated(this.term)
    }

    if (this.preActiveMessage) {
      term.write(this.preActiveMessage)
      this.scrollToBottom()
    }
    
    if (this.props.cmd) {
      this.exec(this.props.cmd)
    }

    return this.term
  }

  onMouseUpTerm = event => {
    const selection = this.term.getSelection()

    if (event.button === 2) {
      navigator.clipboard.writeText(selection)
        .then(() => {
          if (this.props.onCopied) {
            this.props.onCopied()
          }
          notification.success('Copied', 'The selection content is copied to the clipboard.')
          this.term.clearSelection()
          this.focus()
        })
    } else if (!selection) {
      this.focus()
    }
  }

  focus () {
    this.inputRef.current && this.inputRef.current.focus()
  }

  clearContent () {
    this.term.reset()
  }

  scrollToBottom () {
    if (this.props.active) {
      this.resizeTerm()
      setTimeout(() => this.term && this.term.scrollToBottom(), 300)
    }
  }

  preActiveMessage = ''
  writeToTerminal (message) {
    if (this.initialized && this.term) {
      this.term.write(message)
      return
    }
    this.preActiveMessage += message
  }

  exec = async (cmd, config) => {
    this.inputRef.current && this.inputRef.current.setState({ executing: true })
    
    const result = await this.onInputSubmit(cmd, config)
    if (this.props.onFinished) {
      this.props.onFinished(result)
    }
    this.inputRef.current && this.inputRef.current.setState({ executing: false })

    return result
  }

  onInputSubmit = async (cmd, config) => {
    this.scrollToBottom()

    const mergedConfig = Object.assign({ cwd: this.props.cwd }, config)
    this.writeToTerminal(`${chalk.bold.gray('>')} ${colorCommand(cmd)}\n\r`)
    return await this.terminalChannel.invoke('exec', cmd, mergedConfig)
  }

  onLogReceived (message) {
    const parsedMessage = this.props.onLogReceived(message)
    this.writeToTerminal(parsedMessage)
    return
  }

  stop = async () => {
    await this.terminalChannel.invoke('kill')
  }

  render () {
    const {
      logId,
      height,
      className,
      Toolbar,
      readonly,
      input
    } = this.props

    return (
      <div
        className={classnames(`d-flex flex-column w-100 obsidians-terminal bg2`, className)}
        style={{ height }}
      >
        { Toolbar }
        <div className='xterm-wrapper'>
          <div ref={this.termRef} id={`xterm-${logId}`} className='xterm-element' />
        </div>
        { !readonly && input && 
          <TerminalInput ref={this.inputRef} onSubmit={this.onInputSubmit} onStop={this.stop} />
        }
      </div>
    )
  }
}

Terminal.propTypes = {

}

Terminal.defaultProps = {
  height: '100%',
  font: 'Hack, Menlo, monospace',
  className: '',
  Toolbar: null,
  onLogReceived: message => message,
}
